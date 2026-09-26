/**
 * Linking & loading: .o symbols → executable → loaded segments.
 */
(function () {
  var STAGES = [
    {
      id: "objects",
      badge: ".o files",
      label: "objects",
      status: "Two object files with undefined and defined symbols.",
      note: "Each <strong>.o</strong> has a symbol table.",
      codeId: "objs",
      phase: "objects"
    },
    {
      id: "resolve",
      badge: "resolving",
      label: "resolve",
      status: "Linker matches undefined refs to definitions (main → printf).",
      note: "<strong>Resolve</strong> undefined symbols across objects.",
      codeId: "resolve",
      phase: "resolve"
    },
    {
      id: "exe",
      badge: "a.out",
      label: "executable",
      status: "One executable with relocated addresses and program headers.",
      note: "<strong>Link</strong> emits the executable image.",
      codeId: "link",
      phase: "exe"
    },
    {
      id: "load",
      badge: "loading",
      label: "load",
      status: "Loader maps .text / .data / .bss into the process address space.",
      note: "<strong>Load</strong> segments into virtual memory.",
      codeId: "load",
      phase: "load"
    },
    {
      id: "run",
      badge: "running",
      label: "run",
      status: "Jump to entry point — process is executing.",
      note: "Control transfers to <strong>_start</strong> / main.",
      codeId: "run",
      phase: "run"
    }
  ];

  var CODE_LINES = [
    { html: 'main.o + libc.o <span class="code-cm">/* objects */</span>', id: "objs" },
    { html: '<span class="code-fn">resolve</span>(undef → def);', id: "resolve" },
    { html: '<span class="code-fn">ld</span> → a.out <span class="code-cm">/* relocate */</span>', id: "link" },
    { html: '<span class="code-fn">execve</span>: map .text .data .bss', id: "load" },
    { html: 'PC ← entry; <span class="code-fn">run</span>();', id: "run" }
  ];

  function initLl() {
    var pipeline = document.getElementById("ll-pipeline");
    var status = document.getElementById("ll-status");
    var badge = document.getElementById("ll-badge");
    var stageLabel = document.getElementById("ll-stage-label");
    var codeRoot = document.getElementById("ll-code");
    var codeNote = document.getElementById("ll-code-note");
    if (!pipeline) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var step = 0;
    var playTimer = null;
    var lineEls = {};

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setStage(text) {
      if (stageLabel) stageLabel.textContent = text;
    }

    function setNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE_LINES.forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        row.innerHTML = line.html || "&nbsp;";
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        codeRoot.appendChild(row);
      });
    }

    function highlight(id) {
      Object.keys(lineEls).forEach(function (k) {
        lineEls[k].classList.remove("is-active");
      });
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function paint(phase) {
      pipeline.innerHTML = "";

      var objs = document.createElement("div");
      objs.className =
        "ll-panel" +
        (phase === "objects" || phase === "resolve" ? " is-active" : phase !== "objects" ? " is-done" : "");
      objs.innerHTML =
        '<p class="ll-panel-title">Object files</p>' +
        '<div class="ll-obj"><span class="ll-obj-name">main.o</span>' +
        '<span class="ll-sym is-def">main ✓</span>' +
        '<span class="ll-sym' +
        (phase === "resolve" || phase === "exe" || phase === "load" || phase === "run"
          ? " is-resolved"
          : " is-undef") +
        '">printf ' +
        (phase === "objects" ? "?" : "✓") +
        "</span></div>" +
        '<div class="ll-obj"><span class="ll-obj-name">printf.o</span>' +
        '<span class="ll-sym is-def">printf ✓</span></div>';
      pipeline.appendChild(objs);

      var link = document.createElement("div");
      link.className =
        "ll-panel" +
        (phase === "resolve" || phase === "exe"
          ? " is-active"
          : phase === "load" || phase === "run"
            ? " is-done"
            : "");
      link.innerHTML =
        '<p class="ll-panel-title">Linker</p>' +
        '<div class="ll-exe' +
        (phase === "exe" || phase === "load" || phase === "run" ? " is-built" : "") +
        '">a.out<span class="ll-exe-meta">.text · .data · .bss</span></div>';
      pipeline.appendChild(link);

      var mem = document.createElement("div");
      mem.className =
        "ll-panel" +
        (phase === "load" || phase === "run" ? " is-active" : "");
      var segs = ["text", "data", "bss"];
      var segHtml = segs
        .map(function (s) {
          var on = phase === "load" || phase === "run";
          return (
            '<div class="ll-seg' +
            (on ? " is-mapped" : "") +
            (phase === "run" && s === "text" ? " is-pc" : "") +
            '">.' +
            s +
            "</div>"
          );
        })
        .join("");
      mem.innerHTML =
        '<p class="ll-panel-title">Process memory</p><div class="ll-segs">' +
        segHtml +
        "</div>";
      pipeline.appendChild(mem);
    }

    function paintStep() {
      var s = STAGES[step];
      setBadge(s.badge);
      setStage(s.label);
      setStatus(s.status);
      setNote(s.note);
      paint(s.phase);
      highlight(s.codeId);
    }

    function reset() {
      clearPlay();
      step = 0;
      renderCode();
      paintStep();
    }

    function stepOnce() {
      step = (step + 1) % STAGES.length;
      paintStep();
    }

    function play() {
      clearPlay();
      function tick() {
        stepOnce();
        if (step !== 0) {
          playTimer = window.setTimeout(tick, reduceMotion ? 0 : 750);
        } else {
          playTimer = null;
        }
      }
      if (step === STAGES.length - 1) step = -1;
      tick();
    }

    document.querySelectorAll("[data-ll-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-ll-action");
        if (action === "reset") reset();
        else if (action === "step") {
          clearPlay();
          stepOnce();
        } else if (action === "play") play();
      });
    });

    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLl);
  } else {
    initLl();
  }
})();
