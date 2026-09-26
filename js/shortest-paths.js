/**
 * Interactive Dijkstra demo: weighted graph + distance labels + settled set.
 */
(function () {
  var NODES = [
    { id: "A", x: 14, y: 28 },
    { id: "B", x: 42, y: 14 },
    { id: "C", x: 42, y: 52 },
    { id: "D", x: 70, y: 14 },
    { id: "E", x: 70, y: 52 },
    { id: "F", x: 92, y: 34 }
  ];

  /* Directed-looking undirected for Dijkstra (symmetric weights) */
  var EDGES = [
    { a: "A", b: "B", w: 4 },
    { a: "A", b: "C", w: 2 },
    { a: "B", b: "C", w: 1 },
    { a: "B", b: "D", w: 5 },
    { a: "C", b: "E", w: 8 },
    { a: "C", b: "D", w: 3 },
    { a: "D", b: "E", w: 2 },
    { a: "D", b: "F", w: 6 },
    { a: "E", b: "F", w: 1 }
  ];

  var ADJ = {};
  EDGES.forEach(function (e) {
    if (!ADJ[e.a]) ADJ[e.a] = [];
    if (!ADJ[e.b]) ADJ[e.b] = [];
    ADJ[e.a].push({ to: e.b, w: e.w });
    ADJ[e.b].push({ to: e.a, w: e.w });
  });

  var INF = Infinity;

  var CODE_LINES = [
    { html: '<span class="code-type">void</span> <span class="code-fn">dijkstra</span>(<span class="code-type">int</span> s) {', id: "sig" },
    { html: '  dist[] = ∞; dist[s] = <span class="code-num">0</span>;', id: "init" },
    { html: '  settled = { };', id: "settled-init" },
    { blank: true },
    { html: '  <span class="code-kw">while</span> (unsettled remain) {', id: "while" },
    { html: '    u = argmin dist among unsettled;', id: "pick" },
    { html: '    settle(u);', id: "settle" },
    { html: '    <span class="code-kw">for</span> (each edge u → v)', id: "for" },
    { html: '      <span class="code-kw">if</span> (dist[u] + w &lt; dist[v])', id: "relax-check" },
    { html: '        dist[v] = dist[u] + w; <span class="code-cm">/* relax */</span>', id: "relax" },
    { html: '  }' },
    { html: '}' }
  ];

  function cloneDist(dist) {
    var out = {};
    Object.keys(dist).forEach(function (k) {
      out[k] = dist[k];
    });
    return out;
  }

  function cloneSettled(set) {
    var out = {};
    Object.keys(set).forEach(function (k) {
      out[k] = true;
    });
    return out;
  }

  function buildScript() {
    var steps = [];
    var dist = {};
    var settled = {};
    var start = "A";

    NODES.forEach(function (n) {
      dist[n.id] = INF;
    });

    steps.push({
      kind: "init",
      line: "init",
      phase: "init",
      note: "Set all distances to ∞, then <strong>dist[A] = 0</strong>.",
      status: "Initialize distances from A.",
      dist: cloneDist(dist),
      settled: {},
      current: null,
      activeEdge: null
    });

    dist[start] = 0;
    steps.push({
      kind: "seed",
      line: "settled-init",
      phase: "init",
      note: "Settled set empty. A has the best tentative distance.",
      status: "dist[A]=0. Ready to pick.",
      dist: cloneDist(dist),
      settled: {},
      current: start,
      activeEdge: null
    });

    var ids = NODES.map(function (n) {
      return n.id;
    });

    while (Object.keys(settled).length < ids.length) {
      var u = null;
      var best = INF;
      ids.forEach(function (id) {
        if (!settled[id] && dist[id] < best) {
          best = dist[id];
          u = id;
        }
      });
      if (u === null || best === INF) break;

      steps.push({
        kind: "while",
        line: "while",
        phase: "loop",
        note: "Unsettled nodes remain — pick the closest.",
        status: "Looking for min unsettled distance.",
        dist: cloneDist(dist),
        settled: cloneSettled(settled),
        current: null,
        activeEdge: null
      });

      steps.push({
        kind: "pick",
        line: "pick",
        phase: "pick",
        note:
          "Pick <strong>" +
          u +
          "</strong> with dist = <strong>" +
          dist[u] +
          "</strong>.",
        status: "argmin → " + u + " (dist " + dist[u] + ").",
        dist: cloneDist(dist),
        settled: cloneSettled(settled),
        current: u,
        activeEdge: null,
        pulse: u
      });

      settled[u] = true;
      steps.push({
        kind: "settle",
        line: "settle",
        phase: "settle",
        note:
          "Settle <strong>" +
          u +
          "</strong> — its distance is final.",
        status: "Settled " + u + ". Set size " + Object.keys(settled).length + ".",
        dist: cloneDist(dist),
        settled: cloneSettled(settled),
        current: u,
        activeEdge: null
      });

      var neigh = ADJ[u] || [];
      var i;
      for (i = 0; i < neigh.length; i++) {
        var v = neigh[i].to;
        var w = neigh[i].w;
        if (settled[v]) continue;

        steps.push({
          kind: "for",
          line: "for",
          phase: "scan",
          note: "Look at edge <strong>" + u + "–" + v + "</strong> (w=" + w + ").",
          status: "Scan " + u + " → " + v + ".",
          dist: cloneDist(dist),
          settled: cloneSettled(settled),
          current: u,
          activeEdge: [u, v]
        });

        var via = dist[u] + w;
        var improved = via < dist[v];
        steps.push({
          kind: "relax-check",
          line: "relax-check",
          phase: "scan",
          note: improved
            ? dist[u] +
              " + " +
              w +
              " = " +
              via +
              " &lt; dist[" +
              v +
              "] — improve."
            : dist[u] +
              " + " +
              w +
              " = " +
              via +
              " ≥ dist[" +
              v +
              "] — no change.",
          status: improved
            ? "Can improve " + v + "."
            : "No improvement for " + v + ".",
          dist: cloneDist(dist),
          settled: cloneSettled(settled),
          current: u,
          activeEdge: [u, v]
        });

        if (improved) {
          dist[v] = via;
          steps.push({
            kind: "relax",
            line: "relax",
            phase: "relax",
            note:
              "Relax: <strong>dist[" +
              v +
              "] = " +
              via +
              "</strong>.",
            status: "dist[" + v + "] ← " + via + ".",
            dist: cloneDist(dist),
            settled: cloneSettled(settled),
            current: u,
            activeEdge: [u, v],
            discovering: v
          });
        }
      }
    }

    steps.push({
      kind: "done",
      line: "sig",
      phase: "done",
      note: "All nodes settled. Shortest distances from A are final.",
      status:
        "Done. " +
        ids
          .map(function (id) {
            return id + "=" + dist[id];
          })
          .join(", ") +
        ".",
      dist: cloneDist(dist),
      settled: cloneSettled(settled),
      current: null,
      activeEdge: null
    });

    return steps;
  }

  function fmtDist(d) {
    if (d === INF || d === undefined) return "∞";
    return String(d);
  }

  function initSp() {
    var nodesRoot = document.getElementById("sp-nodes");
    var edgesSvg = document.getElementById("sp-edges");
    var settledRoot = document.getElementById("sp-settled-list");
    var settledCount = document.getElementById("sp-settled");
    var status = document.getElementById("sp-status");
    var phaseEl = document.getElementById("sp-phase");
    var codeRoot = document.getElementById("sp-code");
    var codeNote = document.getElementById("sp-code-note");
    if (!nodesRoot || !edgesSvg) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var steps = buildScript();
    var index = -1;
    var busy = false;
    var playing = false;
    var playTimer = null;
    var lineEls = {};
    var nodeEls = {};
    var edgeEls = [];

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

    function mid(a, b) {
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }

    function paintGraph() {
      nodesRoot.innerHTML = "";
      edgesSvg.innerHTML = "";
      nodeEls = {};
      edgeEls = [];

      EDGES.forEach(function (e) {
        var a = NODES.find(function (n) {
          return n.id === e.a;
        });
        var b = NODES.find(function (n) {
          return n.id === e.b;
        });
        if (!a || !b) return;
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "sp-edge-g");
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", a.x + "%");
        line.setAttribute("y1", a.y + "%");
        line.setAttribute("x2", b.x + "%");
        line.setAttribute("y2", b.y + "%");
        line.setAttribute("class", "sp-edge");
        line.dataset.a = e.a;
        line.dataset.b = e.b;
        g.appendChild(line);
        var m = mid(a, b);
        var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", m.x + "%");
        label.setAttribute("y", m.y + "%");
        label.setAttribute("class", "sp-edge-label");
        label.textContent = String(e.w);
        g.appendChild(label);
        edgesSvg.appendChild(g);
        edgeEls.push(line);
      });

      NODES.forEach(function (n) {
        var wrap = document.createElement("div");
        wrap.className = "sp-node";
        wrap.style.left = n.x + "%";
        wrap.style.top = n.y + "%";
        wrap.dataset.id = n.id;
        wrap.setAttribute("role", "listitem");
        wrap.setAttribute("aria-label", "Node " + n.id);
        var idEl = document.createElement("span");
        idEl.className = "sp-node-id";
        idEl.textContent = n.id;
        var distEl = document.createElement("span");
        distEl.className = "sp-node-dist";
        distEl.textContent = "∞";
        wrap.appendChild(idEl);
        wrap.appendChild(distEl);
        nodesRoot.appendChild(wrap);
        nodeEls[n.id] = wrap;
      });
    }

    function paintSettled(settled) {
      if (!settledRoot) return;
      settledRoot.innerHTML = "";
      var keys = Object.keys(settled || {});
      if (!keys.length) {
        var empty = document.createElement("span");
        empty.className = "sp-empty";
        empty.textContent = "empty";
        settledRoot.appendChild(empty);
        return;
      }
      keys.forEach(function (id) {
        var chip = document.createElement("span");
        chip.className = "sp-chip";
        chip.setAttribute("role", "listitem");
        chip.textContent = id;
        settledRoot.appendChild(chip);
      });
    }

    function applyState(step) {
      var dist = step.dist || {};
      var settled = step.settled || {};
      Object.keys(nodeEls).forEach(function (id) {
        var el = nodeEls[id];
        var isSettled = Boolean(settled[id]);
        var isCurrent = step.current === id;
        var isDiscovering = step.discovering === id;
        el.classList.toggle("is-settled", isSettled && !isCurrent);
        el.classList.toggle("is-current", isCurrent);
        el.classList.toggle("is-discover", Boolean(isDiscovering));
        var distSpan = el.querySelector(".sp-node-dist");
        if (distSpan) distSpan.textContent = fmtDist(dist[id]);
        if (step.pulse === id && !reduceMotion) {
          el.classList.remove("is-pulse");
          void el.offsetWidth;
          el.classList.add("is-pulse");
        }
      });

      edgeEls.forEach(function (line) {
        var a = line.dataset.a;
        var b = line.dataset.b;
        var active =
          step.activeEdge &&
          ((step.activeEdge[0] === a && step.activeEdge[1] === b) ||
            (step.activeEdge[0] === b && step.activeEdge[1] === a));
        var bothSettled = settled[a] && settled[b];
        line.classList.toggle("is-active", Boolean(active));
        line.classList.toggle("is-tree", Boolean(bothSettled) && !active);
      });

      paintSettled(settled);
      if (settledCount) settledCount.textContent = String(Object.keys(settled).length);
      highlight(step.line);
      setCodeNote(step.note);
      setPhase(step.phase);
      setStatus(step.status);
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearTimeout(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-sp-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= steps.length - 1) {
        stopPlay();
        setStatus("Finished. Reset to run Dijkstra from A again.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyState(steps[index]);
      } catch (err) {
        console.error("[learn-shortest-paths] Step failed", {
          index: index,
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
      if (index >= steps.length - 1) reset();
      playing = true;
      var playBtn = document.querySelector('[data-sp-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";

      function tick() {
        if (!playing) return;
        var more = stepOnce();
        if (!more) {
          stopPlay();
          return;
        }
        playTimer = window.setTimeout(tick, reduceMotion ? 80 : 650);
      }
      tick();
    }

    function reset() {
      stopPlay();
      index = -1;
      Object.keys(nodeEls).forEach(function (id) {
        var el = nodeEls[id];
        el.className = "sp-node";
        var distSpan = el.querySelector(".sp-node-dist");
        if (distSpan) distSpan.textContent = "∞";
      });
      edgeEls.forEach(function (line) {
        line.classList.remove("is-active", "is-tree");
      });
      paintSettled({});
      if (settledCount) settledCount.textContent = "0";
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setPhase("ready");
      setCodeNote(
        "Press <strong>Step</strong> or <strong>Play</strong> — pick min, settle, relax light up."
      );
      setStatus("Ready. Step to set dist[A] = 0 and begin Dijkstra.");
    }

    document.querySelectorAll("[data-sp-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-sp-action");
        if (action === "step") {
          stopPlay();
          stepOnce();
        } else if (action === "play") play();
        else if (action === "reset") reset();
      });
    });

    renderCode();
    paintGraph();
    reset();
  }

  try {
    initSp();
  } catch (err) {
    console.error("[learn-shortest-paths] Init failed", err);
  }
})();
