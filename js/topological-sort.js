/**
 * Topological sort via Kahn's algorithm on a small DAG.
 */
(function () {
  var NODES = [
    { id: "A", x: 12, y: 28 },
    { id: "B", x: 12, y: 72 },
    { id: "C", x: 40, y: 28 },
    { id: "D", x: 40, y: 72 },
    { id: "E", x: 68, y: 50 },
    { id: "F", x: 92, y: 50 }
  ];

  var EDGES = [
    ["A", "C"],
    ["B", "C"],
    ["B", "D"],
    ["C", "E"],
    ["D", "E"],
    ["E", "F"]
  ];

  var CODE_LINES = [
    { html: '<span class="code-kw">for</span> v <span class="code-kw">in</span> V:', id: "init" },
    { html: '  <span class="code-kw">if</span> indegree[v]==0: q.push(v)', id: "seed" },
    { html: '<span class="code-kw">while</span> q:', id: "while" },
    { html: '  v = q.pop()', id: "pop" },
    { html: '  order.append(v)', id: "emit" },
    { html: '  <span class="code-kw">for</span> w <span class="code-kw">in</span> adj[v]:', id: "for" },
    { html: '    indegree[w] -= 1', id: "dec" },
    { html: '    <span class="code-kw">if</span> indegree[w]==0: q.push(w)', id: "ready" }
  ];

  function buildSteps() {
    var indeg = {};
    var adj = {};
    NODES.forEach(function (n) {
      indeg[n.id] = 0;
      adj[n.id] = [];
    });
    EDGES.forEach(function (e) {
      adj[e[0]].push(e[1]);
      indeg[e[1]] += 1;
    });

    var steps = [];
    var ready = NODES.map(function (n) {
      return n.id;
    }).filter(function (id) {
      return indeg[id] === 0;
    });
    ready.sort();
    var order = [];
    var removed = {};

    steps.push({
      line: "seed",
      phase: "ready",
      note: "Seed queue with indegree-0 nodes.",
      status: "Ready: [" + ready.join(", ") + "].",
      ready: ready.slice(),
      order: [],
      indeg: Object.assign({}, indeg),
      removed: {},
      current: null,
      activeEdge: null
    });

    while (ready.length) {
      var v = ready.shift();
      steps.push({
        line: "pop",
        phase: "pick",
        note: "Pop <strong>" + v + "</strong> from the ready queue.",
        status: "Pick " + v + ".",
        ready: ready.slice(),
        order: order.slice(),
        indeg: Object.assign({}, indeg),
        removed: Object.assign({}, removed),
        current: v,
        activeEdge: null
      });

      order.push(v);
      removed[v] = true;
      steps.push({
        line: "emit",
        phase: "emit",
        note: "Append <strong>" + v + "</strong> to the topological order.",
        status: "Order: [" + order.join(" → ") + "].",
        ready: ready.slice(),
        order: order.slice(),
        indeg: Object.assign({}, indeg),
        removed: Object.assign({}, removed),
        current: v,
        activeEdge: null
      });

      adj[v].forEach(function (w) {
        indeg[w] -= 1;
        steps.push({
          line: "dec",
          phase: "relax",
          note: "Edge " + v + "→" + w + ": indegree[" + w + "] = " + indeg[w] + ".",
          status: "Decrement indegree of " + w + " → " + indeg[w] + ".",
          ready: ready.slice(),
          order: order.slice(),
          indeg: Object.assign({}, indeg),
          removed: Object.assign({}, removed),
          current: v,
          activeEdge: [v, w]
        });
        if (indeg[w] === 0) {
          ready.push(w);
          ready.sort();
          steps.push({
            line: "ready",
            phase: "ready",
            note: "<strong>" + w + "</strong> is now ready (indegree 0).",
            status: "Enqueue " + w + ".",
            ready: ready.slice(),
            order: order.slice(),
            indeg: Object.assign({}, indeg),
            removed: Object.assign({}, removed),
            current: v,
            activeEdge: [v, w]
          });
        }
      });
    }

    steps.push({
      line: "emit",
      phase: "done",
      note: "All nodes emitted — a valid topological order.",
      status: "Done: [" + order.join(" → ") + "].",
      ready: [],
      order: order.slice(),
      indeg: Object.assign({}, indeg),
      removed: Object.assign({}, removed),
      current: null,
      activeEdge: null
    });

    return steps;
  }

  function initTopo() {
    var nodesRoot = document.getElementById("topo-nodes");
    var edgesSvg = document.getElementById("topo-edges");
    var readyRoot = document.getElementById("topo-ready");
    var orderRoot = document.getElementById("topo-order");
    var status = document.getElementById("topo-status");
    var badge = document.getElementById("topo-badge");
    var countEl = document.getElementById("topo-count");
    var codeRoot = document.getElementById("topo-code");
    var codeNote = document.getElementById("topo-code-note");
    if (!nodesRoot || !edgesSvg) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var steps = buildSteps();
    var index = -1;
    var playing = false;
    var playTimer = null;
    var lineEls = {};
    var nodeEls = {};
    var edgeEls = [];

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
    }

    function paintGraph() {
      nodesRoot.innerHTML = "";
      edgesSvg.innerHTML = "";
      nodeEls = {};
      edgeEls = [];
      EDGES.forEach(function (pair) {
        var a = NODES.find(function (n) {
          return n.id === pair[0];
        });
        var b = NODES.find(function (n) {
          return n.id === pair[1];
        });
        if (!a || !b) return;
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", a.x + "%");
        line.setAttribute("y1", a.y + "%");
        line.setAttribute("x2", b.x + "%");
        line.setAttribute("y2", b.y + "%");
        line.setAttribute("class", "topo-edge");
        line.dataset.a = pair[0];
        line.dataset.b = pair[1];
        edgesSvg.appendChild(line);
        edgeEls.push(line);
      });
      NODES.forEach(function (n) {
        var el = document.createElement("div");
        el.className = "topo-node";
        el.style.left = n.x + "%";
        el.style.top = n.y + "%";
        el.innerHTML =
          '<span class="topo-node-id">' +
          n.id +
          '</span><span class="topo-indeg" data-indeg="' +
          n.id +
          '">0</span>';
        el.dataset.id = n.id;
        nodesRoot.appendChild(el);
        nodeEls[n.id] = el;
      });
    }

    function paintChips(root, ids, kind) {
      if (!root) return;
      root.innerHTML = "";
      if (!ids.length) {
        var empty = document.createElement("span");
        empty.className = "topo-empty";
        empty.textContent = "—";
        root.appendChild(empty);
        return;
      }
      ids.forEach(function (id) {
        var chip = document.createElement("span");
        chip.className = "topo-chip is-" + kind;
        chip.setAttribute("role", "listitem");
        chip.textContent = id;
        root.appendChild(chip);
      });
    }

    function apply(step) {
      Object.keys(nodeEls).forEach(function (id) {
        var el = nodeEls[id];
        var gone = step.removed[id];
        var cur = step.current === id;
        var ready = step.ready.indexOf(id) >= 0;
        el.classList.toggle("is-done", Boolean(gone));
        el.classList.toggle("is-current", cur);
        el.classList.toggle("is-ready", ready && !gone);
        el.classList.toggle("is-pulse", cur && !reduceMotion);
        var indegEl = el.querySelector(".topo-indeg");
        if (indegEl) indegEl.textContent = String(step.indeg[id] || 0);
      });
      edgeEls.forEach(function (line) {
        var a = line.dataset.a;
        var b = line.dataset.b;
        var dead = step.removed[a];
        var active =
          step.activeEdge &&
          step.activeEdge[0] === a &&
          step.activeEdge[1] === b;
        line.classList.toggle("is-dead", Boolean(dead));
        line.classList.toggle("is-active", Boolean(active));
      });
      paintChips(readyRoot, step.ready, "ready");
      paintChips(orderRoot, step.order, "order");
      if (countEl) countEl.textContent = String(step.order.length);
      highlight(step.line);
      if (badge) {
        badge.textContent = step.phase;
        badge.dataset.phase = step.phase;
      }
      if (codeNote) codeNote.innerHTML = step.note;
      if (status) status.textContent = step.status;
    }

    function resetView() {
      index = -1;
      var indeg0 = {};
      NODES.forEach(function (n) {
        indeg0[n.id] = 0;
      });
      EDGES.forEach(function (e) {
        indeg0[e[1]] += 1;
      });
      apply({
        line: "init",
        phase: "ready",
        note: "Compute indegrees; sources enter the ready queue.",
        status: "Reset. Step to seed the ready set.",
        ready: [],
        order: [],
        indeg: indeg0,
        removed: {},
        current: null,
        activeEdge: null
      });
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearInterval(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-topo-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (index >= steps.length - 1) {
        stopPlay();
        return;
      }
      index += 1;
      apply(steps[index]);
      if (index >= steps.length - 1) stopPlay();
    }

    function togglePlay() {
      if (playing) {
        stopPlay();
        return;
      }
      if (index >= steps.length - 1) resetView();
      playing = true;
      var playBtn = document.querySelector('[data-topo-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";
      playTimer = window.setInterval(stepOnce, reduceMotion ? 200 : 550);
    }

    renderCode();
    paintGraph();
    resetView();

    document.querySelectorAll("[data-topo-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-topo-action");
        if (action === "step") stepOnce();
        else if (action === "play") togglePlay();
        else if (action === "reset") {
          stopPlay();
          resetView();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTopo);
  } else {
    initTopo();
  }
})();
