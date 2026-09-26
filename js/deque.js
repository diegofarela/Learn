/**
 * Interactive double-ended queue lane + C circular-array code highlighter.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-kw">#define</span> MAX <span class="code-num">8</span>' },
    { html: '<span class="code-type">char</span> data[MAX];' },
    { html: '<span class="code-type">int</span> front = <span class="code-num">0</span>;', id: "front-idx" },
    { html: '<span class="code-type">int</span> rear = <span class="code-num">0</span>;', id: "rear-idx" },
    { html: '<span class="code-type">int</span> count = <span class="code-num">0</span>;', id: "count" },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">pushFront</span>(<span class="code-type">char</span> x) {', id: "pf-sig" },
    { html: '  <span class="code-kw">if</span> (count &gt;= MAX) <span class="code-kw">return</span>;', id: "pf-check" },
    { html: '  front = (front - <span class="code-num">1</span> + MAX) % MAX;', id: "pf-front" },
    { html: '  data[front] = x;', id: "pf-store" },
    { html: '  count++;', id: "pf-count" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">pushBack</span>(<span class="code-type">char</span> x) {', id: "pb-sig" },
    { html: '  <span class="code-kw">if</span> (count &gt;= MAX) <span class="code-kw">return</span>;', id: "pb-check" },
    { html: '  data[rear] = x;', id: "pb-store" },
    { html: '  rear = (rear + <span class="code-num">1</span>) % MAX;', id: "pb-rear" },
    { html: '  count++;', id: "pb-count" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">char</span> <span class="code-fn">popFront</span>(<span class="code-type">void</span>) {', id: "of-sig" },
    { html: '  <span class="code-kw">if</span> (count &lt;= <span class="code-num">0</span>) <span class="code-kw">return</span> <span class="code-str">\'?\'</span>;', id: "of-check" },
    { html: '  <span class="code-type">char</span> x = data[front];', id: "of-read" },
    { html: '  front = (front + <span class="code-num">1</span>) % MAX;', id: "of-front" },
    { html: '  count--;', id: "of-count" },
    { html: '  <span class="code-kw">return</span> x;', id: "of-ret" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">char</span> <span class="code-fn">popBack</span>(<span class="code-type">void</span>) {', id: "ob-sig" },
    { html: '  <span class="code-kw">if</span> (count &lt;= <span class="code-num">0</span>) <span class="code-kw">return</span> <span class="code-str">\'?\'</span>;', id: "ob-check" },
    { html: '  rear = (rear - <span class="code-num">1</span> + MAX) % MAX;', id: "ob-rear" },
    { html: '  <span class="code-type">char</span> x = data[rear];', id: "ob-read" },
    { html: '  count--;', id: "ob-count" },
    { html: '  <span class="code-kw">return</span> x;', id: "ob-ret" },
    { html: '}' }
  ];

  var STEPS = {
    pushFront: [
      { line: "pf-sig", note: "Enter <strong>pushFront</strong> with the new value." },
      { line: "pf-check", note: "Guard: refuse if <strong>count &gt;= MAX</strong>." },
      { line: "pf-front", note: "Move <strong>front</strong> one slot left (with wrap)." },
      { line: "pf-store", note: "Write into <strong>data[front]</strong>.", visual: "commit" },
      { line: "pf-count", note: "Bump <strong>count</strong>." }
    ],
    pushBack: [
      { line: "pb-sig", note: "Enter <strong>pushBack</strong> with the new value." },
      { line: "pb-check", note: "Guard: refuse if <strong>count &gt;= MAX</strong>." },
      { line: "pb-store", note: "Write into <strong>data[rear]</strong>.", visual: "commit" },
      { line: "pb-rear", note: "Advance <strong>rear</strong> with wrap-around <code>% MAX</code>." },
      { line: "pb-count", note: "Bump <strong>count</strong>." }
    ],
    popFront: [
      { line: "of-sig", note: "Enter <strong>popFront</strong>." },
      { line: "of-check", note: "Guard: refuse if the deque is empty." },
      { line: "of-read", note: "Read the value at <strong>data[front]</strong>.", visual: "start" },
      { line: "of-front", note: "Advance <strong>front</strong> — that slot leaves." },
      { line: "of-count", note: "Decrement <strong>count</strong>." },
      { line: "of-ret", note: "Return the popped value.", visual: "commit" }
    ],
    popBack: [
      { line: "ob-sig", note: "Enter <strong>popBack</strong>." },
      { line: "ob-check", note: "Guard: refuse if the deque is empty." },
      { line: "ob-rear", note: "Move <strong>rear</strong> one slot left before reading.", visual: "start" },
      { line: "ob-read", note: "Read the value at the new <strong>data[rear]</strong>." },
      { line: "ob-count", note: "Decrement <strong>count</strong>." },
      { line: "ob-ret", note: "Return the popped value.", visual: "commit" }
    ],
    reset: [
      { line: "count", note: "Reset demo: <strong>count = 3</strong> with A, B, C loaded." }
    ]
  };

  function initDequeLane() {
    var root = document.getElementById("deque-3d");
    var status = document.getElementById("deque-status");
    var sizeEl = document.getElementById("deque-size");
    var stage = document.querySelector(".deque-stage");
    var codeRoot = document.getElementById("deque-code");
    var codeNote = document.getElementById("deque-code-note");
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

    var lineEls = {};
    var PALETTE_KEY = "learnDequePaletteV1";
    var PALETTES = ["ocean", "ember", "mint", "ink", "light"];
    var paletteSelect = document.getElementById("deque-palette");

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
        console.warn("[learn-deque] Could not save palette", err);
      }
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
      el.className = "deque-face deque-face-" + name;
      if (text) {
        var span = document.createElement("span");
        span.className = "deque-face-label";
        span.textContent = text;
        el.appendChild(span);
      }
      return el;
    }

    function makeBlock(item, isFront, isRear, index) {
      var slot = document.createElement("div");
      slot.className =
        "deque-slot" +
        (isFront ? " is-front" : "") +
        (isRear ? " is-rear" : "");
      slot.style.setProperty("--i", String(index));
      slot.dataset.label = item.label;

      var block = document.createElement("div");
      block.className = "deque-block";
      block.dataset.tone = String(item.tone % TONES);
      block.appendChild(face("front", item.label));
      block.appendChild(face("back"));
      block.appendChild(face("left"));
      block.appendChild(face("right"));
      block.appendChild(face("top", item.label));
      block.appendChild(face("bottom"));

      slot.appendChild(block);
      var role = [];
      if (isFront) role.push("front");
      if (isRear) role.push("rear");
      slot.setAttribute(
        "aria-label",
        "Block " + item.label + (role.length ? ", " + role.join(" and ") : "")
      );
      return slot;
    }

    function paint() {
      root.innerHTML = "";
      items.forEach(function (item, i) {
        root.appendChild(
          makeBlock(item, i === 0, i === items.length - 1, i)
        );
      });
    }

    function spawnSpark(x, y) {
      if (reduceMotion || !stage) return;
      var spark = document.createElement("span");
      spark.className = "deque-spark";
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
            console.error("[learn-deque] Step failed", { name: name, step: step, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(id);
      });
    }

    function pushFront() {
      if (busy) return;
      if (items.length >= MAX) {
        highlight("pf-check", true);
        setCodeNote("Overflow — <strong>count &gt;= MAX</strong>, pushFront aborts.");
        setStatus("Deque overflow — max " + MAX + ". Pop first.");
        return;
      }

      busy = true;
      var label = nextLetter();
      var tone = items.length % TONES;

      runSteps("pushFront", {
        onCommit: function () {
          items.unshift({ label: label, tone: tone });
          paint();
          var frontSlot = root.querySelector(".deque-slot.is-front");
          if (frontSlot && !reduceMotion) frontSlot.classList.add("is-entering-front");
          setStatus("Pushed “" + label + "” at the front.");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function pushBack() {
      if (busy) return;
      if (items.length >= MAX) {
        highlight("pb-check", true);
        setCodeNote("Overflow — <strong>count &gt;= MAX</strong>, pushBack aborts.");
        setStatus("Deque overflow — max " + MAX + ". Pop first.");
        return;
      }

      busy = true;
      var label = nextLetter();
      var tone = items.length % TONES;

      runSteps("pushBack", {
        onCommit: function () {
          items.push({ label: label, tone: tone });
          paint();
          var rearSlot = root.querySelector(".deque-slot.is-rear");
          if (rearSlot && !reduceMotion) rearSlot.classList.add("is-entering-rear");
          setStatus("Pushed “" + label + "” at the rear.");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function popFront() {
      if (busy) return;
      if (!items.length) {
        highlight("of-check", true);
        setCodeNote("Underflow — <strong>count &lt;= 0</strong>, popFront aborts.");
        setStatus("Deque underflow — nothing to pop.");
        return;
      }

      busy = true;
      var removed = null;

      runSteps("popFront", {
        onStart: function () {
          removed = items[0];
          var frontSlot = root.querySelector(".deque-slot.is-front");
          if (!frontSlot || reduceMotion) return null;
          var rect = frontSlot.getBoundingClientRect();
          var stageRect = stage.getBoundingClientRect();
          spawnSpark(
            rect.left + rect.width / 2 - stageRect.left,
            rect.top + rect.height / 2 - stageRect.top
          );
          frontSlot.classList.remove("is-front");
          frontSlot.classList.add("is-leaving-front");
          setStatus("Popped “" + removed.label + "” — sliding off left…");
          return frontSlot;
        },
        onCommit: function () {
          removed = items.shift();
          window.setTimeout(
            function () {
              paint();
              setStatus("Popped front “" + removed.label + "”. Size " + items.length + ".");
            },
            reduceMotion ? 0 : 420
          );
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function popBack() {
      if (busy) return;
      if (!items.length) {
        highlight("ob-check", true);
        setCodeNote("Underflow — <strong>count &lt;= 0</strong>, popBack aborts.");
        setStatus("Deque underflow — nothing to pop.");
        return;
      }

      busy = true;
      var removed = null;

      runSteps("popBack", {
        onStart: function () {
          removed = items[items.length - 1];
          var rearSlot = root.querySelector(".deque-slot.is-rear");
          if (!rearSlot || reduceMotion) return null;
          var rect = rearSlot.getBoundingClientRect();
          var stageRect = stage.getBoundingClientRect();
          spawnSpark(
            rect.left + rect.width / 2 - stageRect.left,
            rect.top + rect.height / 2 - stageRect.top
          );
          rearSlot.classList.remove("is-rear");
          rearSlot.classList.add("is-leaving-rear");
          setStatus("Popped “" + removed.label + "” — sliding off right…");
          return rearSlot;
        },
        onCommit: function () {
          removed = items.pop();
          window.setTimeout(
            function () {
              paint();
              setStatus("Popped rear “" + removed.label + "”. Size " + items.length + ".");
            },
            reduceMotion ? 0 : 420
          );
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
      setStatus("Reset. Push or pop at either end.");
      runSteps("reset", {
        onDone: function () {
          busy = false;
          setCodeNote(
            "Press a <strong>Push</strong> or <strong>Pop</strong> — each step of the matching C function lights up."
          );
        }
      });
    }

    document.querySelectorAll("[data-deque-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-deque-action");
        if (action === "pushFront") pushFront();
        else if (action === "pushBack") pushBack();
        else if (action === "popFront") popFront();
        else if (action === "popBack") popBack();
        else if (action === "reset") reset();
      });
    });

    if (paletteSelect) {
      paletteSelect.addEventListener("change", function () {
        applyPalette(paletteSelect.value);
      });
    }

    renderCode();
    applyPalette(readPalette());
    paint();
    clearHighlight();
    setStatus("Three blocks ready. Push or pop at either end.");
  }

  try {
    initDequeLane();
  } catch (err) {
    console.error("[learn-deque] Init failed", err);
  }
})();
