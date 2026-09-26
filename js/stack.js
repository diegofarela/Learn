/**
 * Interactive 3D stack + C code line highlighter.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-kw">#define</span> MAX <span class="code-num">8</span>' },
    { html: '<span class="code-type">char</span> data[MAX];' },
    { html: '<span class="code-type">int</span> top = <span class="code-num">-1</span>;', id: "top" },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">push</span>(<span class="code-type">char</span> x) {', id: "push-sig" },
    { html: '  <span class="code-kw">if</span> (top &gt;= MAX - <span class="code-num">1</span>) <span class="code-kw">return</span>; <span class="code-cm">/* overflow */</span>', id: "push-check" },
    { html: '  top++;', id: "push-top" },
    { html: '  data[top] = x;', id: "push-store" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">char</span> <span class="code-fn">pop</span>(<span class="code-type">void</span>) {', id: "pop-sig" },
    { html: '  <span class="code-kw">if</span> (top &lt; <span class="code-num">0</span>) <span class="code-kw">return</span> <span class="code-str">\'?\'</span>; <span class="code-cm">/* underflow */</span>', id: "pop-check" },
    { html: '  <span class="code-type">char</span> x = data[top];', id: "pop-read" },
    { html: '  top--;', id: "pop-top" },
    { html: '  <span class="code-kw">return</span> x;', id: "pop-ret" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">char</span> <span class="code-fn">peek</span>(<span class="code-type">void</span>) {', id: "peek-sig" },
    { html: '  <span class="code-kw">if</span> (top &lt; <span class="code-num">0</span>) <span class="code-kw">return</span> <span class="code-str">\'?\'</span>;', id: "peek-check" },
    { html: '  <span class="code-kw">return</span> data[top];', id: "peek-ret" },
    { html: '}' }
  ];

  var STEPS = {
    push: [
      { line: "push-sig", note: "Enter <strong>push</strong> with the new value." },
      { line: "push-check", note: "Guard: refuse if the array is already full." },
      { line: "push-top", note: "Move <strong>top</strong> up one slot." },
      { line: "push-store", note: "Write the value into <strong>data[top]</strong>.", visual: "commit" },
      { line: "top", note: "Stack size is now <strong>top + 1</strong>." }
    ],
    pop: [
      { line: "pop-sig", note: "Enter <strong>pop</strong>." },
      { line: "pop-check", note: "Guard: refuse if the stack is empty." },
      { line: "pop-read", note: "Read the value at <strong>data[top]</strong>.", visual: "start" },
      { line: "pop-top", note: "Move <strong>top</strong> down — the slot is logically gone." },
      { line: "pop-ret", note: "Return the popped value to the caller.", visual: "commit" }
    ],
    peek: [
      { line: "peek-sig", note: "Enter <strong>peek</strong>." },
      { line: "peek-check", note: "Guard: refuse if empty." },
      { line: "peek-ret", note: "Return <strong>data[top]</strong> without changing top.", visual: "commit" }
    ],
    reset: [
      { line: "top", note: "Reset demo: <strong>top = 2</strong> with A, B, C loaded." }
    ]
  };

  function initStack3d() {
    var root = document.getElementById("stack-3d");
    var status = document.getElementById("stack-status");
    var sizeEl = document.getElementById("stack-size");
    var stage = document.querySelector(".stack-stage");
    var codeRoot = document.getElementById("stack-code");
    var codeNote = document.getElementById("stack-code-note");
    if (!root) return;

    var MAX = 8;
    var TONES = 6;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var nextCode = 68;
    var items = [
      { label: "A", tone: 0 },
      { label: "B", tone: 1 },
      { label: "C", tone: 2 }
    ];

    var rotY = -42;
    var rotX = 28;
    var dragging = false;
    var lastX = 0;
    var lastY = 0;
    var lineEls = {};
    var PALETTE_KEY = "learnStackPaletteV1";
    var PALETTES = ["ocean", "ember", "mint", "ink", "light"];
    var paletteSelect = document.getElementById("stack-palette");

    function readPalette() {
      try {
        var saved = localStorage.getItem(PALETTE_KEY);
        if (PALETTES.indexOf(saved) !== -1) return saved;
      } catch (err) {}
      return "ocean";
    }

    function applyPalette(id) {
      var next = PALETTES.indexOf(id) !== -1 ? id : "ocean";
      root.dataset.palette = next;
      if (paletteSelect) paletteSelect.value = next;
      try {
        localStorage.setItem(PALETTE_KEY, next);
      } catch (err) {
        console.warn("[learn-stack] Could not save palette", err);
      }
    }

    function applyTilt() {
      root.style.transform =
        "rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
    }

    function nextLetter() {
      var ch = String.fromCharCode(nextCode);
      nextCode = nextCode >= 90 ? 65 : nextCode + 1;
      return ch;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
      if (sizeEl) sizeEl.textContent = String(items.length);
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function clearStepTimers() {
      stepTimers.forEach(function (id) {
        window.clearTimeout(id);
      });
      stepTimers = [];
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

    function highlight(id, dimOthers) {
      Object.keys(lineEls).forEach(function (key) {
        var el = lineEls[key];
        el.classList.toggle("is-active", key === id);
        el.classList.toggle("is-dim", Boolean(dimOthers) && key !== id);
      });
      var active = id && lineEls[id];
      if (active && typeof active.scrollIntoView === "function") {
        try {
          active.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
        } catch (err) {}
      }
    }

    function clearHighlight() {
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
    }

    function face(name, text) {
      var el = document.createElement("div");
      el.className = "stack-face stack-face-" + name;
      if (text) {
        var span = document.createElement("span");
        span.className = "stack-face-label";
        span.textContent = text;
        el.appendChild(span);
      }
      return el;
    }

    function makeBlock(item, isTop, index) {
      var slot = document.createElement("div");
      slot.className = "stack-slot" + (isTop ? " is-top" : "");
      slot.style.setProperty("--i", String(index));
      slot.dataset.label = item.label;

      var block = document.createElement("div");
      block.className = "stack-block";
      block.dataset.tone = String(item.tone % TONES);
      block.appendChild(face("front", item.label));
      block.appendChild(face("back"));
      block.appendChild(face("left"));
      block.appendChild(face("right"));
      block.appendChild(face("top", item.label));
      block.appendChild(face("bottom"));

      slot.appendChild(block);
      slot.setAttribute(
        "aria-label",
        "Block " + item.label + (isTop ? ", top of stack" : "")
      );
      return slot;
    }

    function paint() {
      root.innerHTML = "";
      items.forEach(function (item, i) {
        root.appendChild(makeBlock(item, i === items.length - 1, i));
      });
      applyTilt();
    }

    function spawnSpark(x, y) {
      if (reduceMotion || !stage) return;
      var spark = document.createElement("span");
      spark.className = "stack-spark";
      spark.style.left = x + "px";
      spark.style.top = y + "px";
      stage.appendChild(spark);
      window.setTimeout(function () {
        spark.remove();
      }, 600);
    }

    function runSteps(name, ctx) {
      clearStepTimers();
      var steps = STEPS[name] || [];
      var delay = reduceMotion ? 0 : 420;
      var pending = null;

      if (!steps.length) {
        if (ctx && typeof ctx.onDone === "function") ctx.onDone();
        return;
      }

      steps.forEach(function (step, i) {
        var id = window.setTimeout(function () {
          try {
            highlight(step.line, true);
            if (step.note) setCodeNote(step.note);

            if (step.visual === "start" && ctx && typeof ctx.onStart === "function") {
              pending = ctx.onStart();
            }
            if (step.visual === "commit" && ctx && typeof ctx.onCommit === "function") {
              ctx.onCommit(pending);
              pending = null;
            }

            if (i === steps.length - 1) {
              var doneId = window.setTimeout(function () {
                if (ctx && typeof ctx.onDone === "function") ctx.onDone();
              }, reduceMotion ? 0 : 280);
              stepTimers.push(doneId);
            }
          } catch (err) {
            console.error("[learn-stack] Step failed", { name: name, step: step, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(id);
      });
    }

    function push() {
      if (busy) return;
      if (items.length >= MAX) {
        highlight("push-check", true);
        setCodeNote("Overflow — <strong>top &gt;= MAX - 1</strong>, push aborts.");
        setStatus("Stack overflow — max " + MAX + ". Pop first.");
        return;
      }

      busy = true;
      var label = nextLetter();
      var tone = items.length % TONES;

      runSteps("push", {
        onCommit: function () {
          items.push({ label: label, tone: tone });
          paint();
          var topSlot = root.querySelector(".stack-slot.is-top");
          if (topSlot && !reduceMotion) topSlot.classList.add("is-landing");
          setStatus("Pushed “" + label + "” onto the top.");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function pop() {
      if (busy) return;
      if (!items.length) {
        highlight("pop-check", true);
        setCodeNote("Underflow — <strong>top &lt; 0</strong>, pop aborts.");
        setStatus("Stack underflow — nothing to pop.");
        return;
      }

      busy = true;
      var removed = null;

      runSteps("pop", {
        onStart: function () {
          removed = items[items.length - 1];
          var topSlot = root.querySelector(".stack-slot.is-top");
          if (!topSlot || reduceMotion) return null;
          var rect = topSlot.getBoundingClientRect();
          var stageRect = stage.getBoundingClientRect();
          spawnSpark(
            rect.left + rect.width / 2 - stageRect.left,
            rect.top - stageRect.top
          );
          topSlot.classList.remove("is-top");
          topSlot.classList.add("is-popping");
          setStatus("Popped “" + removed.label + "” — leaping off…");
          return topSlot;
        },
        onCommit: function () {
          removed = items.pop();
          window.setTimeout(
            function () {
              paint();
              setStatus("Popped “" + removed.label + "”. Size " + items.length + ".");
            },
            reduceMotion ? 0 : 400
          );
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function peek() {
      if (busy) return;
      if (!items.length) {
        highlight("peek-check", true);
        setCodeNote("Empty — peek has nothing to return.");
        setStatus("Empty — nothing to peek.");
        return;
      }

      busy = true;
      var top = items[items.length - 1];

      runSteps("peek", {
        onCommit: function () {
          var topSlot = root.querySelector(".stack-slot.is-top");
          if (topSlot && !reduceMotion) {
            topSlot.classList.remove("is-peek");
            void topSlot.offsetWidth;
            topSlot.classList.add("is-peek");
          }
          setStatus("Peek → “" + top.label + "” (still on the stack).");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function reset() {
      if (busy) return;
      busy = true;
      items = [
        { label: "A", tone: 0 },
        { label: "B", tone: 1 },
        { label: "C", tone: 2 }
      ];
      nextCode = 68;
      paint();
      setStatus("Reset. Pop the top—watch it leap off.");
      runSteps("reset", {
        onDone: function () {
          busy = false;
          setCodeNote(
            "Press <strong>Push</strong>, <strong>Pop</strong>, or <strong>Peek</strong> — each step of the matching C function lights up."
          );
        }
      });
    }

    document.querySelectorAll("[data-stack-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-stack-action");
        if (action === "push") push();
        else if (action === "pop") pop();
        else if (action === "peek") peek();
        else if (action === "reset") reset();
      });
    });

    if (stage && !reduceMotion) {
      stage.addEventListener("pointerdown", function (e) {
        if (e.target.closest("button")) return;
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        stage.classList.add("is-dragging");
        try {
          stage.setPointerCapture(e.pointerId);
        } catch (err) {}
      });
      stage.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX;
        var dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        rotY += dx * 0.65;
        rotX = Math.max(-18, Math.min(68, rotX - dy * 0.55));
        applyTilt();
      });
      function endDrag(e) {
        dragging = false;
        stage.classList.remove("is-dragging");
        try {
          stage.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
      stage.addEventListener("pointerup", endDrag);
      stage.addEventListener("pointercancel", endDrag);
    }

    if (paletteSelect) {
      paletteSelect.addEventListener("change", function () {
        applyPalette(paletteSelect.value);
      });
    }

    renderCode();
    applyPalette(readPalette());
    paint();
    clearHighlight();
    setStatus("Three blocks ready. Pop the top—watch it leap off.");
  }

  try {
    initStack3d();
  } catch (err) {
    console.error("[learn-stack] Init failed", err);
  }
})();
