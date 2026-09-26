/**
 * Interactive FIFO queue lane + C circular-array code highlighter.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-kw">#define</span> MAX <span class="code-num">8</span>' },
    { html: '<span class="code-type">char</span> data[MAX];' },
    { html: '<span class="code-type">int</span> front = <span class="code-num">0</span>;', id: "front-idx" },
    { html: '<span class="code-type">int</span> rear = <span class="code-num">0</span>;', id: "rear-idx" },
    { html: '<span class="code-type">int</span> count = <span class="code-num">0</span>;', id: "count" },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">enqueue</span>(<span class="code-type">char</span> x) {', id: "enq-sig" },
    { html: '  <span class="code-kw">if</span> (count &gt;= MAX) <span class="code-kw">return</span>; <span class="code-cm">/* overflow */</span>', id: "enq-check" },
    { html: '  data[rear] = x;', id: "enq-store" },
    { html: '  rear = (rear + <span class="code-num">1</span>) % MAX;', id: "enq-rear" },
    { html: '  count++;', id: "enq-count" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">char</span> <span class="code-fn">dequeue</span>(<span class="code-type">void</span>) {', id: "deq-sig" },
    { html: '  <span class="code-kw">if</span> (count &lt;= <span class="code-num">0</span>) <span class="code-kw">return</span> <span class="code-str">\'?\'</span>; <span class="code-cm">/* underflow */</span>', id: "deq-check" },
    { html: '  <span class="code-type">char</span> x = data[front];', id: "deq-read" },
    { html: '  front = (front + <span class="code-num">1</span>) % MAX;', id: "deq-front" },
    { html: '  count--;', id: "deq-count" },
    { html: '  <span class="code-kw">return</span> x;', id: "deq-ret" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">char</span> <span class="code-fn">front_val</span>(<span class="code-type">void</span>) {', id: "front-sig" },
    { html: '  <span class="code-kw">if</span> (count &lt;= <span class="code-num">0</span>) <span class="code-kw">return</span> <span class="code-str">\'?\'</span>;', id: "front-check" },
    { html: '  <span class="code-kw">return</span> data[front];', id: "front-ret" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">int</span> <span class="code-fn">isEmpty</span>(<span class="code-type">void</span>) {', id: "empty-sig" },
    { html: '  <span class="code-kw">return</span> count == <span class="code-num">0</span>;', id: "empty-ret" },
    { html: '}' }
  ];

  var STEPS = {
    enqueue: [
      { line: "enq-sig", note: "Enter <strong>enqueue</strong> with the new value." },
      { line: "enq-check", note: "Guard: refuse if <strong>count &gt;= MAX</strong>." },
      { line: "enq-store", note: "Write into <strong>data[rear]</strong>.", visual: "commit" },
      { line: "enq-rear", note: "Advance <strong>rear</strong> with wrap-around <code>% MAX</code>." },
      { line: "enq-count", note: "Bump <strong>count</strong> — one more item in the lane." }
    ],
    dequeue: [
      { line: "deq-sig", note: "Enter <strong>dequeue</strong>." },
      { line: "deq-check", note: "Guard: refuse if the queue is empty." },
      { line: "deq-read", note: "Read the value at <strong>data[front]</strong>.", visual: "start" },
      { line: "deq-front", note: "Advance <strong>front</strong> — that slot leaves the queue." },
      { line: "deq-count", note: "Decrement <strong>count</strong>." },
      { line: "deq-ret", note: "Return the dequeued value to the caller.", visual: "commit" }
    ],
    front: [
      { line: "front-sig", note: "Enter <strong>front_val</strong> (peek at front)." },
      { line: "front-check", note: "Guard: refuse if empty." },
      { line: "front-ret", note: "Return <strong>data[front]</strong> without changing indices.", visual: "commit" }
    ],
    isEmpty: [
      { line: "empty-sig", note: "Enter <strong>isEmpty</strong>." },
      { line: "empty-ret", note: "Return whether <strong>count == 0</strong>.", visual: "commit" }
    ],
    reset: [
      { line: "count", note: "Reset demo: <strong>count = 3</strong> with A, B, C loaded." }
    ]
  };

  function initQueueLane() {
    var root = document.getElementById("queue-3d");
    var status = document.getElementById("queue-status");
    var sizeEl = document.getElementById("queue-size");
    var stage = document.querySelector(".queue-stage");
    var codeRoot = document.getElementById("queue-code");
    var codeNote = document.getElementById("queue-code-note");
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
    var PALETTE_KEY = "learnQueuePaletteV1";
    var PALETTES = ["ocean", "ember", "mint", "ink", "light"];
    var paletteSelect = document.getElementById("queue-palette");

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
        console.warn("[learn-queue] Could not save palette", err);
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
      el.className = "queue-face queue-face-" + name;
      if (text) {
        var span = document.createElement("span");
        span.className = "queue-face-label";
        span.textContent = text;
        el.appendChild(span);
      }
      return el;
    }

    function makeBlock(item, isFront, isRear, index) {
      var slot = document.createElement("div");
      slot.className =
        "queue-slot" +
        (isFront ? " is-front" : "") +
        (isRear ? " is-rear" : "");
      slot.style.setProperty("--i", String(index));
      slot.dataset.label = item.label;

      var block = document.createElement("div");
      block.className = "queue-block";
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
      spark.className = "queue-spark";
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
            console.error("[learn-queue] Step failed", { name: name, step: step, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(id);
      });
    }

    function enqueue() {
      if (busy) return;
      if (items.length >= MAX) {
        highlight("enq-check", true);
        setCodeNote("Overflow — <strong>count &gt;= MAX</strong>, enqueue aborts.");
        setStatus("Queue overflow — max " + MAX + ". Dequeue first.");
        return;
      }

      busy = true;
      var label = nextLetter();
      var tone = items.length % TONES;

      runSteps("enqueue", {
        onCommit: function () {
          items.push({ label: label, tone: tone });
          paint();
          var rearSlot = root.querySelector(".queue-slot.is-rear");
          if (rearSlot && !reduceMotion) rearSlot.classList.add("is-entering");
          setStatus("Enqueued “" + label + "” at the rear.");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function dequeue() {
      if (busy) return;
      if (!items.length) {
        highlight("deq-check", true);
        setCodeNote("Underflow — <strong>count &lt;= 0</strong>, dequeue aborts.");
        setStatus("Queue underflow — nothing to dequeue.");
        return;
      }

      busy = true;
      var removed = null;

      runSteps("dequeue", {
        onStart: function () {
          removed = items[0];
          var frontSlot = root.querySelector(".queue-slot.is-front");
          if (!frontSlot || reduceMotion) return null;
          var rect = frontSlot.getBoundingClientRect();
          var stageRect = stage.getBoundingClientRect();
          spawnSpark(
            rect.left + rect.width / 2 - stageRect.left,
            rect.top + rect.height / 2 - stageRect.top
          );
          frontSlot.classList.remove("is-front");
          frontSlot.classList.add("is-leaving");
          setStatus("Dequeued “" + removed.label + "” — sliding off left…");
          return frontSlot;
        },
        onCommit: function () {
          removed = items.shift();
          window.setTimeout(
            function () {
              paint();
              setStatus("Dequeued “" + removed.label + "”. Size " + items.length + ".");
            },
            reduceMotion ? 0 : 420
          );
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function frontOp() {
      if (busy) return;
      if (!items.length) {
        highlight("front-check", true);
        setCodeNote("Empty — front has nothing to return.");
        setStatus("Empty — nothing at the front.");
        return;
      }

      busy = true;
      var head = items[0];

      runSteps("front", {
        onCommit: function () {
          var frontSlot = root.querySelector(".queue-slot.is-front");
          if (frontSlot && !reduceMotion) {
            frontSlot.classList.remove("is-peek");
            void frontSlot.offsetWidth;
            frontSlot.classList.add("is-peek");
          }
          setStatus("Front → “" + head.label + "” (still in the queue).");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function isEmptyOp() {
      if (busy) return;
      busy = true;
      var empty = items.length === 0;

      runSteps("isEmpty", {
        onCommit: function () {
          setStatus(
            empty
              ? "isEmpty → true (count is 0)."
              : "isEmpty → false (count is " + items.length + ")."
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
      setStatus("Reset. Dequeue the front—watch it leave left.");
      runSteps("reset", {
        onDone: function () {
          busy = false;
          setCodeNote(
            "Press <strong>Enqueue</strong>, <strong>Dequeue</strong>, or <strong>Front</strong> — each step of the matching C function lights up."
          );
        }
      });
    }

    document.querySelectorAll("[data-queue-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-queue-action");
        if (action === "enqueue") enqueue();
        else if (action === "dequeue") dequeue();
        else if (action === "front") frontOp();
        else if (action === "isEmpty") isEmptyOp();
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
    setStatus("Three blocks in line. Dequeue the front—watch it leave left.");
  }

  try {
    initQueueLane();
  } catch (err) {
    console.error("[learn-queue] Init failed", err);
  }
})();
