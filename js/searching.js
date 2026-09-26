/**
 * Interactive searching demo: linear vs binary on a sorted array.
 */
(function () {
  var ARRAY = [3, 8, 12, 17, 23, 29, 34, 42, 51, 58, 67, 75];

  var BINARY_CODE = [
    { html: '<span class="code-type">int</span> <span class="code-fn">binary_search</span>(<span class="code-type">int</span> a[], <span class="code-type">int</span> n, <span class="code-type">int</span> t) {', id: "sig" },
    { html: '  <span class="code-type">int</span> lo = <span class="code-num">0</span>, hi = n - <span class="code-num">1</span>;', id: "bounds" },
    { blank: true },
    { html: '  <span class="code-kw">while</span> (lo &lt;= hi) {', id: "while" },
    { html: '    <span class="code-type">int</span> mid = lo + (hi - lo) / <span class="code-num">2</span>;', id: "mid" },
    { html: '    <span class="code-kw">if</span> (a[mid] == t) <span class="code-kw">return</span> mid;', id: "eq" },
    { html: '    <span class="code-kw">if</span> (a[mid] &lt; t) lo = mid + <span class="code-num">1</span>;', id: "go-right" },
    { html: '    <span class="code-kw">else</span> hi = mid - <span class="code-num">1</span>;', id: "go-left" },
    { html: '  }' },
    { html: '  <span class="code-kw">return</span> -<span class="code-num">1</span>;', id: "miss" },
    { html: '}' }
  ];

  var LINEAR_CODE = [
    { html: '<span class="code-type">int</span> <span class="code-fn">linear_search</span>(<span class="code-type">int</span> a[], <span class="code-type">int</span> n, <span class="code-type">int</span> t) {', id: "sig" },
    { html: '  <span class="code-type">int</span> i;', id: "decl" },
    { blank: true },
    { html: '  <span class="code-kw">for</span> (i = <span class="code-num">0</span>; i &lt; n; i++) {', id: "for" },
    { html: '    <span class="code-kw">if</span> (a[i] == t) <span class="code-kw">return</span> i;', id: "eq" },
    { html: '  }' },
    { html: '  <span class="code-kw">return</span> -<span class="code-num">1</span>;', id: "miss" },
    { html: '}' }
  ];

  function buildBinary(target) {
    var steps = [];
    var lo = 0;
    var hi = ARRAY.length - 1;
    var comps = 0;

    steps.push({
      line: "bounds",
      phase: "setup",
      comps: 0,
      lo: lo,
      hi: hi,
      mid: null,
      probe: null,
      eliminated: [],
      note: "Set <strong>lo = 0</strong>, <strong>hi = " + hi + "</strong>.",
      status: "Bounds ready for target " + target + "."
    });

    while (lo <= hi) {
      var mid = lo + Math.floor((hi - lo) / 2);
      steps.push({
        line: "while",
        phase: "loop",
        comps: comps,
        lo: lo,
        hi: hi,
        mid: mid,
        probe: null,
        eliminated: eliminatedSoFar(lo, hi),
        note: "Range still live: lo=" + lo + ", hi=" + hi + ".",
        status: "Active range [" + lo + " … " + hi + "]."
      });

      steps.push({
        line: "mid",
        phase: "probe",
        comps: comps,
        lo: lo,
        hi: hi,
        mid: mid,
        probe: mid,
        eliminated: eliminatedSoFar(lo, hi),
        note: "Probe mid = <strong>" + mid + "</strong> → value " + ARRAY[mid] + ".",
        status: "Probe index " + mid + " (" + ARRAY[mid] + ")."
      });

      comps += 1;
      if (ARRAY[mid] === target) {
        steps.push({
          line: "eq",
          phase: "found",
          comps: comps,
          lo: lo,
          hi: hi,
          mid: mid,
          probe: mid,
          found: mid,
          eliminated: eliminatedSoFar(lo, hi),
          note: "<strong>a[mid] == target</strong> — found at index " + mid + ".",
          status: "Found " + target + " at index " + mid + " after " + comps + " comparisons."
        });
        return steps;
      }

      if (ARRAY[mid] < target) {
        steps.push({
          line: "go-right",
          phase: "shrink",
          comps: comps,
          lo: lo,
          hi: hi,
          mid: mid,
          probe: mid,
          eliminated: eliminatedSoFar(mid + 1, hi).concat(rangeIds(lo, mid)),
          note: ARRAY[mid] + " &lt; " + target + " — discard left; lo = mid + 1.",
          status: "Go right. Discard indices " + lo + "…" + mid + "."
        });
        lo = mid + 1;
      } else {
        steps.push({
          line: "go-left",
          phase: "shrink",
          comps: comps,
          lo: lo,
          hi: hi,
          mid: mid,
          probe: mid,
          eliminated: eliminatedSoFar(lo, mid - 1).concat(rangeIds(mid, hi)),
          note: ARRAY[mid] + " &gt; " + target + " — discard right; hi = mid − 1.",
          status: "Go left. Discard indices " + mid + "…" + hi + "."
        });
        hi = mid - 1;
      }
    }

    steps.push({
      line: "miss",
      phase: "miss",
      comps: comps,
      lo: lo,
      hi: hi,
      mid: null,
      probe: null,
      eliminated: rangeIds(0, ARRAY.length - 1),
      note: "Range empty — <strong>" + target + "</strong> is not in the array.",
      status: "Miss. " + comps + " comparisons; target absent."
    });
    return steps;
  }

  function rangeIds(from, to) {
    var out = [];
    var i;
    for (i = from; i <= to; i++) out.push(i);
    return out;
  }

  function eliminatedSoFar(lo, hi) {
    var out = [];
    var i;
    for (i = 0; i < ARRAY.length; i++) {
      if (i < lo || i > hi) out.push(i);
    }
    return out;
  }

  function buildLinear(target) {
    var steps = [];
    var comps = 0;
    var i;

    steps.push({
      line: "decl",
      phase: "setup",
      comps: 0,
      lo: 0,
      hi: ARRAY.length - 1,
      mid: null,
      probe: null,
      eliminated: [],
      note: "Scan left → right until a match or the end.",
      status: "Linear scan for " + target + "."
    });

    for (i = 0; i < ARRAY.length; i++) {
      steps.push({
        line: "for",
        phase: "probe",
        comps: comps,
        lo: 0,
        hi: ARRAY.length - 1,
        mid: null,
        probe: i,
        eliminated: rangeIds(0, i - 1),
        note: "Check index <strong>" + i + "</strong>.",
        status: "At index " + i + " (" + ARRAY[i] + ")."
      });

      comps += 1;
      if (ARRAY[i] === target) {
        steps.push({
          line: "eq",
          phase: "found",
          comps: comps,
          lo: 0,
          hi: ARRAY.length - 1,
          mid: null,
          probe: i,
          found: i,
          eliminated: rangeIds(0, i - 1),
          note: "<strong>a[i] == target</strong> — found at index " + i + ".",
          status: "Found " + target + " at index " + i + " after " + comps + " comparisons."
        });
        return steps;
      }
    }

    steps.push({
      line: "miss",
      phase: "miss",
      comps: comps,
      lo: 0,
      hi: ARRAY.length - 1,
      mid: null,
      probe: null,
      eliminated: rangeIds(0, ARRAY.length - 1),
      note: "Loop finished — <strong>" + target + "</strong> not present.",
      status: "Miss. " + comps + " comparisons; target absent."
    });
    return steps;
  }

  function initSearch() {
    var strip = document.getElementById("search-strip");
    var status = document.getElementById("search-status");
    var compsEl = document.getElementById("search-comps");
    var phaseEl = document.getElementById("search-phase");
    var codeRoot = document.getElementById("search-code");
    var codeNote = document.getElementById("search-code-note");
    var codeLang = document.getElementById("search-code-lang");
    var algoSelect = document.getElementById("search-algo");
    var targetInput = document.getElementById("search-target");
    if (!strip) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var cellEls = [];
    var lineEls = {};
    var steps = [];
    var index = -1;
    var busy = false;
    var playing = false;
    var playTimer = null;

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
      return algoSelect && algoSelect.value === "linear" ? "linear" : "binary";
    }

    function currentTarget() {
      var n = targetInput ? parseInt(targetInput.value, 10) : 42;
      if (isNaN(n)) {
        console.error("[learn-search] Invalid target", { value: targetInput && targetInput.value });
        return 42;
      }
      return n;
    }

    function codeLines() {
      return currentAlgo() === "linear" ? LINEAR_CODE : BINARY_CODE;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      if (codeLang) {
        codeLang.textContent =
          currentAlgo() === "linear" ? "C · linear search" : "C · binary search";
      }
      codeLines().forEach(function (line, i) {
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

    function paintStrip() {
      strip.innerHTML = "";
      cellEls = [];
      ARRAY.forEach(function (val, i) {
        var cell = document.createElement("div");
        cell.className = "search-cell";
        cell.dataset.index = String(i);
        var face = document.createElement("div");
        face.className = "search-cell-face";
        face.textContent = String(val);
        var idx = document.createElement("span");
        idx.className = "search-cell-idx";
        idx.textContent = String(i);
        cell.appendChild(face);
        cell.appendChild(idx);
        strip.appendChild(cell);
        cellEls.push(cell);
      });
    }

    function applyState(step) {
      var eliminated = step.eliminated || [];
      cellEls.forEach(function (cell, i) {
        var isElim = eliminated.indexOf(i) !== -1;
        var isProbe = step.probe === i;
        var isFound = step.found === i;
        var inRange =
          step.lo != null && step.hi != null && i >= step.lo && i <= step.hi;
        cell.classList.toggle("is-elim", isElim);
        cell.classList.toggle("is-range", inRange && !isElim && !isProbe && !isFound);
        cell.classList.toggle("is-probe", isProbe && !isFound);
        cell.classList.toggle("is-found", Boolean(isFound));
        if (isProbe && !reduceMotion) {
          cell.classList.remove("is-pulse");
          void cell.offsetWidth;
          cell.classList.add("is-pulse");
        }
      });
      if (compsEl) compsEl.textContent = String(step.comps || 0);
      highlight(step.line);
      setCodeNote(step.note);
      setPhase(step.phase);
      setStatus(step.status);
    }

    function rebuildSteps() {
      try {
        steps =
          currentAlgo() === "linear"
            ? buildLinear(currentTarget())
            : buildBinary(currentTarget());
      } catch (err) {
        console.error("[learn-search] Build steps failed", {
          algo: currentAlgo(),
          target: currentTarget(),
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
      var playBtn = document.querySelector('[data-search-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= steps.length - 1) {
        stopPlay();
        setStatus("Finished. Reset or change target to search again.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyState(steps[index]);
      } catch (err) {
        console.error("[learn-search] Step failed", { index: index, err: err });
      }
      busy = false;
      return index < steps.length - 1;
    }

    function play() {
      if (playing) {
        stopPlay();
        return;
      }
      if (index >= steps.length - 1) reset(false);
      playing = true;
      var playBtn = document.querySelector('[data-search-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";

      function tick() {
        if (!playing) return;
        var more = stepOnce();
        if (!more) {
          stopPlay();
          return;
        }
        playTimer = window.setTimeout(tick, reduceMotion ? 80 : 700);
      }
      tick();
    }

    function reset(rebuild) {
      stopPlay();
      index = -1;
      if (rebuild !== false) {
        rebuildSteps();
        renderCode();
      }
      cellEls.forEach(function (cell) {
        cell.className = "search-cell";
      });
      if (compsEl) compsEl.textContent = "0";
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setPhase("ready");
      setCodeNote(
        "Press <strong>Step</strong> or <strong>Play</strong> — each probe lights the matching comparison."
      );
      setStatus(
        "Ready. Target " +
          currentTarget() +
          " · " +
          (currentAlgo() === "linear" ? "linear" : "binary") +
          " search."
      );
    }

    document.querySelectorAll("[data-search-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-search-action");
        if (action === "step") {
          stopPlay();
          stepOnce();
        } else if (action === "play") play();
        else if (action === "reset") reset(true);
      });
    });

    if (algoSelect) {
      algoSelect.addEventListener("change", function () {
        reset(true);
      });
    }
    if (targetInput) {
      targetInput.addEventListener("change", function () {
        reset(true);
      });
    }

    paintStrip();
    rebuildSteps();
    renderCode();
    reset(false);
  }

  try {
    initSearch();
  } catch (err) {
    console.error("[learn-search] Init failed", err);
  }
})();
