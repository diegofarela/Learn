/**
 * Halting-problem postcard: finite tracer vs infinite claim.
 */
(function () {
  var BUDGET = 12;

  var PROGRAMS = {
    halt: {
      name: "Halt soon",
      src: "i = 0\nwhile i < 3:\n  i += 1\n# halt",
      trueHalt: true,
      steps: ["i=0", "i=1", "i=2", "i=3", "HALT"]
    },
    loop: {
      name: "Infinite loop",
      src: "while True:\n  pass\n# never reaches here",
      trueHalt: false,
      steps: ["loop", "loop", "loop", "loop", "loop", "loop", "loop", "loop", "loop", "loop", "loop", "loop", "…"]
    },
    maybe: {
      name: "Slow halt",
      src: "n = 0\nwhile n < 20:\n  n += 1\n# halts after 20",
      trueHalt: true,
      steps: (function () {
        var s = [];
        for (var i = 0; i < 20; i++) s.push("n=" + (i + 1));
        s.push("HALT");
        return s;
      })()
    }
  };

  var CODE_LINES = [
    { html: '<span class="code-cm">/* dream oracle — does not exist */</span>', id: "sig" },
    { html: '<span class="code-type">bool</span> <span class="code-fn">HALT</span>(P, x) {', id: "oracle" },
    { html: '  <span class="code-cm">/* always yes/no, always terminates */</span>', id: "claim" },
    { html: '}', id: null },
    { html: '<span class="code-cm">/* what we can do instead */</span>', id: null },
    { html: '<span class="code-kw">for</span> t <span class="code-kw">in</span> 1..budget {', id: "trace" },
    { html: '  simulate one step of P(x);', id: "step" },
    { html: '  <span class="code-kw">if</span> halted <span class="code-kw">return</span> YES;', id: "yes" },
    { html: '}' },
    { html: '<span class="code-kw">return</span> UNKNOWN; <span class="code-cm">/* not NO */</span>', id: "unknown" }
  ];

  function initDec() {
    var srcEl = document.getElementById("dec-src");
    var claimEl = document.getElementById("dec-claim");
    var verdictEl = document.getElementById("dec-verdict");
    var logEl = document.getElementById("dec-log");
    var status = document.getElementById("dec-status");
    var badge = document.getElementById("dec-badge");
    var ticksEl = document.getElementById("dec-ticks");
    var budgetEl = document.getElementById("dec-budget");
    var codeRoot = document.getElementById("dec-code");
    var codeNote = document.getElementById("dec-code-note");
    if (!srcEl || !logEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var progId = "halt";
    var tick = 0;
    var done = false;
    var lineEls = {};
    var runTimer = null;

    if (budgetEl) budgetEl.textContent = String(BUDGET);

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
        var ln = document.createElement("span");
        ln.className = "code-ln";
        ln.textContent = String(i + 1);
        var src = document.createElement("span");
        src.className = "code-src";
        src.innerHTML = line.html;
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
    }

    function setProg(id) {
      progId = id;
      tick = 0;
      done = false;
      if (runTimer) {
        window.clearInterval(runTimer);
        runTimer = null;
      }
      var p = PROGRAMS[id];
      srcEl.textContent = p.src;
      if (claimEl) claimEl.textContent = "Does “" + p.name + "” halt?";
      if (verdictEl) {
        verdictEl.textContent = "Oracle: undecidable in general";
        verdictEl.dataset.kind = "open";
      }
      logEl.innerHTML = "";
      if (ticksEl) ticksEl.textContent = "0";
      if (badge) {
        badge.textContent = "idle";
        badge.dataset.phase = "idle";
      }
      highlight("oracle");
      if (codeNote) {
        codeNote.innerHTML =
          "Truth for this sample is known to us — but a <strong>general</strong> HALT does not exist.";
      }
      if (status) {
        status.textContent =
          "Loaded “" + p.name + "”. Trace up to " + BUDGET + " steps.";
      }
      document.querySelectorAll("[data-dec-prog]").forEach(function (btn) {
        btn.classList.toggle("is-selected", btn.getAttribute("data-dec-prog") === id);
      });
    }

    function appendLog(text, kind) {
      var row = document.createElement("div");
      row.className = "dec-log-row" + (kind ? " is-" + kind : "");
      row.textContent = "t=" + tick + " · " + text;
      logEl.appendChild(row);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function stepOnce() {
      if (done) return;
      var p = PROGRAMS[progId];
      if (tick >= BUDGET) {
        done = true;
        highlight("unknown");
        if (badge) {
          badge.textContent = "unknown";
          badge.dataset.phase = "unknown";
        }
        if (verdictEl) {
          verdictEl.textContent = p.trueHalt
            ? "Budget exhausted — still might halt later (it does, after more steps)"
            : "Budget exhausted — still might halt later (it never will — but tracer can’t prove that)";
          verdictEl.dataset.kind = "unknown";
        }
        if (codeNote) {
          codeNote.innerHTML =
            "Tracer returns <strong>UNKNOWN</strong>, not NO. Infinite non-halting has no finite proof here.";
        }
        if (status) {
          status.textContent =
            "Out of budget. Cannot certify “loops forever” from a finite trace.";
        }
        appendLog("budget exhausted → UNKNOWN", "unknown");
        return;
      }

      var event = p.steps[Math.min(tick, p.steps.length - 1)];
      tick += 1;
      if (ticksEl) ticksEl.textContent = String(tick);
      highlight("step");
      if (badge) {
        badge.textContent = "trace";
        badge.dataset.phase = "trace";
      }

      if (event === "HALT") {
        done = true;
        highlight("yes");
        appendLog("HALT observed", "halt");
        if (badge) {
          badge.textContent = "halts";
          badge.dataset.phase = "accept";
        }
        if (verdictEl) {
          verdictEl.textContent = "YES — observed halt within budget";
          verdictEl.dataset.kind = "halt";
        }
        if (codeNote) {
          codeNote.innerHTML = "Simulation saw a halt → answer <strong>YES</strong> (semi-decidable).";
        }
        if (status) status.textContent = "Program halted at step " + tick + ".";
        return;
      }

      appendLog(event, "run");
      if (status) {
        status.textContent = "Step " + tick + "/" + BUDGET + ": " + event;
      }
      if (codeNote) {
        codeNote.innerHTML = "Still running… only a halt gives a definite YES.";
      }
    }

    function runBudget() {
      if (runTimer) return;
      if (done) setProg(progId);
      runTimer = window.setInterval(
        function () {
          stepOnce();
          if (done) {
            window.clearInterval(runTimer);
            runTimer = null;
          }
        },
        reduceMotion ? 80 : 220
      );
    }

    renderCode();
    setProg("halt");

    document.querySelectorAll("[data-dec-prog]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setProg(btn.getAttribute("data-dec-prog"));
      });
    });

    document.querySelectorAll("[data-dec-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-dec-action");
        if (action === "step") stepOnce();
        else if (action === "run") runBudget();
        else if (action === "reset") setProg(progId);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDec);
  } else {
    initDec();
  }
})();
