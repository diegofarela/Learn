/**
 * Interactive DFS demo: same graph family as BFS, LIFO stack frontier + C code.
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
    { html: '<span class="code-type">void</span> <span class="code-fn">dfs</span>(<span class="code-type">int</span> start) {', id: "sig" },
    { html: '  <span class="code-type">int</span> st[MAX], top = <span class="code-num">-1</span>;', id: "stack" },
    { html: '  <span class="code-type">int</span> visited[N] = {<span class="code-num">0</span>};', id: "visited" },
    { blank: true },
    { html: '  st[++top] = start; <span class="code-cm">/* push */</span>', id: "seed" },
    { blank: true },
    { html: '  <span class="code-kw">while</span> (top &gt;= <span class="code-num">0</span>) {', id: "while" },
    { html: '    <span class="code-type">int</span> v = st[top--]; <span class="code-cm">/* pop */</span>', id: "pop" },
    { html: '    <span class="code-kw">if</span> (visited[v]) <span class="code-kw">continue</span>;', id: "skip" },
    { html: '    visited[v] = <span class="code-num">1</span>;', id: "mark" },
    { html: '    <span class="code-cm">/* visit v */</span>', id: "visit" },
    { html: '    <span class="code-kw">for</span> (each neighbor w of v)', id: "for" },
    { html: '      <span class="code-kw">if</span> (!visited[w])', id: "check" },
    { html: '        st[++top] = w; <span class="code-cm">/* push */</span>', id: "push" },
    { html: '  }' },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-cm">/* recursive DFS uses the call stack the same way */</span>', id: "recur-note" }
  ];

  function buildScript() {
    var steps = [];
    var stack = [];
    var visited = {};
    var start = "A";
    var visitOrder = [];

    stack.push(start);
    steps.push({
      kind: "seed",
      line: "seed",
      phase: "seed",
      note: "Push start node <strong>A</strong> onto the stack.",
      status: "Push A — seed the LIFO frontier.",
      stack: stack.slice(),
      visited: {},
      current: null,
      activeEdge: null
    });

    while (stack.length) {
      steps.push({
        kind: "while",
        line: "while",
        phase: "loop",
        note: "Stack not empty — keep going deep.",
        status: "Stack: [" + stack.join(", ") + "] (top at right).",
        stack: stack.slice(),
        visited: Object.assign({}, visited),
        current: null,
        activeEdge: null
      });

      var v = stack.pop();
      steps.push({
        kind: "pop",
        line: "pop",
        phase: "expand",
        note: "Pop <strong>" + v + "</strong> from the top.",
        status: "Pop " + v + ".",
        stack: stack.slice(),
        visited: Object.assign({}, visited),
        current: v,
        activeEdge: null
      });

      if (visited[v]) {
        steps.push({
          kind: "skip",
          line: "skip",
          phase: "skip",
          note: "<strong>" + v + "</strong> already visited — continue.",
          status: "Skip " + v + " (already visited).",
          stack: stack.slice(),
          visited: Object.assign({}, visited),
          current: v,
          activeEdge: null
        });
        continue;
      }

      steps.push({
        kind: "skip",
        line: "skip",
        phase: "expand",
        note: "<strong>" + v + "</strong> not visited yet — claim it.",
        status: v + " is new.",
        stack: stack.slice(),
        visited: Object.assign({}, visited),
        current: v,
        activeEdge: null
      });

      visited[v] = true;
      visitOrder.push(v);
      steps.push({
        kind: "mark",
        line: "mark",
        phase: "visit",
        note: "Mark <strong>" + v + "</strong> visited.",
        status: "Mark " + v + " visited.",
        stack: stack.slice(),
        visited: Object.assign({}, visited),
        current: v,
        activeEdge: null
      });

      steps.push({
        kind: "visit",
        line: "visit",
        phase: "visit",
        note: "Visit <strong>" + v + "</strong> — dive from here next.",
        status: "Visit " + v + ".",
        stack: stack.slice(),
        visited: Object.assign({}, visited),
        current: v,
        activeEdge: null,
        pulse: v
      });

      /* Push neighbors in reverse alpha so LIFO explores alphabetically first. */
      var neighbors = (ADJ[v] || []).slice().reverse();
      var i;
      for (i = 0; i < neighbors.length; i++) {
        var w = neighbors[i];
        steps.push({
          kind: "for",
          line: "for",
          phase: "scan",
          note: "Consider neighbor <strong>" + w + "</strong> of " + v + ".",
          status: "Look at edge " + v + "–" + w + ".",
          stack: stack.slice(),
          visited: Object.assign({}, visited),
          current: v,
          activeEdge: [v, w]
        });

        steps.push({
          kind: "check",
          line: "check",
          phase: "scan",
          note: visited[w]
            ? "<strong>" + w + "</strong> already visited — do not push."
            : "<strong>" + w + "</strong> unseen — push onto the stack.",
          status: visited[w] ? w + " already known." : "Will push " + w + ".",
          stack: stack.slice(),
          visited: Object.assign({}, visited),
          current: v,
          activeEdge: [v, w]
        });

        if (!visited[w]) {
          stack.push(w);
          steps.push({
            kind: "push",
            line: "push",
            phase: "discover",
            note: "Push <strong>" + w + "</strong> (LIFO — newest sits on top).",
            status: "Push " + w + ". Stack: [" + stack.join(", ") + "].",
            stack: stack.slice(),
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
      note:
        "Stack empty — depth-first walk complete. Recursive DFS would push/pop frames on the <strong>call stack</strong> instead.",
      status: "Done. Order: " + visitOrder.join(" → ") + ".",
      stack: [],
      visited: Object.assign({}, visited),
      current: null,
      activeEdge: null
    });

    steps.push({
      kind: "recur-note",
      line: "recur-note",
      phase: "done",
      note:
        "Same algorithm, different stack: recursive DFS leans on the <strong>call stack</strong> (see recursion / call stack).",
      status: "Done. Order: " + visitOrder.join(" → ") + ".",
      stack: [],
      visited: Object.assign({}, visited),
      current: null,
      activeEdge: null
    });

    return steps;
  }

  function initDfs() {
    var nodesRoot = document.getElementById("dfs-nodes");
    var edgesSvg = document.getElementById("dfs-edges");
    var stackRoot = document.getElementById("dfs-stack");
    var status = document.getElementById("dfs-status");
    var visitedEl = document.getElementById("dfs-visited");
    var phaseEl = document.getElementById("dfs-phase");
    var codeRoot = document.getElementById("dfs-code");
    var codeNote = document.getElementById("dfs-code-note");
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
        line.setAttribute("class", "dfs-edge");
        line.dataset.a = pair[0];
        line.dataset.b = pair[1];
        edgesSvg.appendChild(line);
        edgeEls.push(line);
      });

      NODES.forEach(function (n) {
        var btn = document.createElement("div");
        btn.className = "dfs-node";
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

    function paintStack(stack) {
      if (!stackRoot) return;
      stackRoot.innerHTML = "";
      if (!stack || !stack.length) {
        var empty = document.createElement("span");
        empty.className = "dfs-frontier-empty";
        empty.textContent = "empty";
        stackRoot.appendChild(empty);
        return;
      }
      stack.forEach(function (id, i) {
        var chip = document.createElement("span");
        chip.className =
          "dfs-chip" + (i === stack.length - 1 ? " is-top" : "");
        chip.setAttribute("role", "listitem");
        chip.textContent = id;
        stackRoot.appendChild(chip);
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
        var inStack = (step.stack || []).indexOf(id) !== -1;
        if (isVisited) count += 1;
        el.classList.toggle("is-visited", isVisited && !isCurrent);
        el.classList.toggle("is-current", isCurrent);
        el.classList.toggle("is-frontier", inStack && !isCurrent && !isVisited);
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

      paintStack(step.stack);
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
      var playBtn = document.querySelector('[data-dfs-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= steps.length - 1) {
        stopPlay();
        setStatus("Finished. Reset to run DFS from A again.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyState(steps[index]);
      } catch (err) {
        console.error("[learn-dfs] Step failed", { index: index, err: err });
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
      var playBtn = document.querySelector('[data-dfs-action="play"]');
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
        nodeEls[id].className = "dfs-node";
      });
      edgeEls.forEach(function (line) {
        line.classList.remove("is-active", "is-traversed");
      });
      paintStack([]);
      if (visitedEl) visitedEl.textContent = "0";
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setPhase("ready");
      setCodeNote(
        "Press <strong>Step</strong> or <strong>Play</strong> — the DFS loop lights up as the LIFO frontier grows and shrinks. Recursive DFS is the same idea on the call stack."
      );
      setStatus("Ready. Step to push A and start the depth-first walk.");
    }

    document.querySelectorAll("[data-dfs-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-dfs-action");
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
    initDfs();
  } catch (err) {
    console.error("[learn-dfs] Init failed", err);
  }
})();
