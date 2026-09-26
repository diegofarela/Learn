/**
 * Network flow: Edmonds–Karp on a tiny residual graph.
 */
(function () {
  var NODES = [
    { id: "s", x: 8, y: 50 },
    { id: "a", x: 36, y: 22 },
    { id: "b", x: 36, y: 78 },
    { id: "c", x: 64, y: 50 },
    { id: "t", x: 92, y: 50 }
  ];

  /* capacity dictionary key "u|v" */
  var CAP = {
    "s|a": 3,
    "s|b": 2,
    "a|c": 2,
    "b|c": 3,
    "a|t": 1,
    "c|t": 4
  };

  var CODE_LINES = [
    { html: 'flow = 0', id: "init" },
    { html: '<span class="code-kw">while</span> path = BFS(s → t in G<sub>f</sub>):', id: "bfs" },
    { html: '  Δ = min residual on path', id: "bottleneck" },
    { html: '  augment path by Δ', id: "augment" },
    { html: '  flow += Δ', id: "add" },
    { html: '<span class="code-cm">/* no path ⇒ max flow */</span>', id: "done" }
  ];

  function key(u, v) {
    return u + "|" + v;
  }

  function cloneCap(src) {
    var o = {};
    Object.keys(src).forEach(function (k) {
      o[k] = src[k];
    });
    return o;
  }

  function neighbors(res, u) {
    var out = [];
    Object.keys(res).forEach(function (k) {
      if (res[k] <= 0) return;
      var parts = k.split("|");
      if (parts[0] === u) out.push(parts[1]);
    });
    return out;
  }

  function bfsPath(res) {
    var prev = { s: null };
    var q = ["s"];
    var seen = { s: true };
    while (q.length) {
      var u = q.shift();
      if (u === "t") break;
      neighbors(res, u).forEach(function (v) {
        if (seen[v]) return;
        seen[v] = true;
        prev[v] = u;
        q.push(v);
      });
    }
    if (!seen.t) return null;
    var path = [];
    for (var x = "t"; x != null; x = prev[x]) path.push(x);
    path.reverse();
    return path;
  }

  function bottleneck(res, path) {
    var d = Infinity;
    for (var i = 0; i < path.length - 1; i++) {
      d = Math.min(d, res[key(path[i], path[i + 1])]);
    }
    return d;
  }

  function augment(res, path, d) {
    for (var i = 0; i < path.length - 1; i++) {
      var u = path[i];
      var v = path[i + 1];
      res[key(u, v)] -= d;
      var back = key(v, u);
      res[back] = (res[back] || 0) + d;
    }
  }

  function buildScript() {
    var res = cloneCap(CAP);
    /* ensure reverse keys exist at 0 */
    Object.keys(CAP).forEach(function (k) {
      var parts = k.split("|");
      var back = key(parts[1], parts[0]);
      if (res[back] == null) res[back] = 0;
    });

    var steps = [];
    var flow = 0;
    steps.push({
      line: "init",
      phase: "ready",
      note: "Residual starts as capacities; flow = 0.",
      status: "Flow = 0. Find an augmenting path.",
      res: cloneCap(res),
      path: null,
      delta: 0,
      flow: 0
    });

    while (true) {
      var path = bfsPath(res);
      if (!path) break;
      var d = bottleneck(res, path);
      steps.push({
        line: "bfs",
        phase: "path",
        note: "BFS path: <strong>" + path.join(" → ") + "</strong>.",
        status: "Augmenting path found: " + path.join(" → ") + ".",
        res: cloneCap(res),
        path: path.slice(),
        delta: d,
        flow: flow
      });
      steps.push({
        line: "bottleneck",
        phase: "delta",
        note: "Bottleneck residual Δ = <strong>" + d + "</strong>.",
        status: "Δ = " + d + " on " + path.join(" → ") + ".",
        res: cloneCap(res),
        path: path.slice(),
        delta: d,
        flow: flow
      });
      augment(res, path, d);
      flow += d;
      steps.push({
        line: "augment",
        phase: "aug",
        note: "Push Δ along the path; update residual + backward edges.",
        status: "Augmented by " + d + ". Flow = " + flow + ".",
        res: cloneCap(res),
        path: path.slice(),
        delta: d,
        flow: flow
      });
      steps.push({
        line: "add",
        phase: "flow",
        note: "flow ← flow + Δ = <strong>" + flow + "</strong>.",
        status: "Total flow = " + flow + ".",
        res: cloneCap(res),
        path: null,
        delta: 0,
        flow: flow
      });
    }

    steps.push({
      line: "done",
      phase: "done",
      note: "No s–t path in residual ⇒ maximum flow.",
      status: "Max flow = " + flow + ".",
      res: cloneCap(res),
      path: null,
      delta: 0,
      flow: flow
    });

    return steps;
  }

  function initFlow() {
    var nodesRoot = document.getElementById("flow-nodes");
    var edgesSvg = document.getElementById("flow-edges");
    var pathEl = document.getElementById("flow-path");
    var status = document.getElementById("flow-status");
    var badge = document.getElementById("flow-badge");
    var valEl = document.getElementById("flow-val");
    var codeRoot = document.getElementById("flow-code");
    var codeNote = document.getElementById("flow-code-note");
    if (!nodesRoot || !edgesSvg) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var steps = buildScript();
    var index = 0;
    var playing = false;
    var playTimer = null;
    var lineEls = {};
    var nodeEls = {};

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

    function paintNodes() {
      nodesRoot.innerHTML = "";
      nodeEls = {};
      NODES.forEach(function (n) {
        var el = document.createElement("div");
        el.className = "flow-node" + (n.id === "s" || n.id === "t" ? " is-st" : "");
        el.style.left = n.x + "%";
        el.style.top = n.y + "%";
        el.textContent = n.id;
        el.dataset.id = n.id;
        nodesRoot.appendChild(el);
        nodeEls[n.id] = el;
      });
    }

    function edgePos(u, v) {
      var a = NODES.find(function (n) {
        return n.id === u;
      });
      var b = NODES.find(function (n) {
        return n.id === v;
      });
      return a && b ? { a: a, b: b } : null;
    }

    function apply(step) {
      edgesSvg.innerHTML = "";
      var res = step.res;
      var pathSet = {};
      if (step.path) {
        for (var i = 0; i < step.path.length - 1; i++) {
          pathSet[key(step.path[i], step.path[i + 1])] = true;
        }
      }

      Object.keys(res).forEach(function (k) {
        if (res[k] <= 0) return;
        var parts = k.split("|");
        var pos = edgePos(parts[0], parts[1]);
        if (!pos) return;
        var isForward = CAP[k] != null;
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        /* slight offset for bidirectional */
        var dx = pos.b.x - pos.a.x;
        var dy = pos.b.y - pos.a.y;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var ox = (-dy / len) * (isForward ? 1.2 : -1.2);
        var oy = (dx / len) * (isForward ? 1.2 : -1.2);
        line.setAttribute("x1", pos.a.x + ox + "%");
        line.setAttribute("y1", pos.a.y + oy + "%");
        line.setAttribute("x2", pos.b.x + ox + "%");
        line.setAttribute("y2", pos.b.y + oy + "%");
        line.setAttribute(
          "class",
          "flow-edge" +
            (pathSet[k] ? " is-path" : "") +
            (isForward ? "" : " is-back")
        );
        edgesSvg.appendChild(line);

        var lab = document.createElementNS("http://www.w3.org/2000/svg", "text");
        lab.setAttribute("x", (pos.a.x + pos.b.x) / 2 + ox * 2 + "%");
        lab.setAttribute("y", (pos.a.y + pos.b.y) / 2 + oy * 2 + "%");
        lab.setAttribute("class", "flow-cap" + (pathSet[k] ? " is-path" : ""));
        lab.textContent = String(res[k]);
        edgesSvg.appendChild(lab);
      });

      Object.keys(nodeEls).forEach(function (id) {
        var onPath = step.path && step.path.indexOf(id) >= 0;
        nodeEls[id].classList.toggle("is-path", Boolean(onPath));
        nodeEls[id].classList.toggle("is-pulse", Boolean(onPath) && !reduceMotion);
      });

      if (pathEl) {
        pathEl.textContent = step.path
          ? "Path: " + step.path.join(" → ") + (step.delta ? "  (Δ=" + step.delta + ")" : "")
          : "Path: —";
      }
      if (valEl) valEl.textContent = String(step.flow);
      highlight(step.line);
      if (badge) {
        badge.textContent = step.phase;
        badge.dataset.phase = step.phase;
      }
      if (codeNote) codeNote.innerHTML = step.note;
      if (status) status.textContent = step.status;
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearInterval(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-flow-action="play"]');
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
      if (index >= steps.length - 1) {
        index = 0;
        apply(steps[0]);
      }
      playing = true;
      var playBtn = document.querySelector('[data-flow-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";
      playTimer = window.setInterval(stepOnce, reduceMotion ? 250 : 700);
    }

    renderCode();
    paintNodes();
    apply(steps[0]);

    document.querySelectorAll("[data-flow-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-flow-action");
        if (action === "step") stepOnce();
        else if (action === "play") togglePlay();
        else if (action === "reset") {
          stopPlay();
          index = 0;
          apply(steps[0]);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFlow);
  } else {
    initFlow();
  }
})();
