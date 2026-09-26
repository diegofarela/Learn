/**
 * Interactive recursion demo: factorial frames + C line highlighter.
 */
(function () {
  var N = 4;

  var CODE_LINES = [
    { html: '<span class="code-type">int</span> <span class="code-fn">fact</span>(<span class="code-type">int</span> n) {', id: "sig" },
    { html: '  <span class="code-kw">if</span> (n &lt;= <span class="code-num">0</span>)', id: "base-check" },
    { html: '    <span class="code-kw">return</span> <span class="code-num">1</span>; <span class="code-cm">/* base case */</span>', id: "base-ret" },
    { blank: true },
    { html: '  <span class="code-kw">return</span> n * <span class="code-fn">fact</span>(n - <span class="code-num">1</span>); <span class="code-cm">/* recursive */</span>', id: "recur" },
    { html: '}' }
  ];

  function buildScript() {
    var steps = [];
    var n;
    for (n = N; n >= 0; n--) {
      steps.push({
        kind: "enter",
        n: n,
        line: "sig",
        caseLabel: "call",
        note: "Enter <strong>fact(" + n + ")</strong> — a new frame is pushed.",
        status: "Calling fact(" + n + "). Depth " + (N - n + 1) + "."
      });
      if (n <= 0) {
        steps.push({
          kind: "base-check",
          n: n,
          line: "base-check",
          caseLabel: "base",
          note: "Check: <strong>n &lt;= 0</strong> — this is the base case.",
          status: "Base case: n = 0."
        });
        steps.push({
          kind: "base-ret",
          n: n,
          line: "base-ret",
          caseLabel: "base",
          note: "Return <strong>1</strong>. No further call.",
          status: "fact(0) → 1. Unwinding begins.",
          ret: 1
        });
      } else {
        steps.push({
          kind: "check",
          n: n,
          line: "base-check",
          caseLabel: "recursive",
          note: "Check base case: <strong>n &gt; 0</strong>, so keep going.",
          status: "n = " + n + " is not the base case."
        });
        steps.push({
          kind: "recur",
          n: n,
          line: "recur",
          caseLabel: "recursive",
          note: "Recursive case: return <strong>" + n + " * fact(" + (n - 1) + ")</strong>.",
          status: "fact(" + n + ") waits on fact(" + (n - 1) + ")."
        });
      }
    }
    var product = 1;
    for (n = 1; n <= N; n++) {
      product *= n;
      steps.push({
        kind: "return",
        n: n,
        line: "recur",
        caseLabel: "return",
        note: "Return to <strong>fact(" + n + ")</strong>: " + n + " * " + product / n + " = <strong>" + product + "</strong>.",
        status: "fact(" + n + ") → " + product + ". Frame pops.",
        ret: product
      });
    }
    steps.push({
      kind: "done",
      n: N,
      line: "sig",
      caseLabel: "done",
      note: "Done. <strong>fact(" + N + ") = " + product + "</strong>.",
      status: "Complete. fact(" + N + ") = " + product + ".",
      ret: product
    });
    return steps;
  }

  function initRecursion() {
    var framesRoot = document.getElementById("recur-frames");
    var status = document.getElementById("recur-status");
    var depthEl = document.getElementById("recur-depth");
    var caseEl = document.getElementById("recur-case");
    var codeRoot = document.getElementById("recur-code");
    var codeNote = document.getElementById("recur-code-note");
    if (!framesRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var steps = buildScript();
    var index = -1;
    var frames = [];
    var busy = false;
    var playing = false;
    var playTimer = null;
    var lineEls = {};

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function setCase(label) {
      if (!caseEl) return;
      caseEl.textContent = label;
      caseEl.dataset.case = label;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE_LINES.forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        if (line.blank) row.dataset.blank = "1";
        var ln = document.createElement("span");
        ln.className = "code-ln";
        ln.textContent = String(i + 1);
        var src = document.createElement("span");
        src.className = "code-src";
        src.innerHTML = line.blank ? "" : line.html;
        row.appendChild(ln);
        row.appendChild(src);
        codeRoot.appendChild(row);
      });
    }

    function highlight(id) {
      Object.keys(lineEls).forEach(function (key) {
        var el = lineEls[key];
        el.classList.toggle("is-active", key === id);
        el.classList.toggle("is-dim", Boolean(id) && key !== id);
      });
      var active = id && lineEls[id];
      if (active && typeof active.scrollIntoView === "function") {
        try {
          active.scrollIntoView({
            block: "nearest",
            behavior: reduceMotion ? "auto" : "smooth"
          });
        } catch (err) {}
      }
    }

    function paintFrames() {
      framesRoot.innerHTML = "";
      if (!frames.length) {
        var empty = document.createElement("p");
        empty.className = "recur-empty";
        empty.textContent = "Call stack empty — press Step to enter fact(" + N + ").";
        framesRoot.appendChild(empty);
        if (depthEl) depthEl.textContent = "0";
        return;
      }
      frames.forEach(function (fr, i) {
        var el = document.createElement("div");
        el.className =
          "recur-frame" +
          (i === frames.length - 1 ? " is-top" : "") +
          (fr.waiting ? " is-waiting" : "") +
          (fr.returning ? " is-returning" : "") +
          (fr.base ? " is-base" : "");
        el.style.setProperty("--i", String(i));
        el.innerHTML =
          '<div class="recur-frame-head">' +
          '<span class="recur-fn">fact(' +
          fr.n +
          ")</span>" +
          (fr.ret != null
            ? '<span class="recur-ret">→ ' + fr.ret + "</span>"
            : fr.waiting
              ? '<span class="recur-wait">waiting…</span>'
              : "") +
          "</div>" +
          '<div class="recur-frame-locals">' +
          "<span>n = " +
          fr.n +
          "</span>" +
          (fr.base
            ? '<span class="recur-tag recur-tag-base">base</span>'
            : '<span class="recur-tag recur-tag-recur">recursive</span>') +
          "</div>";
        framesRoot.appendChild(el);
      });
      if (depthEl) depthEl.textContent = String(frames.length);
    }

    function applyStep(step) {
      if (step.kind === "enter") {
        frames.push({
          n: step.n,
          waiting: false,
          returning: false,
          base: step.n <= 0,
          ret: null
        });
      } else if (step.kind === "base-check" || step.kind === "check") {
        /* highlight only */
      } else if (step.kind === "base-ret") {
        if (frames.length) {
          frames[frames.length - 1].ret = step.ret;
          frames[frames.length - 1].returning = true;
        }
      } else if (step.kind === "recur") {
        if (frames.length) frames[frames.length - 1].waiting = true;
      } else if (step.kind === "return") {
        if (frames.length) {
          frames.pop();
        }
        if (frames.length) {
          frames[frames.length - 1].waiting = false;
          frames[frames.length - 1].returning = true;
          frames[frames.length - 1].ret = step.ret;
        }
      } else if (step.kind === "done") {
        frames = [];
      }

      paintFrames();
      highlight(step.line);
      setCodeNote(step.note);
      setCase(step.caseLabel);
      setStatus(step.status);
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearTimeout(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-recur-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= steps.length - 1) {
        stopPlay();
        setStatus("Finished. Reset to run fact(" + N + ") again.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyStep(steps[index]);
      } catch (err) {
        console.error("[learn-recursion] Step failed", { index: index, err: err });
      }
      busy = false;
      return index < steps.length - 1;
    }

    function play() {
      if (playing) {
        stopPlay();
        return;
      }
      if (index >= steps.length - 1) {
        reset();
      }
      playing = true;
      var playBtn = document.querySelector('[data-recur-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";

      function tick() {
        if (!playing) return;
        var more = stepOnce();
        if (!more) {
          stopPlay();
          return;
        }
        playTimer = window.setTimeout(tick, reduceMotion ? 80 : 700);
      }
      tick();
    }

    function reset() {
      stopPlay();
      index = -1;
      frames = [];
      paintFrames();
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setCase("ready");
      setCodeNote(
        "Press <strong>Step</strong> or <strong>Play</strong> — base and recursive cases light up as the call descends and returns."
      );
      setStatus("Ready. Step to call fact(" + N + ")—frames will stack down to the base case.");
    }

    document.querySelectorAll("[data-recur-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-recur-action");
        if (action === "step") {
          stopPlay();
          stepOnce();
        } else if (action === "play") play();
        else if (action === "reset") reset();
      });
    });

    renderCode();
    reset();
  }

  try {
    initRecursion();
  } catch (err) {
    console.error("[learn-recursion] Init failed", err);
  }
})();
