/**
 * Interactive divide & conquer demo: merge-sort split/merge tree + C highlighter.
 */
(function () {
  var INPUT = [38, 27, 43, 3];

  var CODE_LINES = [
    { html: '<span class="code-type">void</span> <span class="code-fn">mergesort</span>(<span class="code-type">int</span> a[], <span class="code-type">int</span> lo, <span class="code-type">int</span> hi) {', id: "sig" },
    { html: '  <span class="code-kw">if</span> (lo &gt;= hi) <span class="code-kw">return</span>; <span class="code-cm">/* base */</span>', id: "base" },
    { html: '  <span class="code-type">int</span> mid = (lo + hi) / <span class="code-num">2</span>;', id: "mid" },
    { html: '  mergesort(a, lo, mid); <span class="code-cm">/* divide L */</span>', id: "left" },
    { html: '  mergesort(a, mid + <span class="code-num">1</span>, hi); <span class="code-cm">/* divide R */</span>', id: "right" },
    { html: '  merge(a, lo, mid, hi); <span class="code-cm">/* conquer */</span>', id: "merge" },
    { html: '}' }
  ];

  /* Precomputed merge-sort narrative for INPUT */
  var STEPS = [
    {
      kind: "start",
      line: "sig",
      phase: "divide",
      badge: "divide",
      focus: ["n0"],
      note: "Enter <strong>mergesort</strong> on the full array.",
      status: "Sort [38, 27, 43, 3]. First: divide."
    },
    {
      kind: "split",
      line: "mid",
      phase: "divide",
      badge: "divide",
      focus: ["n0"],
      reveal: ["n1", "n2"],
      note: "mid = (0+3)/2 → split into left &amp; right halves.",
      status: "Divide: [38, 27] | [43, 3]"
    },
    {
      kind: "split",
      line: "left",
      phase: "divide",
      badge: "divide",
      focus: ["n1"],
      reveal: ["n3", "n4"],
      note: "Recurse left: split [38, 27] into singles.",
      status: "Left half: [38] · [27]"
    },
    {
      kind: "base",
      line: "base",
      phase: "base",
      badge: "base",
      focus: ["n3", "n4"],
      markSorted: ["n3", "n4"],
      note: "Base case: one element is already sorted.",
      status: "Base: [38] and [27] need no work."
    },
    {
      kind: "merge",
      line: "merge",
      phase: "merge",
      badge: "merge",
      focus: ["n1"],
      setValues: { n1: [27, 38] },
      markSorted: ["n1"],
      note: "Merge [38] and [27] → <strong>[27, 38]</strong>.",
      status: "Merge left: [27, 38]"
    },
    {
      kind: "split",
      line: "right",
      phase: "divide",
      badge: "divide",
      focus: ["n2"],
      reveal: ["n5", "n6"],
      note: "Recurse right: split [43, 3].",
      status: "Right half: [43] · [3]"
    },
    {
      kind: "base",
      line: "base",
      phase: "base",
      badge: "base",
      focus: ["n5", "n6"],
      markSorted: ["n5", "n6"],
      note: "Singletons again — base case.",
      status: "Base: [43] and [3] are sorted."
    },
    {
      kind: "merge",
      line: "merge",
      phase: "merge",
      badge: "merge",
      focus: ["n2"],
      setValues: { n2: [3, 43] },
      markSorted: ["n2"],
      note: "Merge [43] and [3] → <strong>[3, 43]</strong>.",
      status: "Merge right: [3, 43]"
    },
    {
      kind: "merge",
      line: "merge",
      phase: "merge",
      badge: "merge",
      focus: ["n0"],
      setValues: { n0: [3, 27, 38, 43] },
      markSorted: ["n0"],
      note: "Final merge of sorted halves → <strong>[3, 27, 38, 43]</strong>.",
      status: "Done. Sorted: [3, 27, 38, 43]"
    },
    {
      kind: "done",
      line: "sig",
      phase: "done",
      badge: "done",
      focus: ["n0"],
      note: "Divide &amp; conquer complete — <code>O(n log n)</code> work.",
      status: "Complete. Reset to run again."
    }
  ];

  var NODES = {
    n0: { id: "n0", level: 0, values: INPUT.slice(), label: "root" },
    n1: { id: "n1", level: 1, values: [38, 27], label: "L" },
    n2: { id: "n2", level: 1, values: [43, 3], label: "R" },
    n3: { id: "n3", level: 2, values: [38], label: "LL" },
    n4: { id: "n4", level: 2, values: [27], label: "LR" },
    n5: { id: "n5", level: 2, values: [43], label: "RL" },
    n6: { id: "n6", level: 2, values: [3], label: "RR" }
  };

  function initDivideConquer() {
    var treeRoot = document.getElementById("dc-tree");
    var status = document.getElementById("dc-status");
    var phaseEl = document.getElementById("dc-phase");
    var badgeEl = document.getElementById("dc-badge");
    var codeRoot = document.getElementById("dc-code");
    var codeNote = document.getElementById("dc-code-note");
    if (!treeRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var index = -1;
    var visible = { n0: true };
    var values = {};
    var sorted = {};
    var focusIds = [];
    var busy = false;
    var playing = false;
    var playTimer = null;
    var lineEls = {};

    Object.keys(NODES).forEach(function (id) {
      values[id] = NODES[id].values.slice();
    });

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function setPhase(label) {
      if (phaseEl) phaseEl.textContent = label;
      if (badgeEl) {
        badgeEl.textContent = label;
        badgeEl.dataset.phase = label;
      }
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

    function paintTree() {
      treeRoot.innerHTML = "";
      var levels = [[], [], []];
      Object.keys(NODES).forEach(function (id) {
        if (!visible[id]) return;
        levels[NODES[id].level].push(id);
      });
      levels.forEach(function (ids, level) {
        if (!ids.length) return;
        var row = document.createElement("div");
        row.className = "dc-level";
        row.dataset.level = String(level);
        ids.forEach(function (id) {
          var node = document.createElement("div");
          var isFocus = focusIds.indexOf(id) !== -1;
          node.className =
            "dc-node" +
            (isFocus ? " is-focus" : "") +
            (sorted[id] ? " is-sorted" : "");
          node.dataset.id = id;
          var chips = values[id]
            .map(function (v) {
              return '<span class="dc-chip">' + v + "</span>";
            })
            .join("");
          node.innerHTML =
            '<div class="dc-node-vals">' +
            chips +
            "</div>" +
            '<span class="dc-node-tag">' +
            (sorted[id] ? "sorted" : level === 0 ? "input" : "sub") +
            "</span>";
          row.appendChild(node);
        });
        treeRoot.appendChild(row);
      });
    }

    function applyStep(step) {
      if (step.reveal) {
        step.reveal.forEach(function (id) {
          visible[id] = true;
        });
      }
      if (step.setValues) {
        Object.keys(step.setValues).forEach(function (id) {
          values[id] = step.setValues[id].slice();
        });
      }
      if (step.markSorted) {
        step.markSorted.forEach(function (id) {
          sorted[id] = true;
        });
      }
      focusIds = step.focus ? step.focus.slice() : [];
      paintTree();
      highlight(step.line);
      setCodeNote(step.note);
      setPhase(step.badge || step.phase || "…");
      setStatus(step.status);
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearTimeout(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-dc-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= STEPS.length - 1) {
        stopPlay();
        setStatus("Finished. Reset to divide & conquer again.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyStep(STEPS[index]);
      } catch (err) {
        console.error("[learn-divide-conquer] Step failed", { index: index, err: err });
      }
      busy = false;
      return index < STEPS.length - 1;
    }

    function play() {
      if (playing) {
        stopPlay();
        return;
      }
      if (index >= STEPS.length - 1) reset();
      playing = true;
      var playBtn = document.querySelector('[data-dc-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";

      function tick() {
        if (!playing) return;
        var more = stepOnce();
        if (!more) {
          stopPlay();
          return;
        }
        playTimer = window.setTimeout(tick, reduceMotion ? 80 : 750);
      }
      tick();
    }

    function reset() {
      stopPlay();
      index = -1;
      visible = { n0: true };
      sorted = {};
      focusIds = [];
      Object.keys(NODES).forEach(function (id) {
        values[id] = NODES[id].values.slice();
      });
      paintTree();
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setPhase("ready");
      setCodeNote(
        "Press <strong>Step</strong> or <strong>Play</strong> — divide, conquer, and merge light up on the tree."
      );
      setStatus("Ready. Step to divide the array into halves.");
    }

    document.querySelectorAll("[data-dc-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-dc-action");
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
    initDivideConquer();
  } catch (err) {
    console.error("[learn-divide-conquer] Init failed", err);
  }
})();
