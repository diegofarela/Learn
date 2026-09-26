/**
 * Interactive DP demo: naive fib call tree vs memo table fill.
 */
(function () {
  var N = 5;

  var NAIVE_CODE = [
    { html: '<span class="code-type">int</span> <span class="code-fn">fib</span>(<span class="code-type">int</span> n) {', id: "sig" },
    { html: '  <span class="code-kw">if</span> (n &lt;= <span class="code-num">1</span>) <span class="code-kw">return</span> n;', id: "base" },
    { html: '  <span class="code-kw">return</span> fib(n-<span class="code-num">1</span>) + fib(n-<span class="code-num">2</span>);', id: "recur" },
    { html: '}' }
  ];

  var MEMO_CODE = [
    { html: '<span class="code-type">int</span> memo[<span class="code-num">6</span>]; <span class="code-cm">/* -1 = empty */</span>', id: "table" },
    { html: '<span class="code-type">int</span> <span class="code-fn">fib</span>(<span class="code-type">int</span> n) {', id: "sig" },
    { html: '  <span class="code-kw">if</span> (n &lt;= <span class="code-num">1</span>) <span class="code-kw">return</span> n;', id: "base" },
    { html: '  <span class="code-kw">if</span> (memo[n] &gt;= <span class="code-num">0</span>) <span class="code-kw">return</span> memo[n];', id: "hit" },
    { html: '  memo[n] = fib(n-<span class="code-num">1</span>) + fib(n-<span class="code-num">2</span>);', id: "store" },
    { html: '  <span class="code-kw">return</span> memo[n];', id: "ret" },
    { html: '}' }
  ];

  /* Pre-order expansion of naive fib(5) call tree (enter events) */
  function buildNaiveSteps() {
    var steps = [];
    var callCount = 0;
    function walk(n, path) {
      callCount += 1;
      var id = path;
      steps.push({
        kind: "enter",
        n: n,
        id: id,
        line: "sig",
        calls: callCount,
        note: "Call <strong>fib(" + n + ")</strong> — new frame.",
        status: "fib(" + n + "). Total calls so far: " + callCount + "."
      });
      if (n <= 1) {
        steps.push({
          kind: "base",
          n: n,
          id: id,
          line: "base",
          calls: callCount,
          ret: n,
          note: "Base: return <strong>" + n + "</strong>.",
          status: "fib(" + n + ") → " + n + ". Calls: " + callCount + "."
        });
        return n;
      }
      steps.push({
        kind: "recur",
        n: n,
        id: id,
        line: "recur",
        calls: callCount,
        note: "Need fib(" + (n - 1) + ") + fib(" + (n - 2) + ").",
        status: "Expanding fib(" + n + "). Calls: " + callCount + "."
      });
      var a = walk(n - 1, path + "L");
      var b = walk(n - 2, path + "R");
      var sum = a + b;
      steps.push({
        kind: "return",
        n: n,
        id: id,
        line: "recur",
        calls: callCount,
        ret: sum,
        note: "fib(" + n + ") = " + a + " + " + b + " = <strong>" + sum + "</strong>.",
        status: "fib(" + n + ") → " + sum + ". Calls: " + callCount + "."
      });
      return sum;
    }
    walk(N, "0");
    steps.push({
      kind: "done",
      n: N,
      id: "0",
      line: "sig",
      calls: callCount,
      note: "Done — <strong>" + callCount + " calls</strong> for fib(" + N + "). Many repeats.",
      status: "Complete. " + callCount + " recursive calls (exponential shape)."
    });
    return steps;
  }

  function buildMemoSteps() {
    var fibVals = [0, 1, 1, 2, 3, 5];
    var steps = [
      {
        kind: "init",
        line: "table",
        calls: 0,
        focus: -1,
        note: "Empty memo[0…5]. Bottom-up: fill small → large.",
        status: "Memo mode. Step to fill the DP table."
      },
      {
        kind: "base",
        line: "base",
        calls: 1,
        focus: 0,
        set: { i: 0, v: 0 },
        note: "memo[<strong>0</strong>] = 0.",
        status: "Base: fib(0) = 0."
      },
      {
        kind: "base",
        line: "base",
        calls: 2,
        focus: 1,
        set: { i: 1, v: 1 },
        note: "memo[<strong>1</strong>] = 1.",
        status: "Base: fib(1) = 1."
      }
    ];
    var i;
    for (i = 2; i <= N; i++) {
      steps.push({
        kind: "store",
        line: "store",
        calls: i + 1,
        focus: i,
        set: { i: i, v: fibVals[i] },
        deps: [i - 1, i - 2],
        note:
          "memo[" +
          i +
          "] = memo[" +
          (i - 1) +
          "] + memo[" +
          (i - 2) +
          "] = <strong>" +
          fibVals[i] +
          "</strong>.",
        status: "Filled memo[" + i + "] = " + fibVals[i] + ". Cells used once."
      });
    }
    steps.push({
      kind: "done",
      line: "ret",
      calls: N + 1,
      focus: N,
      note: "fib(" + N + ") = <strong>" + fibVals[N] + "</strong> in ~" + (N + 1) + " steps.",
      status: "Complete. O(n) fills vs exponential naive calls."
    });
    return steps;
  }

  function initDP() {
    var treeRoot = document.getElementById("dp-tree");
    var tableRoot = document.getElementById("dp-table");
    var naivePanel = document.getElementById("dp-naive-panel");
    var memoPanel = document.getElementById("dp-memo-panel");
    var status = document.getElementById("dp-status");
    var callsEl = document.getElementById("dp-calls");
    var codeRoot = document.getElementById("dp-code");
    var codeNote = document.getElementById("dp-code-note");
    var codeLang = document.getElementById("dp-code-lang");
    if (!treeRoot || !tableRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mode = "naive";
    var naiveSteps = buildNaiveSteps();
    var memoSteps = buildMemoSteps();
    var steps = naiveSteps;
    var index = -1;
    var busy = false;
    var playing = false;
    var playTimer = null;
    var lineEls = {};
    var treeNodes = {};
    var memo = [-1, -1, -1, -1, -1, -1];
    var focusCell = -1;
    var depCells = [];

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function setCalls(n) {
      if (callsEl) callsEl.textContent = String(n);
    }

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      lines.forEach(function (line, i) {
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
    }

    function paintTree() {
      treeRoot.innerHTML = "";
      var ids = Object.keys(treeNodes);
      if (!ids.length) {
        var empty = document.createElement("p");
        empty.className = "dp-empty";
        empty.textContent = "Call tree empty — press Step.";
        treeRoot.appendChild(empty);
        return;
      }
      /* Layout by depth from path length */
      var byDepth = {};
      ids.forEach(function (id) {
        var d = id === "0" ? 0 : id.length;
        if (!byDepth[d]) byDepth[d] = [];
        byDepth[d].push(id);
      });
      Object.keys(byDepth)
        .sort(function (a, b) {
          return Number(a) - Number(b);
        })
        .forEach(function (d) {
          var row = document.createElement("div");
          row.className = "dp-tree-row";
          byDepth[d].forEach(function (id) {
            var node = treeNodes[id];
            var el = document.createElement("div");
            el.className =
              "dp-call" +
              (node.active ? " is-active" : "") +
              (node.done ? " is-done" : "") +
              (node.dup ? " is-dup" : "");
            el.innerHTML =
              '<span class="dp-call-fn">fib(' +
              node.n +
              ")</span>" +
              (node.ret != null
                ? '<span class="dp-call-ret">→ ' + node.ret + "</span>"
                : "");
            row.appendChild(el);
          });
          treeRoot.appendChild(row);
        });
    }

    function paintTable() {
      tableRoot.innerHTML = "";
      var header = document.createElement("div");
      header.className = "dp-table-row dp-table-head";
      header.innerHTML =
        '<span class="dp-cell dp-cell-label">i</span>' +
        [0, 1, 2, 3, 4, 5]
          .map(function (i) {
            return '<span class="dp-cell">' + i + "</span>";
          })
          .join("");
      tableRoot.appendChild(header);
      var vals = document.createElement("div");
      vals.className = "dp-table-row";
      vals.innerHTML =
        '<span class="dp-cell dp-cell-label">fib</span>' +
        memo
          .map(function (v, i) {
            var cls =
              "dp-cell" +
              (focusCell === i ? " is-focus" : "") +
              (depCells.indexOf(i) !== -1 ? " is-dep" : "") +
              (v >= 0 ? " is-filled" : "");
            return (
              '<span class="' +
              cls +
              '">' +
              (v >= 0 ? v : "·") +
              "</span>"
            );
          })
          .join("");
      tableRoot.appendChild(vals);
    }

    function seenN(n) {
      var count = 0;
      Object.keys(treeNodes).forEach(function (id) {
        if (treeNodes[id].n === n) count += 1;
      });
      return count;
    }

    function applyNaive(step) {
      if (step.kind === "enter") {
        var dup = seenN(step.n) > 0;
        Object.keys(treeNodes).forEach(function (id) {
          treeNodes[id].active = false;
        });
        treeNodes[step.id] = {
          n: step.n,
          active: true,
          done: false,
          dup: dup,
          ret: null
        };
      } else if (step.kind === "base" || step.kind === "return") {
        if (treeNodes[step.id]) {
          treeNodes[step.id].ret = step.ret;
          treeNodes[step.id].done = true;
          treeNodes[step.id].active = true;
        }
      } else if (step.kind === "done") {
        Object.keys(treeNodes).forEach(function (id) {
          treeNodes[id].active = id === "0";
          treeNodes[id].done = true;
        });
      }
      paintTree();
    }

    function applyMemo(step) {
      if (step.set) {
        memo[step.set.i] = step.set.v;
      }
      focusCell = typeof step.focus === "number" ? step.focus : -1;
      depCells = step.deps ? step.deps.slice() : [];
      paintTable();
    }

    function applyStep(step) {
      if (mode === "naive") applyNaive(step);
      else applyMemo(step);
      highlight(step.line);
      setCodeNote(step.note);
      setCalls(step.calls != null ? step.calls : 0);
      setStatus(step.status);
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearTimeout(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-dp-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= steps.length - 1) {
        stopPlay();
        setStatus("Finished. Reset or switch mode.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyStep(steps[index]);
      } catch (err) {
        console.error("[learn-dynamic-programming] Step failed", {
          index: index,
          mode: mode,
          err: err
        });
      }
      busy = false;
      return index < steps.length - 1;
    }

    function play() {
      if (playing) {
        stopPlay();
        return;
      }
      if (index >= steps.length - 1) softReset();
      playing = true;
      var playBtn = document.querySelector('[data-dp-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";

      function tick() {
        if (!playing) return;
        var more = stepOnce();
        if (!more) {
          stopPlay();
          return;
        }
        playTimer = window.setTimeout(tick, reduceMotion ? 60 : mode === "naive" ? 420 : 650);
      }
      tick();
    }

    function softReset() {
      stopPlay();
      index = -1;
      treeNodes = {};
      memo = [-1, -1, -1, -1, -1, -1];
      focusCell = -1;
      depCells = [];
      paintTree();
      paintTable();
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setCalls(0);
      if (mode === "naive") {
        setCodeNote(
          "Press <strong>Step</strong> or <strong>Play</strong> — watch fib(5) explode into repeated calls."
        );
        setStatus("Naive mode. Step to expand fib(5)—notice repeated subcalls.");
      } else {
        setCodeNote(
          "Press <strong>Step</strong> or <strong>Play</strong> — fill memo[0…5] once each."
        );
        setStatus("Memo mode. Step to fill the DP table.");
      }
    }

    function setMode(next) {
      mode = next;
      steps = mode === "naive" ? naiveSteps : memoSteps;
      document.querySelectorAll("[data-dp-mode]").forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-dp-mode") === mode);
      });
      if (naivePanel) naivePanel.hidden = mode !== "naive";
      if (memoPanel) memoPanel.hidden = mode !== "memo";
      if (codeLang) {
        codeLang.textContent = mode === "naive" ? "C · naive fib" : "C · memo fib";
      }
      renderCode(mode === "naive" ? NAIVE_CODE : MEMO_CODE);
      softReset();
    }

    document.querySelectorAll("[data-dp-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-dp-action");
        if (action === "step") {
          stopPlay();
          stepOnce();
        } else if (action === "play") play();
        else if (action === "reset") softReset();
      });
    });

    document.querySelectorAll("[data-dp-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setMode(btn.getAttribute("data-dp-mode"));
      });
    });

    setMode("naive");
  }

  try {
    initDP();
  } catch (err) {
    console.error("[learn-dynamic-programming] Init failed", err);
  }
})();
