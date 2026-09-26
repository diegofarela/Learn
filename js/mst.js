/**
 * Interactive Kruskal MST demo: sorted edges + union-find accept/reject.
 */
(function () {
  var NODES = [
    { id: "A", x: 16, y: 22 },
    { id: "B", x: 50, y: 12 },
    { id: "C", x: 84, y: 22 },
    { id: "D", x: 22, y: 72 },
    { id: "E", x: 50, y: 58 },
    { id: "F", x: 78, y: 72 }
  ];

  var EDGES = [
    { a: "A", b: "B", w: 4 },
    { a: "A", b: "D", w: 3 },
    { a: "B", b: "C", w: 5 },
    { a: "B", b: "E", w: 2 },
    { a: "C", b: "F", w: 6 },
    { a: "D", b: "E", w: 7 },
    { a: "E", b: "F", w: 1 },
    { a: "A", b: "E", w: 8 },
    { a: "D", b: "F", w: 9 }
  ];

  var CODE_LINES = [
    { html: '<span class="code-type">void</span> <span class="code-fn">kruskal</span>() {', id: "sig" },
    { html: '  sort(edges by weight ascending);', id: "sort" },
    { html: '  init union-find for each vertex;', id: "uf" },
    { blank: true },
    { html: '  <span class="code-kw">for</span> (each edge e = (u, v)) {', id: "for" },
    { html: '    <span class="code-kw">if</span> (find(u) == find(v)) <span class="code-kw">continue</span>;', id: "cycle" },
    { html: '    add e to MST;', id: "add" },
    { html: '    union(u, v);', id: "union" },
    { html: '    <span class="code-kw">if</span> (MST has V-1 edges) <span class="code-kw">break</span>;', id: "done-check" },
    { html: '  }' },
    { html: '}' }
  ];

  function makeUF(ids) {
    var parent = {};
    ids.forEach(function (id) {
      parent[id] = id;
    });
    function find(x) {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    }
    function unite(a, b) {
      var ra = find(a);
      var rb = find(b);
      if (ra !== rb) parent[rb] = ra;
    }
    function same(a, b) {
      return find(a) === find(b);
    }
    return { find: find, unite: unite, same: same };
  }

  function edgeKey(a, b) {
    return a < b ? a + "-" + b : b + "-" + a;
  }

  function buildScript() {
    var steps = [];
    var ids = NODES.map(function (n) {
      return n.id;
    });
    var sorted = EDGES.slice().sort(function (x, y) {
      return x.w - y.w || x.a.localeCompare(y.a);
    });
    var uf = makeUF(ids);
    var mst = {};
    var mstList = [];
    var rejected = {};
    var total = 0;
    var need = ids.length - 1;

    steps.push({
      kind: "sort",
      line: "sort",
      phase: "sort",
      note: "Sort edges by weight: " +
        sorted
          .map(function (e) {
            return e.a + e.b + "(" + e.w + ")";
          })
          .join(", ") +
        ".",
      status: "Edges sorted lightest → heaviest.",
      mst: {},
      rejected: {},
      focus: null,
      count: 0,
      total: 0,
      sorted: sorted
    });

    steps.push({
      kind: "uf",
      line: "uf",
      phase: "init",
      note: "Each vertex starts in its own component (union-find).",
      status: "Init disjoint sets.",
      mst: {},
      rejected: {},
      focus: null,
      count: 0,
      total: 0,
      sorted: sorted
    });

    var i;
    for (i = 0; i < sorted.length; i++) {
      var e = sorted[i];
      var key = edgeKey(e.a, e.b);

      steps.push({
        kind: "for",
        line: "for",
        phase: "scan",
        note:
          "Consider edge <strong>" +
          e.a +
          "–" +
          e.b +
          "</strong> (weight " +
          e.w +
          ").",
        status: "Next: " + e.a + "–" + e.b + " w=" + e.w + ".",
        mst: Object.assign({}, mst),
        rejected: Object.assign({}, rejected),
        focus: key,
        count: mstList.length,
        total: total,
        sorted: sorted
      });

      var cycle = uf.same(e.a, e.b);
      steps.push({
        kind: "cycle",
        line: "cycle",
        phase: cycle ? "reject" : "accept",
        note: cycle
          ? e.a +
            " and " +
            e.b +
            " already connected — <strong>skip</strong> (would cycle)."
          : e.a +
            " and " +
            e.b +
            " in different sets — <strong>safe</strong> to add.",
        status: cycle
          ? "Reject " + e.a + "–" + e.b + " (cycle)."
          : "Accept " + e.a + "–" + e.b + ".",
        mst: Object.assign({}, mst),
        rejected: Object.assign({}, rejected),
        focus: key,
        count: mstList.length,
        total: total,
        sorted: sorted,
        wouldCycle: cycle
      });

      if (cycle) {
        rejected[key] = true;
        steps.push({
          kind: "skip",
          line: "cycle",
          phase: "reject",
          note: "Continue to the next lightest edge.",
          status: "Skipped " + e.a + "–" + e.b + ".",
          mst: Object.assign({}, mst),
          rejected: Object.assign({}, rejected),
          focus: key,
          count: mstList.length,
          total: total,
          sorted: sorted
        });
        continue;
      }

      mst[key] = true;
      mstList.push(e);
      total += e.w;
      uf.unite(e.a, e.b);

      steps.push({
        kind: "add",
        line: "add",
        phase: "add",
        note:
          "Add <strong>" +
          e.a +
          "–" +
          e.b +
          "</strong> to the MST (weight " +
          e.w +
          ").",
        status:
          "MST += " +
          e.a +
          "–" +
          e.b +
          ". Edges: " +
          mstList.length +
          "/" +
          need +
          ".",
        mst: Object.assign({}, mst),
        rejected: Object.assign({}, rejected),
        focus: key,
        count: mstList.length,
        total: total,
        sorted: sorted,
        pulse: key
      });

      steps.push({
        kind: "union",
        line: "union",
        phase: "union",
        note: "union(" + e.a + ", " + e.b + ") — merge components.",
        status: "Merged sets of " + e.a + " and " + e.b + ".",
        mst: Object.assign({}, mst),
        rejected: Object.assign({}, rejected),
        focus: key,
        count: mstList.length,
        total: total,
        sorted: sorted
      });

      if (mstList.length >= need) {
        steps.push({
          kind: "done-check",
          line: "done-check",
          phase: "done",
          note: "Have V−1 = " + need + " edges — MST complete.",
          status: "Stop. Total weight " + total + ".",
          mst: Object.assign({}, mst),
          rejected: Object.assign({}, rejected),
          focus: null,
          count: mstList.length,
          total: total,
          sorted: sorted
        });
        break;
      }
    }

    steps.push({
      kind: "done",
      line: "sig",
      phase: "done",
      note:
        "MST weight <strong>" +
        total +
        "</strong>: " +
        mstList
          .map(function (e) {
            return e.a + "–" + e.b;
          })
          .join(", ") +
        ".",
      status: "Done. Kruskal MST total = " + total + ".",
      mst: Object.assign({}, mst),
      rejected: Object.assign({}, rejected),
      focus: null,
      count: mstList.length,
      total: total,
      sorted: sorted
    });

    return steps;
  }

  function initMst() {
    var nodesRoot = document.getElementById("mst-nodes");
    var edgesSvg = document.getElementById("mst-edges");
    var edgeList = document.getElementById("mst-edge-list");
    var countEl = document.getElementById("mst-count");
    var status = document.getElementById("mst-status");
    var phaseEl = document.getElementById("mst-phase");
    var codeRoot = document.getElementById("mst-code");
    var codeNote = document.getElementById("mst-code-note");
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
    var edgeEls = {};
    var listEls = {};

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
      edgeEls = {};

      EDGES.forEach(function (e) {
        var a = NODES.find(function (n) {
          return n.id === e.a;
        });
        var b = NODES.find(function (n) {
          return n.id === e.b;
        });
        if (!a || !b) return;
        var key = edgeKey(e.a, e.b);
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", a.x + "%");
        line.setAttribute("y1", a.y + "%");
        line.setAttribute("x2", b.x + "%");
        line.setAttribute("y2", b.y + "%");
        line.setAttribute("class", "mst-edge");
        line.dataset.key = key;
        g.appendChild(line);
        var m = mid(a, b);
        var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", m.x + "%");
        label.setAttribute("y", m.y + "%");
        label.setAttribute("class", "mst-edge-label");
        label.textContent = String(e.w);
        g.appendChild(label);
        edgesSvg.appendChild(g);
        edgeEls[key] = line;
      });

      NODES.forEach(function (n) {
        var btn = document.createElement("div");
        btn.className = "mst-node";
        btn.style.left = n.x + "%";
        btn.style.top = n.y + "%";
        btn.textContent = n.id;
        btn.dataset.id = n.id;
        btn.setAttribute("role", "listitem");
        nodesRoot.appendChild(btn);
        nodeEls[n.id] = btn;
      });
    }

    function paintEdgeList(sorted, focus, mst, rejected) {
      if (!edgeList) return;
      edgeList.innerHTML = "";
      listEls = {};
      (sorted || EDGES.slice().sort(function (x, y) {
        return x.w - y.w;
      })).forEach(function (e) {
        var key = edgeKey(e.a, e.b);
        var chip = document.createElement("span");
        chip.className = "mst-chip";
        chip.setAttribute("role", "listitem");
        chip.textContent = e.a + "–" + e.b + " · " + e.w;
        if (focus === key) chip.classList.add("is-focus");
        if (mst && mst[key]) chip.classList.add("is-mst");
        if (rejected && rejected[key]) chip.classList.add("is-reject");
        edgeList.appendChild(chip);
        listEls[key] = chip;
      });
    }

    function applyState(step) {
      var mst = step.mst || {};
      var rejected = step.rejected || {};
      Object.keys(edgeEls).forEach(function (key) {
        var line = edgeEls[key];
        line.classList.toggle("is-focus", step.focus === key);
        line.classList.toggle("is-mst", Boolean(mst[key]));
        line.classList.toggle("is-reject", Boolean(rejected[key]));
        line.classList.toggle(
          "is-cycle",
          Boolean(step.wouldCycle && step.focus === key)
        );
        if (step.pulse === key && !reduceMotion) {
          line.classList.remove("is-pulse");
          void line.offsetWidth;
          line.classList.add("is-pulse");
        }
      });

      Object.keys(nodeEls).forEach(function (id) {
        var inMst = false;
        Object.keys(mst).forEach(function (key) {
          if (key.indexOf(id) !== -1) inMst = true;
        });
        nodeEls[id].classList.toggle("is-in-mst", inMst);
      });

      paintEdgeList(step.sorted, step.focus, mst, rejected);
      if (countEl) countEl.textContent = String(step.count || 0);
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
      var playBtn = document.querySelector('[data-mst-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= steps.length - 1) {
        stopPlay();
        setStatus("Finished. Reset to grow the MST again.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyState(steps[index]);
      } catch (err) {
        console.error("[learn-mst] Step failed", { index: index, err: err });
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
      var playBtn = document.querySelector('[data-mst-action="play"]');
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

    function reset() {
      stopPlay();
      index = -1;
      Object.keys(edgeEls).forEach(function (key) {
        edgeEls[key].classList.remove(
          "is-focus",
          "is-mst",
          "is-reject",
          "is-cycle",
          "is-pulse"
        );
      });
      Object.keys(nodeEls).forEach(function (id) {
        nodeEls[id].className = "mst-node";
      });
      paintEdgeList(
        EDGES.slice().sort(function (x, y) {
          return x.w - y.w;
        }),
        null,
        {},
        {}
      );
      if (countEl) countEl.textContent = "0";
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setPhase("ready");
      setCodeNote(
        "Press <strong>Step</strong> or <strong>Play</strong> — sort, find, union light up as the forest merges."
      );
      setStatus("Ready. Step to sort edges and start Kruskal.");
    }

    document.querySelectorAll("[data-mst-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-mst-action");
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
    initMst();
  } catch (err) {
    console.error("[learn-mst] Init failed", err);
  }
})();
