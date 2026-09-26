/**
 * Interactive graphs demo: select nodes, neighbors, directed toggle, add edge.
 */
(function () {
  var NODES = [
    { id: "A", x: 18, y: 22 },
    { id: "B", x: 50, y: 14 },
    { id: "C", x: 82, y: 22 },
    { id: "D", x: 28, y: 58 },
    { id: "E", x: 72, y: 58 },
    { id: "F", x: 50, y: 84 }
  ];

  var DEFAULT_EDGES = [
    ["A", "B"],
    ["B", "C"],
    ["A", "D"],
    ["B", "E"],
    ["D", "E"],
    ["E", "F"]
  ];

  var CODE_LINES = [
    { html: '<span class="code-cm">/* adjacency list */</span>', id: "hdr" },
    { html: '<span class="code-type">node</span>* adj[N];', id: "decl" },
    { blank: true },
    { html: '<span class="code-cm">/* neighbors of selected v */</span>', id: "sel" },
    { html: '<span class="code-kw">for</span> (w <span class="code-kw">in</span> adj[v])', id: "for" },
    { html: '  <span class="code-cm">/* visit / highlight w */</span>', id: "visit" },
    { blank: true },
    { html: '<span class="code-cm">/* vs matrix: edge? → M[v][w] */</span>', id: "matrix" }
  ];

  function initGraph() {
    var nodesRoot = document.getElementById("graph-nodes");
    var edgesSvg = document.getElementById("graph-edges");
    var status = document.getElementById("graph-status");
    var edgeCountEl = document.getElementById("graph-edge-count");
    var modeEl = document.getElementById("graph-mode");
    var neighborsRoot = document.getElementById("graph-neighbors");
    var adjOfEl = document.getElementById("graph-adj-of");
    var codeRoot = document.getElementById("graph-code");
    var codeNote = document.getElementById("graph-code-note");
    if (!nodesRoot || !edgesSvg) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var edges = DEFAULT_EDGES.map(function (e) {
      return [e[0], e[1]];
    });
    var directed = false;
    var selected = [];
    var nodeEls = {};
    var edgeEls = [];
    var lineEls = {};
    var markerReady = false;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function setModeLabel() {
      if (!modeEl) return;
      modeEl.textContent = directed ? "directed" : "undirected";
      modeEl.dataset.mode = directed ? "directed" : "undirected";
    }

    function ensureMarker() {
      if (markerReady) return;
      var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", "graph-arrow");
      marker.setAttribute("viewBox", "0 0 10 10");
      marker.setAttribute("refX", "9");
      marker.setAttribute("refY", "5");
      marker.setAttribute("markerWidth", "7");
      marker.setAttribute("markerHeight", "7");
      marker.setAttribute("orient", "auto-start-reverse");
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
      path.setAttribute("class", "graph-arrow-head");
      marker.appendChild(path);
      defs.appendChild(marker);
      edgesSvg.appendChild(defs);
      markerReady = true;
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

    function highlight(ids) {
      var set = {};
      (ids || []).forEach(function (id) {
        set[id] = true;
      });
      Object.keys(lineEls).forEach(function (key) {
        var el = lineEls[key];
        var on = Boolean(set[key]);
        el.classList.toggle("is-active", on);
        el.classList.toggle("is-dim", ids && ids.length && !on);
      });
    }

    function neighborsOf(id) {
      var out = [];
      var seen = {};
      edges.forEach(function (e) {
        var a = e[0];
        var b = e[1];
        if (a === id && !seen[b]) {
          out.push(b);
          seen[b] = true;
        } else if (!directed && b === id && !seen[a]) {
          out.push(a);
          seen[a] = true;
        }
      });
      return out;
    }

    function hasEdge(a, b) {
      var i;
      for (i = 0; i < edges.length; i++) {
        var e = edges[i];
        if (e[0] === a && e[1] === b) return true;
        if (!directed && e[0] === b && e[1] === a) return true;
      }
      return false;
    }

    function paintGraph() {
      ensureMarker();
      // clear lines but keep defs
      var children = Array.prototype.slice.call(edgesSvg.childNodes);
      children.forEach(function (child) {
        if (child.tagName && child.tagName.toLowerCase() !== "defs") {
          edgesSvg.removeChild(child);
        }
      });
      nodesRoot.innerHTML = "";
      nodeEls = {};
      edgeEls = [];

      edges.forEach(function (pair) {
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
        line.setAttribute("class", "graph-edge");
        line.dataset.a = pair[0];
        line.dataset.b = pair[1];
        if (directed) {
          line.setAttribute("marker-end", "url(#graph-arrow)");
        }
        edgesSvg.appendChild(line);
        edgeEls.push(line);
      });

      NODES.forEach(function (n) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "graph-node";
        btn.style.left = n.x + "%";
        btn.style.top = n.y + "%";
        btn.textContent = n.id;
        btn.dataset.id = n.id;
        btn.setAttribute("aria-label", "Select node " + n.id);
        btn.addEventListener("click", function () {
          onSelect(n.id);
        });
        nodesRoot.appendChild(btn);
        nodeEls[n.id] = btn;
      });

      if (edgeCountEl) edgeCountEl.textContent = String(edges.length);
      refreshSelectionVisual();
    }

    function paintNeighbors(id) {
      if (!neighborsRoot) return;
      neighborsRoot.innerHTML = "";
      if (adjOfEl) {
        adjOfEl.textContent = id ? "of " + id : "(none selected)";
      }
      if (!id) {
        var empty = document.createElement("span");
        empty.className = "graph-neighbors-empty";
        empty.textContent = "select a node";
        neighborsRoot.appendChild(empty);
        return;
      }
      var nbrs = neighborsOf(id);
      if (!nbrs.length) {
        var none = document.createElement("span");
        none.className = "graph-neighbors-empty";
        none.textContent = "no neighbors";
        neighborsRoot.appendChild(none);
        return;
      }
      nbrs.forEach(function (nid) {
        var chip = document.createElement("span");
        chip.className = "graph-chip";
        chip.setAttribute("role", "listitem");
        chip.textContent = nid;
        neighborsRoot.appendChild(chip);
      });
    }

    function refreshSelectionVisual() {
      var focus = selected.length ? selected[selected.length - 1] : null;
      var nbrs = focus ? neighborsOf(focus) : [];
      Object.keys(nodeEls).forEach(function (id) {
        var el = nodeEls[id];
        var isSel = selected.indexOf(id) !== -1;
        var isNbr = nbrs.indexOf(id) !== -1;
        el.classList.toggle("is-selected", isSel);
        el.classList.toggle("is-neighbor", isNbr && !isSel);
        el.classList.toggle("is-focus", focus === id);
      });

      edgeEls.forEach(function (line) {
        var a = line.dataset.a;
        var b = line.dataset.b;
        var active = false;
        if (focus) {
          if (a === focus && nbrs.indexOf(b) !== -1) active = true;
          if (!directed && b === focus && nbrs.indexOf(a) !== -1) active = true;
          if (directed && a === focus && b && nbrs.indexOf(b) !== -1) active = true;
        }
        line.classList.toggle("is-active", active);
      });

      paintNeighbors(focus);
      if (focus) {
        highlight(["sel", "for", "visit"]);
        setCodeNote(
          "adj[<strong>" +
            focus +
            "</strong>] → [" +
            (nbrs.length ? nbrs.join(", ") : "∅") +
            "]. Matrix would set row " +
            focus +
            " columns to 1."
        );
      } else {
        highlight(["hdr", "decl"]);
        setCodeNote(
          "Select a node — the adjacency list for that vertex lights up."
        );
      }
    }

    function onSelect(id) {
      try {
        var pos = selected.indexOf(id);
        if (pos !== -1) {
          selected.splice(pos, 1);
        } else {
          selected.push(id);
          if (selected.length > 2) selected.shift();
        }
        refreshSelectionVisual();
        if (!selected.length) {
          setStatus("Selection cleared. Click a node to select.");
        } else if (selected.length === 1) {
          setStatus(
            "Selected " +
              selected[0] +
              ". Neighbors: [" +
              neighborsOf(selected[0]).join(", ") +
              "]. Click another node, then Add edge."
          );
          if (!reduceMotion && nodeEls[id]) {
            nodeEls[id].classList.remove("is-pulse");
            void nodeEls[id].offsetWidth;
            nodeEls[id].classList.add("is-pulse");
          }
        } else {
          setStatus(
            "Selected " +
              selected[0] +
              " and " +
              selected[1] +
              ". Press Add edge (or click a node to change selection)."
          );
        }
      } catch (err) {
        console.error("[learn-graph] Select failed", { id: id, err: err });
      }
    }

    function addEdge() {
      if (selected.length < 2) {
        setStatus("Select two different nodes first, then Add edge.");
        return;
      }
      var a = selected[0];
      var b = selected[1];
      if (a === b) {
        setStatus("Pick two different nodes — no self-loops in this demo.");
        return;
      }
      if (hasEdge(a, b)) {
        setStatus("Edge " + a + (directed ? "→" : "–") + b + " already exists.");
        return;
      }
      try {
        edges.push([a, b]);
        paintGraph();
        setStatus(
          "Added edge " + a + (directed ? "→" : "–") + b + ". Edges: " + edges.length + "."
        );
        highlight(["decl"]);
      } catch (err) {
        console.error("[learn-graph] Add edge failed", { a: a, b: b, err: err });
      }
    }

    function toggleDirected() {
      directed = !directed;
      setModeLabel();
      paintGraph();
      setStatus(
        directed
          ? "Directed mode — edges are one-way (A→B)."
          : "Undirected mode — edges are mutual (A–B)."
      );
    }

    function reset() {
      edges = DEFAULT_EDGES.map(function (e) {
        return [e[0], e[1]];
      });
      directed = false;
      selected = [];
      setModeLabel();
      paintGraph();
      highlight(["hdr", "decl"]);
      setCodeNote(
        "Select a node — the adjacency list for that vertex lights up."
      );
      setStatus("Reset. Click a node to select it. Select two nodes, then Add edge.");
    }

    document.querySelectorAll("[data-graph-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-graph-action");
        if (action === "add-edge") addEdge();
        else if (action === "toggle-dir") toggleDirected();
        else if (action === "reset") reset();
      });
    });

    renderCode();
    setModeLabel();
    paintGraph();
    highlight(["hdr", "decl"]);
    setStatus("Click a node to select it. Select two nodes, then Add edge.");
  }

  try {
    initGraph();
  } catch (err) {
    console.error("[learn-graph] Init failed", err);
  }
})();
