/**
 * Graph theory (math): path / cut / connected components highlight.
 */
(function () {
  var NS = "http://www.w3.org/2000/svg";

  var NODES = [
    { id: "A", x: 60, y: 80 },
    { id: "B", x: 160, y: 50 },
    { id: "C", x: 160, y: 140 },
    { id: "D", x: 260, y: 80 },
    { id: "E", x: 360, y: 50 },
    { id: "F", x: 360, y: 140 },
    { id: "G", x: 60, y: 210 }
  ];

  // Two components: {A,B,C,D,E,F} and {G}
  var EDGES = [
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["C", "D"],
    ["D", "E"],
    ["D", "F"],
    ["E", "F"]
  ];

  var PATH_EDGES = [
    ["A", "B"],
    ["B", "D"],
    ["D", "F"]
  ];
  var PATH_NODES = ["A", "B", "D", "F"];
  var CUT_EDGES = [
    ["D", "E"],
    ["D", "F"]
  ];
  var CUT_S = ["A", "B", "C", "D"];
  var COMP_COLORS = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
    G: 1
  };

  function edgeKey(u, v) {
    return u < v ? u + "-" + v : v + "-" + u;
  }

  function initGtm() {
    var svg = document.getElementById("gtm-svg");
    var status = document.getElementById("gtm-status");
    var badge = document.getElementById("gtm-badge");
    var meta = document.getElementById("gtm-meta");
    var codeRoot = document.getElementById("gtm-code");
    var codeNote = document.getElementById("gtm-code-note");
    var toggle = document.querySelector(".gtm-toggle");
    if (!svg) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mode = "path";
    var pos = {};
    NODES.forEach(function (n) {
      pos[n.id] = n;
    });

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function svgEl(name, attrs) {
      var el = document.createElementNS(NS, name);
      if (attrs) {
        Object.keys(attrs).forEach(function (k) {
          el.setAttribute(k, attrs[k]);
        });
      }
      return el;
    }

    function isPathEdge(u, v) {
      var k = edgeKey(u, v);
      return PATH_EDGES.some(function (e) {
        return edgeKey(e[0], e[1]) === k;
      });
    }

    function isCutEdge(u, v) {
      var k = edgeKey(u, v);
      return CUT_EDGES.some(function (e) {
        return edgeKey(e[0], e[1]) === k;
      });
    }

    function draw() {
      svg.innerHTML = "";
      EDGES.forEach(function (e) {
        var a = pos[e[0]];
        var b = pos[e[1]];
        var cls = "gtm-edge";
        if (mode === "path" && isPathEdge(e[0], e[1])) {
          cls += " is-path";
          if (!reduceMotion) cls += " is-pulse";
        }
        if (mode === "cut" && isCutEdge(e[0], e[1])) {
          cls += " is-cut";
          if (!reduceMotion) cls += " is-pulse";
        }
        if (mode === "components") cls += " is-comp";
        svg.appendChild(
          svgEl("line", {
            x1: String(a.x),
            y1: String(a.y),
            x2: String(b.x),
            y2: String(b.y),
            class: cls
          })
        );
      });

      NODES.forEach(function (n) {
        var cls = "gtm-node";
        if (mode === "path" && PATH_NODES.indexOf(n.id) >= 0) cls += " is-path";
        if (mode === "cut") {
          cls += CUT_S.indexOf(n.id) >= 0 ? " is-side-s" : " is-side-t";
        }
        if (mode === "components") {
          cls += COMP_COLORS[n.id] === 0 ? " is-comp0" : " is-comp1";
        }
        var g = svgEl("g", { class: cls });
        g.appendChild(
          svgEl("circle", {
            cx: String(n.x),
            cy: String(n.y),
            r: "18"
          })
        );
        var t = svgEl("text", {
          x: String(n.x),
          y: String(n.y + 5),
          "text-anchor": "middle",
          class: "gtm-label"
        });
        t.textContent = n.id;
        g.appendChild(t);
        svg.appendChild(g);
      });
    }

    function refresh() {
      if (meta) meta.textContent = mode;
      draw();

      var lines;
      if (mode === "path") {
        if (badge) badge.textContent = "path A→F";
        lines = [
          "path: A–B–D–F",
          "no repeated vertices",
          "length = 3 edges",
          "dist(A,F) ≤ 3"
        ];
        setStatus("Path A–B–D–F connects A to F. Length 3 edges.");
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Path</strong> — walk with distinct vertices; distance is shortest path length.";
        }
      } else if (mode === "cut") {
        if (badge) badge.textContent = "cut δ(S)";
        lines = [
          "S = {A,B,C,D}",
          "V−S = {E,F,G}",
          "cut-set = {DE, DF}",
          "δ(S) size = 2"
        ];
        setStatus(
          "Cut (S, V−S): edges DE and DF cross the partition. G is isolated from S."
        );
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Cut</strong> — edges with exactly one endpoint in S.";
        }
      } else {
        if (badge) badge.textContent = "2 components";
        lines = [
          "C₁ = {A,B,C,D,E,F}",
          "C₂ = {G}",
          "κ₀(G) = 2",
          "G isolated (deg 0)"
        ];
        setStatus(
          "Two connected components: the hexagon-ish block, and singleton G."
        );
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Components</strong> — equivalence classes under “reachable by a path.”";
        }
      }

      if (codeRoot) {
        codeRoot.innerHTML = "";
        lines.forEach(function (text, i) {
          var row = document.createElement("div");
          row.className = "code-line" + (i === 0 ? " is-active" : "");
          var ln = document.createElement("span");
          ln.className = "code-ln";
          ln.textContent = String(i + 1);
          var src = document.createElement("span");
          src.className = "code-src";
          src.textContent = text;
          row.appendChild(ln);
          row.appendChild(src);
          codeRoot.appendChild(row);
        });
      }
    }

    if (toggle) {
      toggle.addEventListener("click", function (ev) {
        try {
          var btn = ev.target.closest("[data-gtm-mode]");
          if (!btn) return;
          mode = btn.getAttribute("data-gtm-mode") || "path";
          toggle.querySelectorAll("[data-gtm-mode]").forEach(function (b) {
            b.classList.toggle("is-selected", b === btn);
          });
          refresh();
        } catch (err) {
          console.error("[learn-gtm] Mode toggle failed", err);
        }
      });
    }

    refresh();
  }

  try {
    initGtm();
  } catch (err) {
    console.error("[learn-gtm] Init failed", err);
  }
})();
