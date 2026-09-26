/**
 * Interactive priority queue ADT demo with C highlighter.
 */
(function () {
  var MAX = 10;

  var CODE_LINES = [
    { html: '<span class="code-cm">/* Priority queue ADT — often a heap underneath */</span>' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">enqueue</span>(Item x, <span class="code-type">int</span> p) {', id: "enq-sig" },
    { html: '  <span class="code-kw">if</span> (full()) <span class="code-kw">return</span>;', id: "enq-full" },
    { html: '  store(x, p); <span class="code-cm">/* heap: sift-up */</span>', id: "enq-store" },
    { html: '}' },
    { blank: true },
    { html: 'Item <span class="code-fn">dequeue</span>(<span class="code-type">void</span>) {', id: "deq-sig" },
    { html: '  <span class="code-kw">if</span> (empty()) <span class="code-kw">return</span> NONE;', id: "deq-empty" },
    { html: '  Item top = peek(); <span class="code-cm">/* extreme priority */</span>', id: "deq-peek" },
    { html: '  remove_top(); <span class="code-cm">/* heap: sift-down */</span>', id: "deq-rm" },
    { html: '  <span class="code-kw">return</span> top;', id: "deq-ret" },
    { html: '}' },
    { blank: true },
    { html: 'Item <span class="code-fn">peek</span>(<span class="code-type">void</span>) {', id: "peek-sig" },
    { html: '  <span class="code-kw">return</span> items[best_index()];', id: "peek-ret" },
    { html: '}' }
  ];

  function initPq() {
    var lane = document.getElementById("pq-lane");
    var status = document.getElementById("pq-status");
    var sizeEl = document.getElementById("pq-size");
    var codeRoot = document.getElementById("pq-code");
    var codeNote = document.getElementById("pq-code-note");
    var labelInput = document.getElementById("pq-label");
    var prioInput = document.getElementById("pq-prio");
    var modeSelect = document.getElementById("pq-mode");
    if (!lane) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};
    var items = [];
    var highlightId = null;
    var newId = null;
    var idSeq = 1;
    var mode = "max";

    function seed() {
      idSeq = 1;
      items = [
        { id: idSeq++, label: "A", priority: 5 },
        { id: idSeq++, label: "B", priority: 9 },
        { id: idSeq++, label: "C", priority: 2 },
        { id: idSeq++, label: "D", priority: 7 }
      ];
      highlightId = null;
      newId = null;
    }

    function isMax() {
      return mode === "max";
    }

    function sortedView() {
      return items.slice().sort(function (a, b) {
        if (a.priority !== b.priority) {
          return isMax() ? b.priority - a.priority : a.priority - b.priority;
        }
        return a.id - b.id;
      });
    }

    function bestIndex() {
      if (!items.length) return -1;
      var best = 0;
      for (var i = 1; i < items.length; i++) {
        var better = isMax()
          ? items[i].priority > items[best].priority
          : items[i].priority < items[best].priority;
        if (better) best = i;
      }
      return best;
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

    function paint() {
      lane.innerHTML = "";
      var view = sortedView();
      if (!view.length) {
        var empty = document.createElement("p");
        empty.className = "pq-empty";
        empty.textContent = "(empty)";
        lane.appendChild(empty);
        return;
      }

      var head = document.createElement("div");
      head.className = "pq-lane-head";
      head.textContent = isMax() ? "highest first →" : "lowest first →";
      lane.appendChild(head);

      view.forEach(function (item, i) {
        var el = document.createElement("div");
        el.className = "pq-item";
        if (i === 0) el.classList.add("is-top");
        if (highlightId === item.id) el.classList.add("is-active");
        if (newId === item.id) el.classList.add("is-new");
        el.innerHTML =
          '<span class="pq-item-label">' +
          item.label +
          '</span><span class="pq-item-prio">p=' +
          item.priority +
          "</span>";
        el.setAttribute(
          "aria-label",
          item.label + ", priority " + item.priority + (i === 0 ? ", next out" : "")
        );
        lane.appendChild(el);
      });
    }

    function runSteps(steps, onDone) {
      clearStepTimers();
      var delay = reduceMotion ? 0 : 380;
      steps.forEach(function (step, i) {
        var tid = window.setTimeout(function () {
          try {
            highlight(step.line, true);
            if (step.note) setCodeNote(step.note);
            if (step.apply) step.apply();
            paint();
            if (step.status) setStatus(step.status);
            if (i === steps.length - 1 && onDone) onDone();
          } catch (err) {
            console.error("[learn-pq] Step failed", { step: step, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(tid);
      });
    }

    function readLabel() {
      if (!labelInput) return "X";
      var s = String(labelInput.value || "X")
        .replace(/[^A-Za-z0-9]/g, "")
        .slice(0, 6);
      if (!s) s = "X";
      labelInput.value = s;
      return s;
    }

    function readPrio() {
      if (!prioInput) return NaN;
      var n = parseInt(prioInput.value, 10);
      if (isNaN(n)) return NaN;
      if (n < 0) n = 0;
      if (n > 99) n = 99;
      prioInput.value = String(n);
      return n;
    }

    function doEnqueue() {
      if (busy) return;
      var label = readLabel();
      var p = readPrio();
      if (isNaN(p)) {
        setStatus("Enter a priority from 0–99.");
        return;
      }
      if (items.length >= MAX) {
        setStatus("Demo cap — max " + MAX + " items.");
        return;
      }

      busy = true;
      var item = { id: idSeq++, label: label, priority: p };
      runSteps(
        [
          {
            line: "enq-sig",
            note: "Enter <strong>enqueue</strong> with priority <strong>" + p + "</strong>."
          },
          {
            line: "enq-full",
            note: "Check capacity — room for one more."
          },
          {
            line: "enq-store",
            note: "Store <strong>" + label + "</strong> (heap would sift-up).",
            apply: function () {
              items.push(item);
              newId = item.id;
              highlightId = item.id;
            },
            status: "Enqueued " + label + " with priority " + p + "."
          }
        ],
        function () {
          busy = false;
          newId = null;
          paint();
          if (prioInput) {
            var next = p + 3;
            if (next > 99) next = p - 2;
            if (next < 0) next = 1;
            prioInput.value = String(next);
          }
        }
      );
    }

    function doDequeue() {
      if (busy) return;
      if (!items.length) {
        highlight("deq-empty", true);
        setCodeNote("Underflow — queue is empty.");
        setStatus("Nothing to dequeue.");
        return;
      }

      busy = true;
      var bi = bestIndex();
      var top = items[bi];
      highlightId = top.id;

      runSteps(
        [
          {
            line: "deq-sig",
            note: "Enter <strong>dequeue</strong>."
          },
          {
            line: "deq-empty",
            note: "Not empty — proceed."
          },
          {
            line: "deq-peek",
            note:
              "Next is <strong>" +
              top.label +
              "</strong> (p=" +
              top.priority +
              ").",
            apply: function () {
              highlightId = top.id;
            }
          },
          {
            line: "deq-rm",
            note: "Remove top (heap would sift-down).",
            apply: function () {
              items.splice(bi, 1);
              highlightId = null;
            }
          },
          {
            line: "deq-ret",
            note: "Return <strong>" + top.label + "</strong>.",
            status:
              "Dequeued " +
              top.label +
              " (p=" +
              top.priority +
              ")." +
              (items.length ? " Next up: " + sortedView()[0].label + "." : " Queue empty.")
          }
        ],
        function () {
          busy = false;
        }
      );
    }

    function reset() {
      if (busy) return;
      clearStepTimers();
      seed();
      paint();
      clearHighlight();
      setStatus(
        (isMax() ? "Max" : "Min") +
          "-PQ reset. Enqueue with a priority or dequeue the top item."
      );
      setCodeNote(
        "Press <strong>Enqueue</strong> or <strong>Dequeue</strong> — matching ADT steps light up. Real code often calls a heap."
      );
      if (labelInput) labelInput.value = "Job";
      if (prioInput) prioInput.value = "7";
    }

    document.querySelectorAll("[data-pq-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-pq-action");
        if (action === "enqueue") doEnqueue();
        else if (action === "dequeue") doDequeue();
        else if (action === "reset") reset();
      });
    });

    if (modeSelect) {
      modeSelect.addEventListener("change", function () {
        if (busy) {
          modeSelect.value = mode;
          return;
        }
        mode = modeSelect.value === "min" ? "min" : "max";
        highlightId = null;
        paint();
        setStatus(
          "Switched to " +
            (isMax() ? "max-priority (higher first)" : "min-priority (lower first)") +
            "."
        );
      });
    }

    if (labelInput) {
      labelInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          doEnqueue();
        }
      });
    }
    if (prioInput) {
      prioInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          doEnqueue();
        }
      });
    }

    renderCode();
    seed();
    paint();
    clearHighlight();
    setStatus("Max-PQ seeded. Enqueue with a priority or dequeue the top item.");
  }

  try {
    initPq();
  } catch (err) {
    console.error("[learn-pq] Init failed", err);
  }
})();
