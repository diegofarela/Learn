/**
 * Interactive singly linked list + C code line highlighter.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-kw">struct</span> Node {' },
    { html: '  <span class="code-type">char</span> val;' },
    { html: '  <span class="code-kw">struct</span> Node *next;' },
    { html: '};' },
    { html: '<span class="code-kw">struct</span> Node *head = <span class="code-kw">NULL</span>;', id: "head" },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">insert_head</span>(<span class="code-type">char</span> x) {', id: "ih-sig" },
    { html: '  <span class="code-kw">struct</span> Node *n = malloc(<span class="code-kw">sizeof</span>(*n));', id: "ih-alloc" },
    { html: '  n-&gt;val = x;', id: "ih-val" },
    { html: '  n-&gt;next = head;', id: "ih-link" },
    { html: '  head = n;', id: "ih-head" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">insert_tail</span>(<span class="code-type">char</span> x) {', id: "it-sig" },
    { html: '  <span class="code-kw">struct</span> Node *n = malloc(<span class="code-kw">sizeof</span>(*n));', id: "it-alloc" },
    { html: '  n-&gt;val = x; n-&gt;next = <span class="code-kw">NULL</span>;', id: "it-init" },
    { html: '  <span class="code-kw">if</span> (!head) { head = n; <span class="code-kw">return</span>; }', id: "it-empty" },
    { html: '  <span class="code-kw">struct</span> Node *p = head;', id: "it-walk" },
    { html: '  <span class="code-kw">while</span> (p-&gt;next) p = p-&gt;next;', id: "it-scan" },
    { html: '  p-&gt;next = n;', id: "it-link" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">char</span> <span class="code-fn">delete_head</span>(<span class="code-type">void</span>) {', id: "dh-sig" },
    { html: '  <span class="code-kw">if</span> (!head) <span class="code-kw">return</span> <span class="code-str">\'?\'</span>;', id: "dh-check" },
    { html: '  <span class="code-kw">struct</span> Node *n = head;', id: "dh-take" },
    { html: '  head = head-&gt;next;', id: "dh-advance" },
    { html: '  <span class="code-type">char</span> x = n-&gt;val; free(n);', id: "dh-free" },
    { html: '  <span class="code-kw">return</span> x;', id: "dh-ret" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-kw">struct</span> Node *<span class="code-fn">find</span>(<span class="code-type">char</span> x) {', id: "f-sig" },
    { html: '  <span class="code-kw">struct</span> Node *p = head;', id: "f-start" },
    { html: '  <span class="code-kw">while</span> (p) {', id: "f-loop" },
    { html: '    <span class="code-kw">if</span> (p-&gt;val == x) <span class="code-kw">return</span> p;', id: "f-match" },
    { html: '    p = p-&gt;next;', id: "f-next" },
    { html: '  }' },
    { html: '  <span class="code-kw">return</span> <span class="code-kw">NULL</span>;', id: "f-miss" },
    { html: '}' }
  ];

  var STEPS = {
    insertHead: [
      { line: "ih-sig", note: "Enter <strong>insert_head</strong>." },
      { line: "ih-alloc", note: "Allocate a new <code>Node</code> on the heap." },
      { line: "ih-val", note: "Store the value in the new node.", visual: "start" },
      { line: "ih-link", note: "Point <code>n-&gt;next</code> at the old head." },
      { line: "ih-head", note: "Move <strong>head</strong> to the new node.", visual: "commit" }
    ],
    insertTail: [
      { line: "it-sig", note: "Enter <strong>insert_tail</strong>." },
      { line: "it-alloc", note: "Allocate a new node." },
      { line: "it-init", note: "Set value; <code>next = NULL</code> (new end).", visual: "start" },
      { line: "it-empty", note: "If the list is empty, head becomes the new node." },
      { line: "it-walk", note: "Start a cursor at <strong>head</strong>." },
      { line: "it-scan", note: "Walk until <code>p-&gt;next</code> is NULL.", visual: "walk" },
      { line: "it-link", note: "Wire the old tail’s <code>next</code> to the new node.", visual: "commit" }
    ],
    deleteHead: [
      { line: "dh-sig", note: "Enter <strong>delete_head</strong>." },
      { line: "dh-check", note: "Guard: refuse if head is NULL." },
      { line: "dh-take", note: "Keep a pointer to the old head.", visual: "start" },
      { line: "dh-advance", note: "Advance <strong>head</strong> to <code>head-&gt;next</code>." },
      { line: "dh-free", note: "Read the value and free the old node.", visual: "commit" },
      { line: "dh-ret", note: "Return the deleted value." }
    ],
    traverse: [
      { line: "f-sig", note: "Enter <strong>find</strong> (demo walks every node)." },
      { line: "f-start", note: "Cursor <code>p</code> starts at head.", visual: "start" },
      { line: "f-loop", note: "While <code>p</code> is not NULL…" },
      { line: "f-match", note: "Compare <code>p-&gt;val</code> — demo highlights each visit.", visual: "walk" },
      { line: "f-next", note: "Advance: <code>p = p-&gt;next</code>." },
      { line: "f-miss", note: "End of chain — return NULL if no match.", visual: "commit" }
    ],
    reset: [
      { line: "head", note: "Reset demo: head → A → B → C → NULL." }
    ]
  };

  function initLinkedList() {
    var root = document.getElementById("ll-chain");
    var status = document.getElementById("ll-status");
    var sizeEl = document.getElementById("ll-size");
    var codeRoot = document.getElementById("ll-code");
    var codeNote = document.getElementById("ll-code-note");
    if (!root) return;

    var MAX = 8;
    var TONES = 6;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var nextCode = 68; /* 'D' */
    var items = [
      { label: "A", tone: 0 },
      { label: "B", tone: 1 },
      { label: "C", tone: 2 }
    ];
    var lineEls = {};
    var uid = 1;

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

    function makeNode(item, index, isLast) {
      var wrap = document.createElement("div");
      wrap.className = "ll-node-wrap";
      wrap.dataset.index = String(index);
      wrap.dataset.id = String(item.id);

      var node = document.createElement("div");
      node.className = "ll-node";
      node.dataset.tone = String(item.tone % TONES);

      var valBox = document.createElement("div");
      valBox.className = "ll-node-val";
      var valLabel = document.createElement("span");
      valLabel.className = "ll-node-val-label";
      valLabel.textContent = "val";
      var valText = document.createElement("span");
      valText.className = "ll-node-val-text";
      valText.textContent = item.label;
      valBox.appendChild(valLabel);
      valBox.appendChild(valText);

      var nextBox = document.createElement("div");
      nextBox.className = "ll-node-next";
      var nextLabel = document.createElement("span");
      nextLabel.className = "ll-node-next-label";
      nextLabel.textContent = "next";
      var nextDot = document.createElement("span");
      nextDot.className = "ll-node-next-dot";
      nextDot.setAttribute("aria-hidden", "true");
      nextBox.appendChild(nextLabel);
      nextBox.appendChild(nextDot);

      node.appendChild(valBox);
      node.appendChild(nextBox);
      wrap.appendChild(node);

      if (!isLast) {
        var arrow = document.createElement("div");
        arrow.className = "ll-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.innerHTML =
          '<span class="ll-arrow-shaft"></span><span class="ll-arrow-head"></span>';
        wrap.appendChild(arrow);
      } else {
        var nil = document.createElement("div");
        nil.className = "ll-nil";
        nil.setAttribute("aria-hidden", "true");
        nil.innerHTML =
          '<span class="ll-arrow-shaft ll-arrow-shaft-short"></span>' +
          '<span class="ll-nil-box">NULL</span>';
        wrap.appendChild(nil);
      }

      wrap.setAttribute(
        "aria-label",
        "Node " +
          item.label +
          (index === 0 ? ", head" : "") +
          (isLast ? ", next is NULL" : "")
      );
      return wrap;
    }

    function paint(opts) {
      opts = opts || {};
      root.innerHTML = "";
      if (!items.length) {
        var empty = document.createElement("div");
        empty.className = "ll-empty";
        empty.innerHTML =
          '<span class="ll-nil-box">NULL</span><span class="ll-empty-note">head is NULL</span>';
        root.appendChild(empty);
        return;
      }

      items.forEach(function (item, i) {
        if (!item.id) item.id = uid++;
        var wrap = makeNode(item, i, i === items.length - 1);
        if (opts.highlight === i) wrap.classList.add("is-active");
        if (opts.inserting === i) wrap.classList.add("is-inserting");
        if (opts.deleting === i) wrap.classList.add("is-deleting");
        if (opts.rewire === i) wrap.classList.add("is-rewire");
        root.appendChild(wrap);
      });
    }

    function clearNodeStates() {
      root.querySelectorAll(".ll-node-wrap").forEach(function (el) {
        el.classList.remove("is-active", "is-inserting", "is-deleting", "is-rewire", "is-visit");
      });
    }

    function visitIndex(i) {
      clearNodeStates();
      var wraps = root.querySelectorAll(".ll-node-wrap");
      if (wraps[i]) wraps[i].classList.add("is-visit");
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
            if (step.visual === "walk" && ctx && typeof ctx.onWalk === "function") {
              ctx.onWalk(pending);
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
            console.error("[learn-linked-lists] Step failed", {
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

    function insertHead() {
      if (busy) return;
      if (items.length >= MAX) {
        setStatus("Demo max " + MAX + " nodes — delete or reset.");
        return;
      }

      busy = true;
      var label = nextLetter();
      var node = { label: label, tone: uid % TONES, id: uid++ };

      runSteps("insertHead", {
        onStart: function () {
          setStatus("New node “" + label + "” — linking next → old head…");
          return node;
        },
        onCommit: function () {
          items.unshift(node);
          paint({ inserting: 0, rewire: 0 });
          setStatus("Inserted “" + label + "” at head. Size " + items.length + ".");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function insertTail() {
      if (busy) return;
      if (items.length >= MAX) {
        setStatus("Demo max " + MAX + " nodes — delete or reset.");
        return;
      }

      busy = true;
      var label = nextLetter();
      var node = { label: label, tone: uid % TONES, id: uid++ };
      var walkTimers = [];

      runSteps("insertTail", {
        onStart: function () {
          setStatus("New node “" + label + "” — walking to the tail…");
          return node;
        },
        onWalk: function () {
          if (reduceMotion || !items.length) return;
          var i = 0;
          function tick() {
            if (i >= items.length) return;
            visitIndex(i);
            i += 1;
            if (i < items.length) {
              var t = window.setTimeout(tick, 220);
              walkTimers.push(t);
              stepTimers.push(t);
            }
          }
          tick();
        },
        onCommit: function () {
          walkTimers.forEach(function (id) {
            window.clearTimeout(id);
          });
          items.push(node);
          paint({ inserting: items.length - 1, rewire: items.length - 2 });
          setStatus("Appended “" + label + "” at tail. Size " + items.length + ".");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function deleteHead() {
      if (busy) return;
      if (!items.length) {
        highlight("dh-check", true);
        setCodeNote("Empty — <strong>head</strong> is NULL, delete aborts.");
        setStatus("Underflow — nothing to delete.");
        paint();
        return;
      }

      busy = true;
      var removed = items[0];

      runSteps("deleteHead", {
        onStart: function () {
          paint({ deleting: 0 });
          setStatus("Deleting head “" + removed.label + "”…");
          return removed;
        },
        onCommit: function () {
          items.shift();
          paint({ rewire: 0 });
          setStatus(
            "Deleted “" + removed.label + "”. Head is now " +
              (items.length ? "“" + items[0].label + "”" : "NULL") +
              "."
          );
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function traverse() {
      if (busy) return;
      if (!items.length) {
        highlight("f-start", true);
        setCodeNote("Empty list — find returns NULL immediately.");
        setStatus("Empty — nothing to traverse.");
        paint();
        return;
      }

      busy = true;
      var walkTimers = [];
      var target = items[items.length - 1].label;

      runSteps("traverse", {
        onStart: function () {
          setStatus("Traverse / find — walking from head…");
          return target;
        },
        onWalk: function () {
          var i = 0;
          function tick() {
            if (i >= items.length) return;
            visitIndex(i);
            setStatus("Visiting node “" + items[i].label + "”…");
            i += 1;
            if (i < items.length) {
              var t = window.setTimeout(tick, reduceMotion ? 0 : 280);
              walkTimers.push(t);
              stepTimers.push(t);
            }
          }
          tick();
        },
        onCommit: function () {
          walkTimers.forEach(function (id) {
            window.clearTimeout(id);
          });
          clearNodeStates();
          paint({ highlight: items.length - 1 });
          setStatus(
            "Walked " +
              items.length +
              " node" +
              (items.length === 1 ? "" : "s") +
              " — O(n) to reach the end."
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
        { label: "A", tone: 0, id: uid++ },
        { label: "B", tone: 1, id: uid++ },
        { label: "C", tone: 2, id: uid++ }
      ];
      nextCode = 68;
      paint();
      setStatus("Reset. Three nodes linked — try Insert head.");
      runSteps("reset", {
        onDone: function () {
          busy = false;
          setCodeNote(
            "Press <strong>Insert head</strong>, <strong>Insert tail</strong>, <strong>Delete head</strong>, or <strong>Traverse</strong> — matching C steps light up."
          );
        }
      });
    }

    document.querySelectorAll("[data-ll-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-ll-action");
        if (action === "insert-head") insertHead();
        else if (action === "insert-tail") insertTail();
        else if (action === "delete-head") deleteHead();
        else if (action === "traverse") traverse();
        else if (action === "reset") reset();
      });
    });

    renderCode();
    paint();
    clearHighlight();
    setStatus("Three nodes linked. Insert at the head—watch next rewire.");
  }

  try {
    initLinkedList();
  } catch (err) {
    console.error("[learn-linked-lists] Init failed", err);
  }
})();
