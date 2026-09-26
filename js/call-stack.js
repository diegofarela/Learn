/**
 * Interactive call stack: nested main→a→b frames + C line highlighter.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-type">void</span> <span class="code-fn">b</span>(<span class="code-type">int</span> y) {', id: "b-sig" },
    { html: '  <span class="code-type">int</span> z = y + <span class="code-num">1</span>;', id: "b-local" },
    { html: '  <span class="code-cm">/* leaf — no further calls */</span>', id: "b-body" },
    { html: '}', id: "b-end" },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">a</span>(<span class="code-type">int</span> x) {', id: "a-sig" },
    { html: '  <span class="code-type">int</span> t = x * <span class="code-num">2</span>;', id: "a-local" },
    { html: '  <span class="code-fn">b</span>(t);', id: "a-call" },
    { html: '  <span class="code-cm">/* resumes here after b returns */</span>', id: "a-resume" },
    { html: '}', id: "a-end" },
    { blank: true },
    { html: '<span class="code-type">int</span> <span class="code-fn">main</span>(<span class="code-type">void</span>) {', id: "main-sig" },
    { html: '  <span class="code-type">int</span> n = <span class="code-num">3</span>;', id: "main-local" },
    { html: '  <span class="code-fn">a</span>(n);', id: "main-call" },
    { html: '  <span class="code-kw">return</span> <span class="code-num">0</span>;', id: "main-ret" },
    { html: '}', id: "main-end" }
  ];

  /*
   * Script phases:
   * 0 idle → step into pushes main
   * then into: a, then b
   * return pops b, a, main
   */
  var INTO_STEPS = [
    {
      fn: "main",
      line: "main-sig",
      phase: "enter main",
      note: "Enter <strong>main</strong> — push a frame with return → OS.",
      status: "Pushed main. Locals come next.",
      locals: { n: "—" },
      retAddr: "OS / runtime"
    },
    {
      fn: "main",
      line: "main-local",
      phase: "locals",
      note: "Allocate local <strong>n = 3</strong> in main’s frame.",
      status: "main: n = 3.",
      locals: { n: 3 },
      retAddr: "OS / runtime",
      updateTop: true
    },
    {
      fn: "main",
      line: "main-call",
      phase: "call a",
      note: "Call <strong>a(n)</strong> — save return address at main’s next line.",
      status: "About to call a(3).",
      locals: { n: 3 },
      retAddr: "OS / runtime",
      updateTop: true,
      peekNext: true
    },
    {
      fn: "a",
      line: "a-sig",
      phase: "enter a",
      note: "Enter <strong>a</strong> — push frame; return address → main after call.",
      status: "Pushed a. Parameter x = 3.",
      locals: { x: 3, t: "—" },
      retAddr: "main · after a(n)"
    },
    {
      fn: "a",
      line: "a-local",
      phase: "locals",
      note: "Local <strong>t = x * 2</strong> → 6.",
      status: "a: x = 3, t = 6.",
      locals: { x: 3, t: 6 },
      retAddr: "main · after a(n)",
      updateTop: true
    },
    {
      fn: "a",
      line: "a-call",
      phase: "call b",
      note: "Call <strong>b(t)</strong> — return address saved in a’s frame.",
      status: "About to call b(6).",
      locals: { x: 3, t: 6 },
      retAddr: "main · after a(n)",
      updateTop: true,
      peekNext: true
    },
    {
      fn: "b",
      line: "b-sig",
      phase: "enter b",
      note: "Enter <strong>b</strong> — deepest frame; return → a after call.",
      status: "Pushed b. Parameter y = 6.",
      locals: { y: 6, z: "—" },
      retAddr: "a · after b(t)"
    },
    {
      fn: "b",
      line: "b-local",
      phase: "locals",
      note: "Local <strong>z = y + 1</strong> → 7.",
      status: "b: y = 6, z = 7.",
      locals: { y: 6, z: 7 },
      retAddr: "a · after b(t)",
      updateTop: true
    },
    {
      fn: "b",
      line: "b-body",
      phase: "leaf",
      note: "Leaf body — no further calls. Ready to return.",
      status: "b finished work. Step return to pop.",
      locals: { y: 6, z: 7 },
      retAddr: "a · after b(t)",
      updateTop: true,
      maxDepth: true
    }
  ];

  var RETURN_STEPS = [
    {
      pop: true,
      line: "a-resume",
      phase: "return → a",
      note: "Pop <strong>b</strong>. Resume <strong>a</strong> at the line after the call.",
      status: "Returned to a. Frame count decreased.",
      activateFn: "a"
    },
    {
      line: "a-end",
      phase: "finish a",
      note: "a’s body done — ready to return to main.",
      status: "a complete. Step return again.",
      activateFn: "a"
    },
    {
      pop: true,
      line: "main-ret",
      phase: "return → main",
      note: "Pop <strong>a</strong>. Resume <strong>main</strong> after a(n).",
      status: "Returned to main.",
      activateFn: "main"
    },
    {
      line: "main-ret",
      phase: "finish main",
      note: "main returns <strong>0</strong> to the runtime.",
      status: "main returning. One more Step return.",
      activateFn: "main"
    },
    {
      pop: true,
      line: "main-end",
      phase: "done",
      note: "Pop <strong>main</strong>. Call stack empty — program finished.",
      status: "Stack empty. Reset to run again.",
      activateFn: null
    }
  ];

  function initCallStack() {
    var framesRoot = document.getElementById("callstack-frames");
    var status = document.getElementById("callstack-status");
    var countEl = document.getElementById("callstack-count");
    var phaseEl = document.getElementById("callstack-phase");
    var codeRoot = document.getElementById("callstack-code");
    var codeNote = document.getElementById("callstack-code-note");
    if (!framesRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var frames = [];
    var intoIndex = -1;
    var returnIndex = -1;
    var mode = "into"; /* into | return | done */
    var lineEls = {};
    var busy = false;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function setPhase(label) {
      if (phaseEl) phaseEl.textContent = label;
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

    function localsHtml(locals) {
      if (!locals) return "";
      return Object.keys(locals)
        .map(function (k) {
          return (
            '<span class="callstack-local"><code>' +
            k +
            "</code> = " +
            locals[k] +
            "</span>"
          );
        })
        .join("");
    }

    function paint() {
      framesRoot.innerHTML = "";
      if (!frames.length) {
        var empty = document.createElement("p");
        empty.className = "callstack-empty";
        empty.textContent = "Stack empty — Step into to enter main.";
        framesRoot.appendChild(empty);
      } else {
        frames.forEach(function (fr, i) {
          var el = document.createElement("div");
          el.className =
            "callstack-frame" +
            (i === frames.length - 1 ? " is-top" : "") +
            (fr.entering ? " is-entering" : "") +
            (fr.leaving ? " is-leaving" : "");
          el.style.setProperty("--i", String(i));
          el.innerHTML =
            '<div class="callstack-frame-top">' +
            '<span class="callstack-fn">' +
            fr.fn +
            "()</span>" +
            '<span class="callstack-ret-label">ret → ' +
            fr.retAddr +
            "</span>" +
            "</div>" +
            '<div class="callstack-locals">' +
            localsHtml(fr.locals) +
            "</div>";
          framesRoot.appendChild(el);
          if (fr.entering && !reduceMotion) {
            window.setTimeout(function () {
              fr.entering = false;
              el.classList.remove("is-entering");
            }, 450);
          }
        });
      }
      if (countEl) countEl.textContent = String(frames.length);
    }

    function stepInto() {
      try {
        if (busy) return;
        if (mode === "done") {
          setStatus("Finished. Reset to run again.");
          return;
        }
        if (mode === "return") {
          setStatus("At max depth — use Step return to unwind.");
          setCodeNote("Leaf reached. <strong>Step return</strong> pops the top frame.");
          return;
        }
        if (intoIndex >= INTO_STEPS.length - 1) {
          mode = "return";
          setStatus("At max depth — use Step return to unwind.");
          return;
        }

        intoIndex += 1;
        var step = INTO_STEPS[intoIndex];

        if (step.updateTop && frames.length) {
          frames[frames.length - 1].locals = step.locals;
          frames[frames.length - 1].retAddr = step.retAddr;
          frames[frames.length - 1].entering = false;
        } else if (!step.updateTop) {
          frames.push({
            fn: step.fn,
            locals: step.locals,
            retAddr: step.retAddr,
            entering: !reduceMotion,
            leaving: false
          });
        }

        paint();
        highlight(step.line);
        setCodeNote(step.note);
        setPhase(step.phase);
        setStatus(step.status);

        if (step.maxDepth) {
          mode = "return";
          returnIndex = -1;
        }
      } catch (err) {
        console.error("[learn-callstack] Step into failed", err);
      }
    }

    function stepReturn() {
      try {
        if (busy) return;
        if (mode === "into" && intoIndex < INTO_STEPS.length - 1) {
          setStatus("Still descending — Step into until the leaf, or keep going.");
          return;
        }
        if (mode === "into" && intoIndex >= INTO_STEPS.length - 1) {
          mode = "return";
          returnIndex = -1;
        }
        if (mode === "done" || (mode === "return" && returnIndex >= RETURN_STEPS.length - 1 && !frames.length)) {
          setStatus("Stack already empty. Reset to run again.");
          return;
        }

        mode = "return";
        returnIndex += 1;
        if (returnIndex >= RETURN_STEPS.length) {
          mode = "done";
          setStatus("Done. Reset to run again.");
          return;
        }

        var step = RETURN_STEPS[returnIndex];

        if (step.pop && frames.length) {
          var top = frames[frames.length - 1];
          top.leaving = !reduceMotion;
          busy = true;
          paint();
          window.setTimeout(
            function () {
              try {
                frames.pop();
                paint();
                highlight(step.line);
                setCodeNote(step.note);
                setPhase(step.phase);
                setStatus(step.status);
                if (!frames.length) mode = "done";
              } catch (err) {
                console.error("[learn-callstack] Return pop failed", err);
              }
              busy = false;
            },
            reduceMotion ? 0 : 320
          );
        } else {
          paint();
          highlight(step.line);
          setCodeNote(step.note);
          setPhase(step.phase);
          setStatus(step.status);
        }
      } catch (err) {
        console.error("[learn-callstack] Step return failed", err);
        busy = false;
      }
    }

    function reset() {
      busy = false;
      frames = [];
      intoIndex = -1;
      returnIndex = -1;
      mode = "into";
      paint();
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setPhase("idle");
      setCodeNote(
        "Press <strong>Step into</strong> to push a frame, <strong>Step return</strong> to pop one."
      );
      setStatus("Ready. Step into main — then a, then b.");
    }

    document.querySelectorAll("[data-callstack-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-callstack-action");
        if (action === "into") stepInto();
        else if (action === "return") stepReturn();
        else if (action === "reset") reset();
      });
    });

    renderCode();
    reset();
  }

  try {
    initCallStack();
  } catch (err) {
    console.error("[learn-callstack] Init failed", err);
  }
})();
