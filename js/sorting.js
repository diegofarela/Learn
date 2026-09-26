/**
 * Interactive sorting demo: bubble, insertion, and merge sort.
 */
(function () {
  var DEFAULT = [7, 3, 9, 1, 5, 8, 2, 6];

  var CODE = {
    bubble: [
      { html: '<span class="code-kw">for</span> pass = 0 .. n-2', id: "pass" },
      { html: '  <span class="code-kw">for</span> i = 0 .. n-pass-2', id: "inner" },
      { html: '    <span class="code-kw">if</span> a[i] &gt; a[i+1]', id: "cmp" },
      { html: '      swap(a[i], a[i+1])', id: "swap" },
      { html: '  <span class="code-cm">// largest of pass sinks right</span>', id: "sink" }
    ],
    insertion: [
      { html: '<span class="code-kw">for</span> i = 1 .. n-1', id: "outer" },
      { html: '  key = a[i]', id: "key" },
      { html: '  j = i - 1', id: "j" },
      { html: '  <span class="code-kw">while</span> j ≥ 0 <span class="code-kw">and</span> a[j] &gt; key', id: "while" },
      { html: '    a[j+1] = a[j]; j--', id: "shift" },
      { html: '  a[j+1] = key', id: "insert" }
    ],
    merge: [
      { html: '<span class="code-fn">mergesort</span>(a, lo, hi)', id: "sig" },
      { html: '  <span class="code-kw">if</span> lo ≥ hi <span class="code-kw">return</span>', id: "base" },
      { html: '  mid = (lo + hi) / 2', id: "mid" },
      { html: '  mergesort(a, lo, mid)', id: "left" },
      { html: '  mergesort(a, mid+1, hi)', id: "right" },
      { html: '  merge(a, lo, mid, hi)', id: "merge" }
    ]
  };

  function clone(arr) {
    return arr.slice();
  }

  function buildBubble(values) {
    var a = clone(values);
    var steps = [];
    var swaps = 0;
    var n = a.length;
    var pass;
    var i;

    for (pass = 0; pass < n - 1; pass++) {
      steps.push({
        line: "pass",
        phase: "pass",
        arr: clone(a),
        swaps: swaps,
        highlight: [],
        sortedFrom: n - pass,
        note: "Pass <strong>" + (pass + 1) + "</strong> — bubble largest to the right.",
        status: "Bubble pass " + (pass + 1) + "."
      });

      for (i = 0; i < n - pass - 1; i++) {
        steps.push({
          line: "inner",
          phase: "scan",
          arr: clone(a),
          swaps: swaps,
          highlight: [i, i + 1],
          sortedFrom: n - pass,
          note: "Compare indices <strong>" + i + "</strong> and <strong>" + (i + 1) + "</strong>.",
          status: "Compare " + a[i] + " and " + a[i + 1] + "."
        });

        steps.push({
          line: "cmp",
          phase: "compare",
          arr: clone(a),
          swaps: swaps,
          highlight: [i, i + 1],
          sortedFrom: n - pass,
          note:
            a[i] > a[i + 1]
              ? a[i] + " &gt; " + a[i + 1] + " — out of order."
              : a[i] + " ≤ " + a[i + 1] + " — already ordered.",
          status: "Compare result."
        });

        if (a[i] > a[i + 1]) {
          var tmp = a[i];
          a[i] = a[i + 1];
          a[i + 1] = tmp;
          swaps += 1;
          steps.push({
            line: "swap",
            phase: "swap",
            arr: clone(a),
            swaps: swaps,
            highlight: [i, i + 1],
            pulse: [i, i + 1],
            sortedFrom: n - pass,
            note: "Swap — larger value moves right.",
            status: "Swapped. Array: [" + a.join(", ") + "]."
          });
        }
      }

      steps.push({
        line: "sink",
        phase: "sink",
        arr: clone(a),
        swaps: swaps,
        highlight: [n - pass - 1],
        sortedFrom: n - pass - 1,
        note: "Index <strong>" + (n - pass - 1) + "</strong> is now in final place.",
        status: "End of pass " + (pass + 1) + "."
      });
    }

    steps.push({
      line: "pass",
      phase: "done",
      arr: clone(a),
      swaps: swaps,
      highlight: [],
      sortedFrom: 0,
      note: "Sorted ascending.",
      status: "Done after " + swaps + " swaps."
    });
    return steps;
  }

  function buildInsertion(values) {
    var a = clone(values);
    var steps = [];
    var swaps = 0;
    var i;
    var j;

    for (i = 1; i < a.length; i++) {
      var key = a[i];
      steps.push({
        line: "outer",
        phase: "pick",
        arr: clone(a),
        swaps: swaps,
        highlight: [i],
        sortedFrom: null,
        sortedTo: i,
        note: "Grow sorted prefix through index <strong>" + i + "</strong>.",
        status: "Insert a[" + i + "] = " + key + "."
      });

      steps.push({
        line: "key",
        phase: "key",
        arr: clone(a),
        swaps: swaps,
        highlight: [i],
        sortedTo: i,
        note: "key = <strong>" + key + "</strong>.",
        status: "Hold key " + key + "."
      });

      j = i - 1;
      steps.push({
        line: "j",
        phase: "scan",
        arr: clone(a),
        swaps: swaps,
        highlight: [j, i],
        sortedTo: i,
        note: "Start sliding from j = <strong>" + j + "</strong>.",
        status: "j = " + j + "."
      });

      while (j >= 0 && a[j] > key) {
        steps.push({
          line: "while",
          phase: "compare",
          arr: clone(a),
          swaps: swaps,
          highlight: [j, j + 1],
          sortedTo: i,
          note: a[j] + " &gt; key " + key + " — shift right.",
          status: "Shift " + a[j] + " right."
        });

        a[j + 1] = a[j];
        swaps += 1;
        steps.push({
          line: "shift",
          phase: "shift",
          arr: clone(a),
          swaps: swaps,
          highlight: [j, j + 1],
          pulse: [j + 1],
          sortedTo: i,
          note: "a[j+1] = a[j]; j--.",
          status: "Shifted. Hole at " + j + "."
        });
        j -= 1;
      }

      a[j + 1] = key;
      steps.push({
        line: "insert",
        phase: "insert",
        arr: clone(a),
        swaps: swaps,
        highlight: [j + 1],
        pulse: [j + 1],
        sortedTo: i + 1,
        note: "Place key at index <strong>" + (j + 1) + "</strong>.",
        status: "Inserted. Array: [" + a.join(", ") + "]."
      });
    }

    steps.push({
      line: "outer",
      phase: "done",
      arr: clone(a),
      swaps: swaps,
      highlight: [],
      sortedFrom: 0,
      note: "Sorted ascending.",
      status: "Done after " + swaps + " shifts."
    });
    return steps;
  }

  function buildMerge(values) {
    var a = clone(values);
    var steps = [];
    var swaps = 0;

    function merge(lo, mid, hi) {
      var left = a.slice(lo, mid + 1);
      var right = a.slice(mid + 1, hi + 1);
      var i = 0;
      var j = 0;
      var k = lo;

      steps.push({
        line: "merge",
        phase: "merge",
        arr: clone(a),
        swaps: swaps,
        highlight: range(lo, hi),
        range: [lo, hi],
        note:
          "Merge runs [" +
          lo +
          "…" +
          mid +
          "] and [" +
          (mid + 1) +
          "…" +
          hi +
          "].",
        status: "Merging " + (hi - lo + 1) + " elements."
      });

      while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
          a[k] = left[i];
          i += 1;
        } else {
          a[k] = right[j];
          j += 1;
        }
        swaps += 1;
        steps.push({
          line: "merge",
          phase: "write",
          arr: clone(a),
          swaps: swaps,
          highlight: [k],
          pulse: [k],
          range: [lo, hi],
          note: "Write <strong>" + a[k] + "</strong> into a[" + k + "].",
          status: "Merged into index " + k + "."
        });
        k += 1;
      }

      while (i < left.length) {
        a[k] = left[i];
        i += 1;
        swaps += 1;
        steps.push({
          line: "merge",
          phase: "write",
          arr: clone(a),
          swaps: swaps,
          highlight: [k],
          pulse: [k],
          range: [lo, hi],
          note: "Drain left: a[" + k + "] = " + a[k] + ".",
          status: "Drain left into " + k + "."
        });
        k += 1;
      }

      while (j < right.length) {
        a[k] = right[j];
        j += 1;
        swaps += 1;
        steps.push({
          line: "merge",
          phase: "write",
          arr: clone(a),
          swaps: swaps,
          highlight: [k],
          pulse: [k],
          range: [lo, hi],
          note: "Drain right: a[" + k + "] = " + a[k] + ".",
          status: "Drain right into " + k + "."
        });
        k += 1;
      }
    }

    function sort(lo, hi) {
      steps.push({
        line: "sig",
        phase: "call",
        arr: clone(a),
        swaps: swaps,
        highlight: range(lo, hi),
        range: [lo, hi],
        note: "mergesort(lo=" + lo + ", hi=" + hi + ").",
        status: "Sort range [" + lo + " … " + hi + "]."
      });

      if (lo >= hi) {
        steps.push({
          line: "base",
          phase: "base",
          arr: clone(a),
          swaps: swaps,
          highlight: lo >= 0 && lo < a.length ? [lo] : [],
          range: [lo, hi],
          note: "Base case — single element (or empty).",
          status: "Base case at [" + lo + " … " + hi + "]."
        });
        return;
      }

      var mid = Math.floor((lo + hi) / 2);
      steps.push({
        line: "mid",
        phase: "split",
        arr: clone(a),
        swaps: swaps,
        highlight: range(lo, hi),
        range: [lo, hi],
        note: "mid = <strong>" + mid + "</strong>.",
        status: "Split at " + mid + "."
      });

      steps.push({
        line: "left",
        phase: "recurse",
        arr: clone(a),
        swaps: swaps,
        highlight: range(lo, mid),
        range: [lo, mid],
        note: "Recurse left half.",
        status: "Left [" + lo + " … " + mid + "]."
      });
      sort(lo, mid);

      steps.push({
        line: "right",
        phase: "recurse",
        arr: clone(a),
        swaps: swaps,
        highlight: range(mid + 1, hi),
        range: [mid + 1, hi],
        note: "Recurse right half.",
        status: "Right [" + (mid + 1) + " … " + hi + "]."
      });
      sort(mid + 1, hi);

      merge(lo, mid, hi);
    }

    sort(0, a.length - 1);
    steps.push({
      line: "sig",
      phase: "done",
      arr: clone(a),
      swaps: swaps,
      highlight: [],
      sortedFrom: 0,
      note: "Merge sort complete — O(n log n) compares/writes.",
      status: "Done. Array: [" + a.join(", ") + "]."
    });
    return steps;
  }

  function range(lo, hi) {
    var out = [];
    var i;
    for (i = lo; i <= hi; i++) out.push(i);
    return out;
  }

  function shuffleInPlace(arr) {
    var i;
    for (i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  function initSort() {
    var barsRoot = document.getElementById("sort-bars");
    var status = document.getElementById("sort-status");
    var swapsEl = document.getElementById("sort-swaps");
    var phaseEl = document.getElementById("sort-phase");
    var codeRoot = document.getElementById("sort-code");
    var codeNote = document.getElementById("sort-code-note");
    var codeLang = document.getElementById("sort-code-lang");
    var algoSelect = document.getElementById("sort-algo");
    if (!barsRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var values = clone(DEFAULT);
    var barEls = [];
    var lineEls = {};
    var steps = [];
    var index = -1;
    var busy = false;
    var playing = false;
    var playTimer = null;
    var maxVal = Math.max.apply(null, DEFAULT);

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function setPhase(label) {
      if (!phaseEl) return;
      phaseEl.textContent = label;
      phaseEl.dataset.phase = label;
    }

    function currentAlgo() {
      var v = algoSelect ? algoSelect.value : "bubble";
      if (v === "insertion" || v === "merge") return v;
      return "bubble";
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      var algo = currentAlgo();
      if (codeLang) {
        codeLang.textContent = "pseudocode · " + algo;
      }
      (CODE[algo] || CODE.bubble).forEach(function (line, i) {
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

    function paintBars(arr) {
      barsRoot.innerHTML = "";
      barEls = [];
      var localMax = Math.max.apply(null, arr.concat([maxVal]));
      arr.forEach(function (val, i) {
        var wrap = document.createElement("div");
        wrap.className = "sort-bar-wrap";
        var bar = document.createElement("div");
        bar.className = "sort-bar";
        bar.style.height = Math.max(12, Math.round((val / localMax) * 100)) + "%";
        bar.dataset.tone = String(i % 6);
        var label = document.createElement("span");
        label.className = "sort-bar-val";
        label.textContent = String(val);
        wrap.appendChild(bar);
        wrap.appendChild(label);
        barsRoot.appendChild(wrap);
        barEls.push(wrap);
      });
    }

    function applyState(step) {
      var arr = step.arr || values;
      paintBars(arr);
      var hi = step.highlight || [];
      var pulse = step.pulse || [];
      barEls.forEach(function (wrap, i) {
        var bar = wrap.firstChild;
        var isHi = hi.indexOf(i) !== -1;
        var isSorted =
          (step.sortedFrom != null && i >= step.sortedFrom) ||
          (step.sortedTo != null && i < step.sortedTo) ||
          step.phase === "done";
        var inRange =
          step.range && i >= step.range[0] && i <= step.range[1];
        wrap.classList.toggle("is-active", isHi);
        wrap.classList.toggle("is-sorted", Boolean(isSorted) && !isHi);
        wrap.classList.toggle("is-range", Boolean(inRange) && !isHi && !isSorted);
        if (pulse.indexOf(i) !== -1 && !reduceMotion && bar) {
          bar.classList.remove("is-pulse");
          void bar.offsetWidth;
          bar.classList.add("is-pulse");
        }
      });
      if (swapsEl) swapsEl.textContent = String(step.swaps || 0);
      highlight(step.line);
      setCodeNote(step.note);
      setPhase(step.phase);
      setStatus(step.status);
    }

    function rebuildSteps() {
      try {
        var algo = currentAlgo();
        if (algo === "insertion") steps = buildInsertion(values);
        else if (algo === "merge") steps = buildMerge(values);
        else steps = buildBubble(values);
      } catch (err) {
        console.error("[learn-sort] Build steps failed", {
          algo: currentAlgo(),
          values: values,
          err: err
        });
        steps = [];
      }
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearTimeout(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-sort-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= steps.length - 1) {
        stopPlay();
        setStatus("Finished. Shuffle or Reset to run again.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyState(steps[index]);
      } catch (err) {
        console.error("[learn-sort] Step failed", { index: index, err: err });
      }
      busy = false;
      return index < steps.length - 1;
    }

    function play() {
      if (playing) {
        stopPlay();
        return;
      }
      if (index >= steps.length - 1) reset();
      playing = true;
      var playBtn = document.querySelector('[data-sort-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";

      function tick() {
        if (!playing) return;
        var more = stepOnce();
        if (!more) {
          stopPlay();
          return;
        }
        playTimer = window.setTimeout(tick, reduceMotion ? 60 : 480);
      }
      tick();
    }

    function reset() {
      stopPlay();
      index = -1;
      rebuildSteps();
      renderCode();
      paintBars(values);
      if (swapsEl) swapsEl.textContent = "0";
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setPhase("ready");
      setCodeNote(
        "Press <strong>Step</strong> or <strong>Play</strong> — the active line tracks the current compare or swap."
      );
      setStatus(
        "Ready. " + currentAlgo() + " · [" + values.join(", ") + "]."
      );
    }

    function shuffle() {
      stopPlay();
      shuffleInPlace(values);
      reset();
      setStatus("Shuffled: [" + values.join(", ") + "].");
    }

    document.querySelectorAll("[data-sort-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-sort-action");
        if (action === "step") {
          stopPlay();
          stepOnce();
        } else if (action === "play") play();
        else if (action === "shuffle") shuffle();
        else if (action === "reset") {
          values = clone(DEFAULT);
          reset();
        }
      });
    });

    if (algoSelect) {
      algoSelect.addEventListener("change", function () {
        reset();
      });
    }

    paintBars(values);
    rebuildSteps();
    renderCode();
    reset();
  }

  try {
    initSort();
  } catch (err) {
    console.error("[learn-sort] Init failed", err);
  }
})();
