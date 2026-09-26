/**
 * Interactive BFS demo: graph + FIFO frontier + C code highlighter.
 */
(function () {
  var NODES = [
    { id: "A", x: 18, y: 18 },
    { id: "B", x: 50, y: 12 },
    { id: "C", x: 18, y: 52 },
    { id: "D", x: 82, y: 18 },
    { id: "E", x: 50, y: 48 },
    { id: "F", x: 82, y: 52 },
    { id: "G", x: 50, y: 82 }
  ];

  var ADJ = {
    A: ["B", "C"],
    B: ["A", "D", "E"],
    C: ["A", "E"],
    D: ["B", "F"],
    E: ["B", "C", "F", "G"],
    F: ["D", "E", "G"],
    G: ["E", "F"]
  };

  var EDGES = [
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["B", "E"],
    ["C", "E"],
    ["D", "F"],
    ["E", "F"],
    ["E", "G"],
    ["F", "G"]
  ];

  var CODE_LINES = [
    { html: '<span class="code-type">void</span> <span class="code-fn">bfs</span>(<span class="code-type">int</span> start) {', id: "sig" },
    { html: '  <span class="code-type">int</span> q[MAX], head = <span class="code-num">0</span>, tail = <span class="code-num">0</span>;', id: "queue" },
    { html: '  <span class="code-type">int</span> visited[N] = {<span class="code-num">0</span>};', id: "visited" },
    { blank: true },
    { html: '  q[tail++] = start;', id: "seed" },
    { html: '  visited[start] = <span class="code-num">1</span>;', id: "mark-start" },
    { blank: true },
    { html: '  <span class="code-kw">while</span> (head &lt; tail) {', id: "while" },
    { html: '    <span class="code-type">int</span> v = q[head++]; <span class="code-cm">/* dequeue */</span>', id: "dequeue" },
    { html: '    <span class="code-cm">/* visit v */</span>', id: "visit" },
    { html: '    <span class="code-kw">for</span> (each neighbor w of v)', id: "for" },
    { html: '      <span class="code-kw">if</span> (!visited[w]) {', id: "check" },
    { html: '        visited[w] = <span class="code-num">1</span>;', id: "mark" },
    { html: '        q[tail++] = w; <span class="code-cm">/* enqueue */</span>', id: "enqueue" },
    { html: '      }' },
    { html: '  }' },
    { html: '}' }
  ];

  function buildScript() {
    var steps = [];
    var queue = [];
    var visited = {};
    var start = "A";

    steps.push({
      kind: "seed",
      line: "seed",
      phase: "seed",
      note: "Enqueue start node <strong>A</strong> at the rear.",
      status: "Enqueue A — seed the FIFO frontier.",
      queue: [start],
      visited: {},
      current: null,
      activeEdge: null
    });

    visited[start] = true;
    queue.push(start);
    steps.push({
      kind: "mark-start",
      line: "mark-start",
      phase: "seed",
      note: "Mark <strong>A</strong> visited so we never enqueue it again.",
      status: "Mark A visited.",
      queue: queue.slice(),
      visited: Object.assign({}, visited),
      current: null,
      activeEdge: null
    });

    while (queue.length) {
      steps.push({
        kind: "while",
        line: "while",
        phase: "loop",
        note: "Frontier not empty — keep expanding.",
        status: "Queue: [" + queue.join(", ") + "].",
        queue: queue.slice(),
        visited: Object.assign({}, visited),
        current: null,
        activeEdge: null
      });

      var v = queue.shift();
      steps.push({
        kind: "dequeue",
        line: "dequeue",
        phase: "expand",
        note: "Dequeue <strong>" + v + "</strong> from the front.",
        status: "Dequeue " + v + ".",
        queue: queue.slice(),
        visited: Object.assign({}, visited),
        current: v,
        activeEdge: null
      });

      steps.push({
        kind: "visit",
        line: "visit",
        phase: "visit",
        note: "Visit <strong>" + v + "</strong> — first time we expand it.",
        status: "Visit " + v + ".",
        queue: queue.slice(),
        visited: Object.assign({}, visited),
        current: v,
        activeEdge: null,
        pulse: v
      });

      var neighbors = ADJ[v] || [];
      var i;
      for (i = 0; i < neighbors.length; i++) {
        var w = neighbors[i];
        steps.push({
          kind: "for",
          line: "for",
          phase: "scan",
          note: "Scan neighbor <strong>" + w + "</strong> of " + v + ".",
          status: "Look at edge " + v + "–" + w + ".",
          queue: queue.slice(),
          visited: Object.assign({}, visited),
          current: v,
          activeEdge: [v, w]
        });

        steps.push({
          kind: "check",
          line: "check",
          phase: "scan",
          note: visited[w]
            ? "<strong>" + w + "</strong> already visited — skip."
            : "<strong>" + w + "</strong> unseen — discover it.",
          status: visited[w]
            ? w + " already known."
            : "Discover " + w + ".",
          queue: queue.slice(),
          visited: Object.assign({}, visited),
          current: v,
          activeEdge: [v, w]
        });

        if (!visited[w]) {
          visited[w] = true;
          steps.push({
            kind: "mark",
            line: "mark",
            phase: "discover",
            note: "Mark <strong>" + w + "</strong> visited when discovered.",
            status: "Mark " + w + " visited.",
            queue: queue.slice(),
            visited: Object.assign({}, visited),
            current: v,
            activeEdge: [v, w],
            discovering: w
          });

          queue.push(w);
          steps.push({
            kind: "enqueue",
            line: "enqueue",
            phase: "discover",
            note: "Enqueue <strong>" + w + "</strong> at the rear (FIFO).",
            status: "Enqueue " + w + ". Queue: [" + queue.join(", ") + "].",
            queue: queue.slice(),
            visited: Object.assign({}, visited),
            current: v,
            activeEdge: [v, w],
            discovering: w
          });
        }
      }
    }

    steps.push({
      kind: "done",
      line: "sig",
      phase: "done",
      note: "Queue empty — every reachable node was visited layer by layer.",
      status: "Done. Order: A → B → C → D → E → F → G.",
      queue: [],
      visited: Object.assign({}, visited),
      current: null,
      activeEdge: null
    });

    return steps;
  }

  function initBfs() {
    var nodesRoot = document.getElementById("bfs-nodes");
    var edgesSvg = document.getElementById("bfs-edges");
    var queueRoot = document.getElementById("bfs-queue");
    var status = document.getElementById("bfs-status");
    var visitedEl = document.getElementById("bfs-visited");
    var phaseEl = document.getElementById("bfs-phase");
    var codeRoot = document.getElementById("bfs-code");
    var codeNote = document.getElementById("bfs-code-note");
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
        line.setAttribute("class", "bfs-edge");
        line.dataset.a = pair[0];
        line.dataset.b = pair[1];
        edgesSvg.appendChild(line);
        edgeEls.push(line);
      });

      NODES.forEach(function (n) {
        var btn = document.createElement("div");
        btn.className = "bfs-node";
        btn.style.left = n.x + "%";
        btn.style.top = n.y + "%";
        btn.textContent = n.id;
        btn.dataset.id = n.id;
        btn.setAttribute("role", "listitem");
        btn.setAttribute("aria-label", "Node " + n.id);
        nodesRoot.appendChild(btn);
        nodeEls[n.id] = btn;
      });
    }

    function paintQueue(queue) {
      if (!queueRoot) return;
      queueRoot.innerHTML = "";
      if (!queue || !queue.length) {
        var empty = document.createElement("span");
        empty.className = "bfs-frontier-empty";
        empty.textContent = "empty";
        queueRoot.appendChild(empty);
        return;
      }
      queue.forEach(function (id, i) {
        var chip = document.createElement("span");
        chip.className =
          "bfs-chip" +
          (i === 0 ? " is-front" : "") +
          (i === queue.length - 1 ? " is-rear" : "");
        chip.setAttribute("role", "listitem");
        chip.textContent = id;
        queueRoot.appendChild(chip);
      });
    }

    function applyState(step) {
      var visited = step.visited || {};
      var count = 0;
      Object.keys(nodeEls).forEach(function (id) {
        var el = nodeEls[id];
        var isVisited = Boolean(visited[id]);
        var isCurrent = step.current === id;
        var isDiscovering = step.discovering === id;
        var inQueue = (step.queue || []).indexOf(id) !== -1;
        if (isVisited) count += 1;
        el.classList.toggle("is-visited", isVisited && !isCurrent);
        el.classList.toggle("is-current", isCurrent);
        el.classList.toggle("is-frontier", inQueue && !isCurrent);
        el.classList.toggle("is-discover", Boolean(isDiscovering));
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
        var bothVisited = visited[a] && visited[b];
        line.classList.toggle("is-active", Boolean(active));
        line.classList.toggle("is-traversed", Boolean(bothVisited) && !active);
      });

      paintQueue(step.queue);
      if (visitedEl) visitedEl.textContent = String(count);
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
      var playBtn = document.querySelector('[data-bfs-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= steps.length - 1) {
        stopPlay();
        setStatus("Finished. Reset to run BFS from A again.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyState(steps[index]);
      } catch (err) {
        console.error("[learn-bfs] Step failed", { index: index, err: err });
      }
      busy = false;
      return index < steps.length - 1;
    }

    function play() {
      if (playing) {
        stopPlay();
        return;
      }
      if (index >= steps.length - 1) {
        reset();
      }
      playing = true;
      var playBtn = document.querySelector('[data-bfs-action="play"]');
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
        nodeEls[id].className = "bfs-node";
      });
      edgeEls.forEach(function (line) {
        line.classList.remove("is-active", "is-traversed");
      });
      paintQueue([]);
      if (visitedEl) visitedEl.textContent = "0";
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setPhase("ready");
      setCodeNote(
        "Press <strong>Step</strong> or <strong>Play</strong> — the BFS loop lights up as the FIFO frontier grows and shrinks."
      );
      setStatus("Ready. Step to enqueue A and start the layer-by-layer walk.");
    }

    document.querySelectorAll("[data-bfs-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-bfs-action");
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
    initBfs();
  } catch (err) {
    console.error("[learn-bfs] Init failed", err);
  }
})();
