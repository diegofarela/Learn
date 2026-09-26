/**
 * Interactive contiguous array + C code line highlighter.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-kw">#define</span> INIT_CAP <span class="code-num">6</span>' },
    { html: '<span class="code-type">char</span> *data;' },
    { html: '<span class="code-type">int</span> len = <span class="code-num">0</span>;', id: "len" },
    { html: '<span class="code-type">int</span> cap = INIT_CAP;', id: "cap" },
    { blank: true },
    { html: '<span class="code-type">char</span> <span class="code-fn">get</span>(<span class="code-type">int</span> i) {', id: "get-sig" },
    { html: '  <span class="code-kw">if</span> (i &lt; <span class="code-num">0</span> || i &gt;= len) <span class="code-kw">return</span> <span class="code-str">\'?\'</span>;', id: "get-check" },
    { html: '  <span class="code-kw">return</span> data[i]; <span class="code-cm">/* base + i */</span>', id: "get-ret" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">set</span>(<span class="code-type">int</span> i, <span class="code-type">char</span> x) {', id: "set-sig" },
    { html: '  <span class="code-kw">if</span> (i &lt; <span class="code-num">0</span> || i &gt;= len) <span class="code-kw">return</span>;', id: "set-check" },
    { html: '  data[i] = x;', id: "set-store" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">append</span>(<span class="code-type">char</span> x) {', id: "app-sig" },
    { html: '  <span class="code-kw">if</span> (len &gt;= cap) grow();', id: "app-check" },
    { html: '  data[len++] = x;', id: "app-store" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">grow</span>(<span class="code-type">void</span>) {', id: "grow-sig" },
    { html: '  cap *= <span class="code-num">2</span>;', id: "grow-cap" },
    { html: '  data = realloc(data, cap); <span class="code-cm">/* copy */</span>', id: "grow-copy" },
    { html: '}' }
  ];

  var STEPS = {
    read: [
      { line: "get-sig", note: "Enter <strong>get</strong> with index <code>i</code>." },
      { line: "get-check", note: "Bounds: refuse if <code>i</code> is outside <code>0 … len−1</code>." },
      { line: "get-ret", note: "Jump to <strong>data[i]</strong> — address = base + i × size.", visual: "commit" }
    ],
    write: [
      { line: "set-sig", note: "Enter <strong>set</strong> with index and new value." },
      { line: "set-check", note: "Bounds check before writing." },
      { line: "set-store", note: "Overwrite <strong>data[i]</strong> in place — still O(1).", visual: "commit" }
    ],
    append: [
      { line: "app-sig", note: "Enter <strong>append</strong>." },
      { line: "app-check", note: "If full, call <strong>grow</strong> first (amortized cost)." },
      { line: "app-store", note: "Store at <strong>data[len]</strong>, then bump <code>len</code>.", visual: "commit" },
      { line: "len", note: "Length is now one larger." }
    ],
    appendGrow: [
      { line: "app-sig", note: "Enter <strong>append</strong> — capacity is full." },
      { line: "app-check", note: "Guard trips: need to grow before writing." },
      { line: "grow-sig", note: "Enter <strong>grow</strong>." },
      { line: "grow-cap", note: "Double capacity: <code>cap *= 2</code>.", visual: "start" },
      { line: "grow-copy", note: "Reallocate and copy old slots into the new block." },
      { line: "app-store", note: "Now room — store at <strong>data[len]</strong> and bump len.", visual: "commit" },
      { line: "len", note: "Append finished after resize." }
    ],
    resize: [
      { line: "grow-sig", note: "Enter <strong>grow</strong> (manual resize demo)." },
      { line: "grow-cap", note: "Double <code>cap</code>.", visual: "start" },
      { line: "grow-copy", note: "New block · old values copied · empty slots appear.", visual: "commit" },
      { line: "cap", note: "Capacity updated; <code>len</code> unchanged." }
    ],
    reset: [
      { line: "len", note: "Reset demo: <strong>len = 4</strong>, <strong>cap = 6</strong> with A–D." }
    ]
  };

  function initArray() {
    var root = document.getElementById("array-strip");
    var status = document.getElementById("array-status");
    var lenEl = document.getElementById("array-len");
    var capEl = document.getElementById("array-cap");
    var indexInput = document.getElementById("array-index");
    var codeRoot = document.getElementById("array-code");
    var codeNote = document.getElementById("array-code-note");
    if (!root) return;

    var INIT_CAP = 6;
    var MAX_CAP = 12;
    var TONES = 6;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var nextCode = 69; /* 'E' */
    var items = [
      { label: "A", tone: 0 },
      { label: "B", tone: 1 },
      { label: "C", tone: 2 },
      { label: "D", tone: 3 }
    ];
    var cap = INIT_CAP;
    var lineEls = {};

    function nextLetter() {
      var ch = String.fromCharCode(nextCode);
      nextCode = nextCode >= 90 ? 65 : nextCode + 1;
      return ch;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
      if (lenEl) lenEl.textContent = String(items.length);
      if (capEl) capEl.textContent = String(cap);
      if (indexInput) {
        indexInput.max = String(Math.max(0, items.length - 1));
      }
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

    function readIndex() {
      var raw = indexInput ? parseInt(indexInput.value, 10) : 0;
      if (isNaN(raw)) return 0;
      return raw;
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
          active.scrollIntoView({
            block: "nearest",
            behavior: reduceMotion ? "auto" : "smooth"
          });
        } catch (err) {}
      }
    }

    function clearHighlight() {
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
    }

    function makeCell(item, index, filled) {
      var cell = document.createElement("div");
      cell.className =
        "array-cell" + (filled ? " is-filled" : " is-empty");
      cell.dataset.index = String(index);
      if (item) cell.dataset.tone = String(item.tone % TONES);

      var face = document.createElement("div");
      face.className = "array-cell-face";
      var val = document.createElement("span");
      val.className = "array-cell-val";
      val.textContent = filled && item ? item.label : "·";
      face.appendChild(val);

      var idx = document.createElement("span");
      idx.className = "array-cell-idx";
      idx.textContent = String(index);

      cell.appendChild(face);
      cell.appendChild(idx);
      cell.setAttribute(
        "aria-label",
        filled && item
          ? "Index " + index + ", value " + item.label
          : "Index " + index + ", empty capacity slot"
      );
      return cell;
    }

    function paint(opts) {
      opts = opts || {};
      root.innerHTML = "";
      root.style.setProperty("--array-cap", String(cap));
      var i;
      for (i = 0; i < cap; i++) {
        var filled = i < items.length;
        var cell = makeCell(filled ? items[i] : null, i, filled);
        if (opts.highlight === i) cell.classList.add("is-access");
        if (opts.pulse === i) cell.classList.add("is-write");
        if (opts.growing) cell.classList.add("is-growing");
        root.appendChild(cell);
      }
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
            console.error("[learn-arrays] Step failed", {
              name: name,
              step: step,
              err: err
            });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(id);
      });
    }

    function doRead() {
      if (busy) return;
      var i = readIndex();
      if (i < 0 || i >= items.length) {
        highlight("get-check", true);
        setCodeNote(
          "Out of bounds — <strong>i &lt; 0 || i &gt;= len</strong>, get aborts."
        );
        setStatus("Bounds error — valid indices are 0…" + Math.max(0, items.length - 1) + ".");
        paint();
        return;
      }

      busy = true;
      var value = items[i].label;
      runSteps("read", {
        onCommit: function () {
          paint({ highlight: i });
          setStatus("Read data[" + i + "] → “" + value + "” (O(1) index jump).");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function doWrite() {
      if (busy) return;
      var i = readIndex();
      if (i < 0 || i >= items.length) {
        highlight("set-check", true);
        setCodeNote("Out of bounds — write aborted.");
        setStatus("Bounds error — nothing written.");
        paint();
        return;
      }

      busy = true;
      var label = nextLetter();
      runSteps("write", {
        onCommit: function () {
          items[i] = { label: label, tone: i % TONES };
          paint({ pulse: i });
          setStatus("Wrote “" + label + "” into data[" + i + "].");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function doAppend() {
      if (busy) return;
      if (items.length >= MAX_CAP && items.length >= cap) {
        setStatus("Demo max capacity " + MAX_CAP + " — reset to continue.");
        return;
      }

      busy = true;
      var label = nextLetter();
      var needsGrow = items.length >= cap;
      var stepName = needsGrow ? "appendGrow" : "append";

      runSteps(stepName, {
        onStart: function () {
          var nextCap = Math.min(MAX_CAP, Math.max(cap * 2, cap + 1));
          paint({ growing: true });
          setStatus("Growing capacity " + cap + " → " + nextCap + "…");
          return nextCap;
        },
        onCommit: function (nextCap) {
          if (typeof nextCap === "number") cap = nextCap;
          items.push({ label: label, tone: items.length % TONES });
          paint({ pulse: items.length - 1 });
          setStatus(
            "Appended “" +
              label +
              "”." +
              (needsGrow ? " Resized first (amortized O(1))." : "")
          );
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function doResize() {
      if (busy) return;
      if (cap >= MAX_CAP) {
        highlight("grow-cap", true);
        setCodeNote("Demo cap already at max — reset to shrink again.");
        setStatus("Capacity already " + MAX_CAP + ".");
        return;
      }

      busy = true;
      runSteps("resize", {
        onStart: function () {
          paint({ growing: true });
          return Math.min(MAX_CAP, cap * 2);
        },
        onCommit: function (nextCap) {
          cap = nextCap;
          paint();
          setStatus("Resized — capacity is now " + cap + " (len still " + items.length + ").");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function doReset() {
      if (busy) return;
      busy = true;
      items = [
        { label: "A", tone: 0 },
        { label: "B", tone: 1 },
        { label: "C", tone: 2 },
        { label: "D", tone: 3 }
      ];
      cap = INIT_CAP;
      nextCode = 69;
      if (indexInput) indexInput.value = "1";
      paint();
      setStatus("Reset. Four slots filled — try Read at index 1.");
      runSteps("reset", {
        onDone: function () {
          busy = false;
          setCodeNote(
            "Press <strong>Read</strong>, <strong>Write</strong>, <strong>Append</strong>, or <strong>Resize</strong> — matching C steps light up."
          );
        }
      });
    }

    document.querySelectorAll("[data-array-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-array-action");
        if (action === "read") doRead();
        else if (action === "write") doWrite();
        else if (action === "append") doAppend();
        else if (action === "resize") doResize();
        else if (action === "reset") doReset();
      });
    });

    renderCode();
    paint();
    clearHighlight();
    setStatus("Four slots filled. Read index 1 — watch the O(1) jump.");
  }

  try {
    initArray();
  } catch (err) {
    console.error("[learn-arrays] Init failed", err);
  }
})();
