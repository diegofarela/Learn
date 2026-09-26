/**
 * Interactive min-heap (tree + array) with sift-up / sift-down C highlighter.
 */
(function () {
  var MAX = 15;

  var CODE_LINES = [
    { html: '<span class="code-kw">#define</span> MAX <span class="code-num">15</span>' },
    { html: '<span class="code-type">int</span> a[MAX];' },
    { html: '<span class="code-type">int</span> n = <span class="code-num">0</span>;', id: "n-count" },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">siftUp</span>(<span class="code-type">int</span> i) {', id: "up-sig" },
    { html: '  <span class="code-kw">while</span> (i &gt; <span class="code-num">0</span>) {', id: "up-loop" },
    { html: '    <span class="code-type">int</span> p = (i - <span class="code-num">1</span>) / <span class="code-num">2</span>;', id: "up-parent" },
    { html: '    <span class="code-kw">if</span> (a[i] &gt;= a[p]) <span class="code-kw">break</span>;', id: "up-cmp" },
    { html: '    swap(a[i], a[p]); i = p;', id: "up-swap" },
    { html: '  }' },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">siftDown</span>(<span class="code-type">int</span> i) {', id: "dn-sig" },
    { html: '  <span class="code-kw">for</span> (;;) {', id: "dn-loop" },
    { html: '    <span class="code-type">int</span> l = <span class="code-num">2</span>*i+<span class="code-num">1</span>, r = l+<span class="code-num">1</span>, m = i;', id: "dn-kids" },
    { html: '    <span class="code-kw">if</span> (l &lt; n &amp;&amp; a[l] &lt; a[m]) m = l;', id: "dn-left" },
    { html: '    <span class="code-kw">if</span> (r &lt; n &amp;&amp; a[r] &lt; a[m]) m = r;', id: "dn-right" },
    { html: '    <span class="code-kw">if</span> (m == i) <span class="code-kw">break</span>;', id: "dn-stop" },
    { html: '    swap(a[i], a[m]); i = m;', id: "dn-swap" },
    { html: '  }' },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">insert</span>(<span class="code-type">int</span> x) {', id: "ins-sig" },
    { html: '  a[n++] = x; siftUp(n - <span class="code-num">1</span>);', id: "ins-body" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">int</span> <span class="code-fn">extractMin</span>(<span class="code-type">void</span>) {', id: "ex-sig" },
    { html: '  <span class="code-type">int</span> root = a[<span class="code-num">0</span>];', id: "ex-root" },
    { html: '  a[<span class="code-num">0</span>] = a[--n];', id: "ex-move" },
    { html: '  <span class="code-kw">if</span> (n) siftDown(<span class="code-num">0</span>);', id: "ex-sift" },
    { html: '  <span class="code-kw">return</span> root;', id: "ex-ret" },
    { html: '}' }
  ];

  function initHeap() {
    var nodesEl = document.getElementById("heap-nodes");
    var edgesEl = document.getElementById("heap-edges");
    var arrayEl = document.getElementById("heap-array");
    var stage = document.querySelector(".heap-stage");
    var status = document.getElementById("heap-status");
    var sizeEl = document.getElementById("heap-size");
    var codeRoot = document.getElementById("heap-code");
    var codeNote = document.getElementById("heap-code-note");
    var valueInput = document.getElementById("heap-value");
    if (!nodesEl || !edgesEl || !arrayEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};
    var heap = [];
    var highlightIdx = [];
    var swapPair = null;
    var newIdx = -1;

    function seed() {
      heap = [3, 8, 5, 12, 10];
      highlightIdx = [];
      swapPair = null;
      newIdx = -1;
    }

    function readValue() {
      if (!valueInput) return NaN;
      var n = parseInt(valueInput.value, 10);
      if (isNaN(n)) return NaN;
      if (n < 0) n = 0;
      if (n > 99) n = 99;
      valueInput.value = String(n);
      return n;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
      if (sizeEl) sizeEl.textContent = String(heap.length);
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

    function parent(i) {
      return Math.floor((i - 1) / 2);
    }

    function treeHeight() {
      if (!heap.length) return -1;
      return Math.floor(Math.log2(heap.length));
    }

    function paint() {
      var n = heap.length;
      var stageW = stage ? stage.clientWidth : 400;
      var stageH = stage ? stage.clientHeight : 240;
      var padX = 28;
      var padY = 24;
      var usableW = Math.max(120, stageW - padX * 2);
      var usableH = Math.max(90, stageH - padY * 2);
      var h = Math.max(0, treeHeight());
      var levelGap = h > 0 ? usableH / h : 0;

      function pos(i) {
        var depth = Math.floor(Math.log2(i + 1));
        var levelStart = Math.pow(2, depth) - 1;
        var offset = i - levelStart;
        var slots = Math.pow(2, depth);
        var x = padX + ((offset + 0.5) / slots) * usableW;
        var y = padY + (h > 0 ? depth * levelGap : usableH / 2);
        return { x: x, y: y };
      }

      edgesEl.setAttribute("viewBox", "0 0 " + stageW + " " + stageH);
      edgesEl.setAttribute("width", String(stageW));
      edgesEl.setAttribute("height", String(stageH));
      edgesEl.innerHTML = "";

      for (var i = 0; i < n; i++) {
        var left = 2 * i + 1;
        var right = 2 * i + 2;
        [left, right].forEach(function (child) {
          if (child >= n) return;
          var from = pos(i);
          var to = pos(child);
          var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", String(from.x));
          line.setAttribute("y1", String(from.y));
          line.setAttribute("x2", String(to.x));
          line.setAttribute("y2", String(to.y));
          var activeEdge =
            swapPair &&
            ((swapPair[0] === i && swapPair[1] === child) ||
              (swapPair[1] === i && swapPair[0] === child));
          line.setAttribute("class", "heap-edge" + (activeEdge ? " is-active" : ""));
          edgesEl.appendChild(line);
        });
      }

      nodesEl.innerHTML = "";
      for (var j = 0; j < n; j++) {
        var p = pos(j);
        var el = document.createElement("div");
        el.className = "heap-node";
        el.textContent = String(heap[j]);
        el.style.left = p.x + "px";
        el.style.top = p.y + "px";
        if (j === 0) el.classList.add("is-root");
        if (highlightIdx.indexOf(j) !== -1) el.classList.add("is-active");
        if (newIdx === j) el.classList.add("is-new");
        if (swapPair && (swapPair[0] === j || swapPair[1] === j)) {
          el.classList.add("is-swap");
        }
        el.setAttribute(
          "aria-label",
          "Index " + j + ", value " + heap[j] + (j === 0 ? ", root" : "")
        );
        nodesEl.appendChild(el);
      }

      arrayEl.innerHTML = "";
      var label = document.createElement("span");
      label.className = "heap-array-label";
      label.textContent = "a[]";
      arrayEl.appendChild(label);

      if (!n) {
        var empty = document.createElement("span");
        empty.className = "heap-array-empty";
        empty.textContent = "(empty)";
        arrayEl.appendChild(empty);
      } else {
        for (var k = 0; k < n; k++) {
          var cell = document.createElement("div");
          cell.className = "heap-cell";
          if (highlightIdx.indexOf(k) !== -1) cell.classList.add("is-active");
          if (newIdx === k) cell.classList.add("is-new");
          if (swapPair && (swapPair[0] === k || swapPair[1] === k)) {
            cell.classList.add("is-swap");
          }
          var idx = document.createElement("span");
          idx.className = "heap-cell-idx";
          idx.textContent = String(k);
          var val = document.createElement("span");
          val.className = "heap-cell-val";
          val.textContent = String(heap[k]);
          cell.appendChild(idx);
          cell.appendChild(val);
          arrayEl.appendChild(cell);
        }
      }
    }

    function runSteps(steps, ctx) {
      clearStepTimers();
      var delay = reduceMotion ? 0 : 420;

      if (!steps.length) {
        if (ctx && typeof ctx.onDone === "function") ctx.onDone();
        return;
      }

      steps.forEach(function (step, i) {
        var id = window.setTimeout(function () {
          try {
            highlight(step.line, true);
            if (step.note) setCodeNote(step.note);
            if (step.highlight) highlightIdx = step.highlight.slice();
            else if (step.highlight === null) highlightIdx = [];
            if (step.swap) swapPair = step.swap.slice();
            else if (step.clearSwap) swapPair = null;
            if (typeof step.newIdx === "number") newIdx = step.newIdx;
            if (step.apply && typeof step.apply === "function") step.apply();
            paint();
            if (i === steps.length - 1) {
              var doneId = window.setTimeout(function () {
                highlightIdx = [];
                swapPair = null;
                newIdx = -1;
                paint();
                if (ctx && typeof ctx.onDone === "function") ctx.onDone();
              }, reduceMotion ? 0 : 280);
              stepTimers.push(doneId);
            }
          } catch (err) {
            console.error("[learn-heap] Step failed", { step: step, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(id);
      });
    }

    function buildInsertSteps(x) {
      var steps = [];
      var sim = heap.slice();
      steps.push({
        line: "ins-sig",
        note: "Enter <strong>insert</strong> with <strong>" + x + "</strong>."
      });
      steps.push({
        line: "ins-body",
        note: "Append <strong>" + x + "</strong> at index <strong>" + sim.length + "</strong>, then sift-up.",
        apply: function () {
          heap.push(x);
        },
        highlight: [sim.length],
        newIdx: sim.length
      });
      sim.push(x);

      var i = sim.length - 1;
      steps.push({
        line: "up-sig",
        note: "Enter <strong>siftUp</strong> at index <strong>" + i + "</strong>.",
        highlight: [i]
      });

      while (i > 0) {
        var p = parent(i);
        steps.push({
          line: "up-loop",
          note: "Still above the root — keep bubbling.",
          highlight: [i, p]
        });
        steps.push({
          line: "up-parent",
          note: "Parent of <strong>" + i + "</strong> is <strong>" + p + "</strong>.",
          highlight: [i, p]
        });
        if (sim[i] >= sim[p]) {
          steps.push({
            line: "up-cmp",
            note: "a[" + i + "] ≥ a[" + p + "] — heap property holds, stop.",
            highlight: [i, p]
          });
          break;
        }
        steps.push({
          line: "up-cmp",
          note: "a[" + i + "] &lt; a[" + p + "] — must swap.",
          highlight: [i, p]
        });
        (function (ci, cp) {
          steps.push({
            line: "up-swap",
            note: "Swap a[" + ci + "] ↔ a[" + cp + "], climb to parent.",
            highlight: [ci, cp],
            swap: [ci, cp],
            apply: function () {
              var tmp = heap[ci];
              heap[ci] = heap[cp];
              heap[cp] = tmp;
            }
          });
        })(i, p);
        var tmp = sim[i];
        sim[i] = sim[p];
        sim[p] = tmp;
        i = p;
      }

      steps.push({
        line: "n-count",
        note: "Insert done. Size is <strong>" + sim.length + "</strong>.",
        highlight: [0],
        clearSwap: true
      });
      return steps;
    }

    function buildExtractSteps() {
      var steps = [];
      var sim = heap.slice();
      var rootVal = sim[0];

      steps.push({
        line: "ex-sig",
        note: "Enter <strong>extractMin</strong>."
      });
      steps.push({
        line: "ex-root",
        note: "Remember root value <strong>" + rootVal + "</strong>.",
        highlight: [0]
      });
      steps.push({
        line: "ex-move",
        note: "Move last element into the root and shrink <strong>n</strong>.",
        highlight: [0, sim.length - 1],
        swap: sim.length > 1 ? [0, sim.length - 1] : null,
        apply: function () {
          if (heap.length === 1) {
            heap.pop();
            return;
          }
          heap[0] = heap[heap.length - 1];
          heap.pop();
        }
      });

      sim[0] = sim[sim.length - 1];
      sim.pop();

      if (!sim.length) {
        steps.push({
          line: "ex-ret",
          note: "Heap empty. Return <strong>" + rootVal + "</strong>.",
          highlight: null
        });
        return { steps: steps, rootVal: rootVal };
      }

      steps.push({
        line: "ex-sift",
        note: "Call <strong>siftDown(0)</strong> to restore the heap.",
        highlight: [0],
        clearSwap: true
      });
      steps.push({
        line: "dn-sig",
        note: "Enter <strong>siftDown</strong> at the root.",
        highlight: [0]
      });

      var i = 0;
      while (true) {
        var l = 2 * i + 1;
        var r = l + 1;
        var m = i;
        steps.push({
          line: "dn-loop",
          note: "Find the smallest among node and children.",
          highlight: [i].concat(l < sim.length ? [l] : []).concat(r < sim.length ? [r] : [])
        });
        steps.push({
          line: "dn-kids",
          note: "Left = <strong>" + l + "</strong>, right = <strong>" + r + "</strong>.",
          highlight: [i].concat(l < sim.length ? [l] : []).concat(r < sim.length ? [r] : [])
        });
        if (l < sim.length && sim[l] < sim[m]) m = l;
        steps.push({
          line: "dn-left",
          note:
            l < sim.length
              ? "Compare left child a[" + l + "] = " + sim[l] + "."
              : "No left child.",
          highlight: [i].concat(l < sim.length ? [l] : [])
        });
        if (r < sim.length && sim[r] < sim[m]) m = r;
        steps.push({
          line: "dn-right",
          note:
            r < sim.length
              ? "Compare right child a[" + r + "] = " + sim[r] + "."
              : "No right child.",
          highlight: [i].concat(r < sim.length ? [r] : [])
        });
        if (m === i) {
          steps.push({
            line: "dn-stop",
            note: "Node is smaller than both children — stop.",
            highlight: [i]
          });
          break;
        }
        steps.push({
          line: "dn-stop",
          note: "Smaller child at index <strong>" + m + "</strong> — swap.",
          highlight: [i, m]
        });
        (function (ci, cm) {
          steps.push({
            line: "dn-swap",
            note: "Swap a[" + ci + "] ↔ a[" + cm + "], continue down.",
            highlight: [ci, cm],
            swap: [ci, cm],
            apply: function () {
              var tmp = heap[ci];
              heap[ci] = heap[cm];
              heap[cm] = tmp;
            }
          });
        })(i, m);
        var tmp = sim[i];
        sim[i] = sim[m];
        sim[m] = tmp;
        i = m;
      }

      steps.push({
        line: "ex-ret",
        note: "Return extracted min <strong>" + rootVal + "</strong>.",
        highlight: [0],
        clearSwap: true
      });
      return { steps: steps, rootVal: rootVal };
    }

    function doInsert() {
      if (busy) return;
      var x = readValue();
      if (isNaN(x)) {
        setStatus("Enter a number from 0–99.");
        return;
      }
      if (heap.length >= MAX) {
        setStatus("Demo cap — max " + MAX + " elements.");
        return;
      }
      busy = true;
      var steps = buildInsertSteps(x);
      runSteps(steps, {
        onDone: function () {
          setStatus("Inserted " + x + ". Root is " + heap[0] + ".");
          busy = false;
          if (valueInput) {
            var next = x + 5;
            if (next > 99) next = x - 4;
            if (next < 0) next = 1;
            valueInput.value = String(next);
          }
        }
      });
    }

    function doExtract() {
      if (busy) return;
      if (!heap.length) {
        highlight("ex-sig", true);
        setCodeNote("Underflow — heap is empty.");
        setStatus("Heap underflow — nothing to extract.");
        return;
      }
      busy = true;
      var built = buildExtractSteps();
      runSteps(built.steps, {
        onDone: function () {
          setStatus(
            "Extracted " +
              built.rootVal +
              (heap.length ? ". New root is " + heap[0] + "." : ". Heap empty.")
          );
          busy = false;
        }
      });
    }

    function reset() {
      if (busy) return;
      clearStepTimers();
      seed();
      paint();
      clearHighlight();
      setStatus("Reset to starter min-heap [3, 8, 5, 12, 10].");
      setCodeNote(
        "Press <strong>Insert</strong> or <strong>Extract-root</strong> — sift steps light up in the C code."
      );
      if (valueInput) valueInput.value = "7";
    }

    document.querySelectorAll("[data-heap-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-heap-action");
        if (action === "insert") doInsert();
        else if (action === "extract") doExtract();
        else if (action === "reset") reset();
      });
    });

    if (valueInput) {
      valueInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          doInsert();
        }
      });
    }

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        try {
          paint();
        } catch (err) {
          console.warn("[learn-heap] Repaint on resize failed", err);
        }
      }, 80);
    });

    renderCode();
    seed();
    paint();
    clearHighlight();
    setStatus("Min-heap seeded. Insert a value or extract the root.");
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        try {
          paint();
        } catch (err) {
          console.warn("[learn-heap] Initial layout pass failed", err);
        }
      });
    }
  }

  try {
    initHeap();
  } catch (err) {
    console.error("[learn-heap] Init failed", err);
  }
})();
