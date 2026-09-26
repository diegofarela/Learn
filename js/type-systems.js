/**
 * Static vs dynamic type-error discovery toggle.
 */
(function () {
  function initTsys() {
    var modeEl = document.getElementById("tsys-mode");
    var status = document.getElementById("tsys-status");
    var meta = document.getElementById("tsys-meta");
    var snippet = document.getElementById("tsys-snippet");
    var verdict = document.getElementById("tsys-verdict");
    var timeline = document.getElementById("tsys-timeline");
    var codeRoot = document.getElementById("tsys-code");
    var codeNote = document.getElementById("tsys-code-note");
    var codeLang = document.getElementById("tsys-code-lang");
    if (!modeEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var timers = [];

    function clearTimers() {
      timers.forEach(function (t) {
        clearTimeout(t);
      });
      timers = [];
    }

    function after(ms, fn) {
      if (reduceMotion) {
        fn();
        return;
      }
      timers.push(window.setTimeout(fn, ms));
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setActive(phase) {
      if (!timeline) return;
      timeline.querySelectorAll(".tsys-phase").forEach(function (el) {
        el.classList.toggle(
          "is-active",
          el.getAttribute("data-tsys-phase") === phase
        );
        el.classList.toggle(
          "is-error",
          el.getAttribute("data-tsys-phase") === "boom" && phase === "boom"
        );
      });
    }

    function renderIdle() {
      var staticMode = modeEl.value === "static";
      if (meta) meta.textContent = staticMode ? "static" : "dynamic";
      if (codeLang) codeLang.textContent = staticMode ? "static" : "dynamic";
      if (snippet) {
        snippet.textContent = staticMode
          ? 'fn add(a: int, b: int) -> int { … }\nadd("hi", 3)  // type error'
          : 'def add(a, b):\n    return a + b\nadd("hi", 3)  # blows up later';
      }
      if (codeRoot) {
        codeRoot.innerHTML = "";
        var lines = staticMode
          ? [
              "fn add(a: int, b: int) -> int { return a + b }",
              'add("hi", 3)',
              "// checker: expected int, found str"
            ]
          : [
              "def add(a, b): return a + b",
              'add("hi", 3)',
              "# runtime: TypeError on +"
            ];
        lines.forEach(function (line) {
          var row = document.createElement("div");
          row.className = "code-line";
          row.textContent = line;
          codeRoot.appendChild(row);
        });
      }
      if (verdict) {
        verdict.textContent = "—";
        verdict.className = "tsys-verdict";
      }
      setActive("edit");
      setStatus(
        staticMode
          ? "Static mode: a type error should appear at check time."
          : "Dynamic mode: the program starts; the error waits for that call."
      );
      if (codeNote) {
        codeNote.textContent = "Same bug, different discovery time.";
      }
    }

    function run() {
      clearTimers();
      var staticMode = modeEl.value === "static";
      setActive("edit");
      if (verdict) {
        verdict.textContent = "…";
        verdict.className = "tsys-verdict";
      }
      after(reduceMotion ? 0 : 400, function () {
        setActive("check");
        if (staticMode) {
          after(reduceMotion ? 0 : 500, function () {
            setActive("boom");
            if (verdict) {
              verdict.textContent = "Rejected at typecheck — never runs";
              verdict.classList.add("is-fail");
            }
            setStatus("Static checker caught str vs int before runtime.");
            if (codeNote) {
              codeNote.textContent = "Fail fast: bad programs do not ship.";
            }
          });
        } else {
          after(reduceMotion ? 0 : 400, function () {
            setActive("run");
            setStatus("Typecheck skipped / deferred — entering runtime…");
            after(reduceMotion ? 0 : 600, function () {
              setActive("boom");
              if (verdict) {
                verdict.textContent = "TypeError at runtime on add()";
                verdict.classList.add("is-fail");
              }
              setStatus("Dynamic: error appears only when the bad call executes.");
              if (codeNote) {
                codeNote.textContent = "Flexibility now, surprise later.";
              }
            });
          });
        }
      });
    }

    document.querySelectorAll("[data-tsys-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-tsys-action");
        if (a === "run") run();
        else if (a === "reset") {
          clearTimers();
          renderIdle();
        }
      });
    });

    modeEl.addEventListener("change", function () {
      clearTimers();
      renderIdle();
    });

    renderIdle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTsys);
  } else {
    initTsys();
  }
})();
