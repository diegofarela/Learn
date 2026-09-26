/**
 * P vs NP: complexity map + Clique ↔ Independent Set via complement.
 */
(function () {
  var CLASSES = [
    {
      id: "p",
      label: "P",
      blurb: "Solvable in polynomial time (sorting, shortest paths in reasonable models).",
      code: "poly-time algorithm exists"
    },
    {
      id: "np",
      label: "NP",
      blurb: "Yes-answers have short certificates checkable in poly time.",
      code: "verifier V(x, cert) in poly"
    },
    {
      id: "npc",
      label: "NP-complete",
      blurb: "In NP and NP-hard: every NP problem reduces to them.",
      code: "Clique, IS, SAT, …"
    },
    {
      id: "exp",
      label: "EXPTIME+",
      blurb: "Some decidable problems need exponential (or worse) resources.",
      code: "beyond NP (examples)"
    }
  ];

  var NODES = [
    { id: "A", x: 22, y: 30 },
    { id: "B", x: 50, y: 18 },
    { id: "C", x: 78, y: 30 },
    { id: "D", x: 35, y: 70 },
    { id: "E", x: 65, y: 70 }
  ];

  /* G edges (undirected): triangle ABC + D-E, A-D, C-E */
  var G_EDGES = [
    ["A", "B"],
    ["B", "C"],
    ["A", "C"],
    ["A", "D"],
    ["C", "E"],
    ["D", "E"]
  ];

  var ALL_PAIRS = [];
  NODES.forEach(function (a, i) {
    NODES.slice(i + 1).forEach(function (b) {
      ALL_PAIRS.push([a.id, b.id]);
    });
  });

  function hasEdge(edges, u, v) {
    return edges.some(function (e) {
      return (e[0] === u && e[1] === v) || (e[0] === v && e[1] === u);
    });
  }

  var GC_EDGES = ALL_PAIRS.filter(function (p) {
    return !hasEdge(G_EDGES, p[0], p[1]);
  });

  var CLIQUE = ["A", "B", "C"];

  var RED_STEPS = [
    {
      line: "map",
      note: "Same vertex set V. Build complement edges.",
      status: "Reduction map: G ↦ Ḡ (complement).",
      showComplement: false,
      highlight: [],
      phase: "map"
    },
    {
      line: "edges",
      note: "Put {u,v} in Ḡ iff it was <em>not</em> an edge in G.",
      status: "Flip every pair: edges ↔ non-edges.",
      showComplement: true,
      highlight: [],
      phase: "edges"
    },
    {
      line: "clique",
      note: "Highlight clique <strong>{A,B,C}</strong> in G.",
      status: "ABC is a clique of size 3 in G.",
      showComplement: true,
      highlight: CLIQUE,
      side: "g",
      phase: "clique"
    },
    {
      line: "indep",
      note: "Same vertices are an <strong>independent set</strong> in Ḡ.",
      status: "ABC has no Ḡ-edges among them — independent set.",
      showComplement: true,
      highlight: CLIQUE,
      side: "gc",
      phase: "indep"
    },
    {
      line: "equiv",
      note: "G has a k-clique ⇔ Ḡ has a k-independent set.",
      status: "Polynomial reduction preserves yes/no.",
      showComplement: true,
      highlight: CLIQUE,
      side: "both",
      phase: "done"
    }
  ];

  var CODE_LINES = [
    { html: '<span class="code-cm">/* Clique ≤ₚ Independent Set via complement */</span>', id: "sig" },
    { html: '<span class="code-kw">def</span> <span class="code-fn">reduce</span>(G, k):', id: "map" },
    { html: '  Ḡ.V = G.V', id: "map2" },
    { html: '  Ḡ.E = { {u,v} | {u,v} ∉ G.E }', id: "edges" },
    { html: '  <span class="code-kw">return</span> (Ḡ, k)', id: "ret" },
    { html: '<span class="code-cm">/* S clique in G ⇔ S independent in Ḡ */</span>', id: "clique" },
    { html: '<span class="code-cm">/* …same S… */</span>', id: "indep" },
    { html: '<span class="code-cm">/* yes ↔ yes */</span>', id: "equiv" }
  ];

  function initPnp() {
    var mapRoot = document.getElementById("pnp-map");
    var gRoot = document.getElementById("pnp-g");
    var gcRoot = document.getElementById("pnp-gc");
    var hiEl = document.getElementById("pnp-highlight");
    var status = document.getElementById("pnp-status");
    var badge = document.getElementById("pnp-badge");
    var focusEl = document.getElementById("pnp-focus");
    var codeRoot = document.getElementById("pnp-code");
    var codeNote = document.getElementById("pnp-code-note");
    if (!mapRoot || !gRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var redIndex = -1;
    var selectedClass = null;
    var playing = false;
    var playTimer = null;
    var lineEls = {};

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

    function paintMap() {
      mapRoot.innerHTML = "";
      CLASSES.forEach(function (c) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pnp-class";
        btn.dataset.id = c.id;
        btn.setAttribute("role", "listitem");
        btn.innerHTML =
          '<span class="pnp-class-label">' +
          c.label +
          '</span><span class="pnp-class-blurb">' +
          c.blurb +
          "</span>";
        btn.addEventListener("click", function () {
          selectedClass = c.id;
          document.querySelectorAll(".pnp-class").forEach(function (el) {
            el.classList.toggle("is-active", el.dataset.id === c.id);
          });
          if (focusEl) focusEl.textContent = c.label;
          if (badge) {
            badge.textContent = c.label;
            badge.dataset.phase = c.id;
          }
          highlight(null);
          if (codeNote) codeNote.innerHTML = "<strong>" + c.label + "</strong>: " + c.blurb;
          if (status) status.textContent = c.code;
        });
        mapRoot.appendChild(btn);
      });
    }

    function paintGraph(root, edges, highlightIds, pulse) {
      root.innerHTML = "";
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "pnp-edges");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");
      edges.forEach(function (e) {
        var a = NODES.find(function (n) {
          return n.id === e[0];
        });
        var b = NODES.find(function (n) {
          return n.id === e[1];
        });
        if (!a || !b) return;
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", a.x);
        line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x);
        line.setAttribute("y2", b.y);
        var bothHi =
          highlightIds &&
          highlightIds.indexOf(a.id) >= 0 &&
          highlightIds.indexOf(b.id) >= 0;
        line.setAttribute("class", "pnp-edge" + (bothHi ? " is-hi" : ""));
        svg.appendChild(line);
      });
      root.appendChild(svg);
      NODES.forEach(function (n) {
        var el = document.createElement("div");
        var on = highlightIds && highlightIds.indexOf(n.id) >= 0;
        el.className =
          "pnp-node" + (on ? " is-hi" : "") + (on && pulse && !reduceMotion ? " is-pulse" : "");
        el.style.left = n.x + "%";
        el.style.top = n.y + "%";
        el.textContent = n.id;
        root.appendChild(el);
      });
    }

    function applyRed(i) {
      redIndex = i;
      if (i < 0) {
        paintGraph(gRoot, G_EDGES, [], false);
        paintGraph(gcRoot, [], [], false);
        if (hiEl) hiEl.textContent = "Step to build the complement and highlight a clique.";
        highlight("sig");
        if (badge) {
          badge.textContent = "map";
          badge.dataset.phase = "map";
        }
        if (focusEl) focusEl.textContent = "map";
        if (status) status.textContent = "Ready. Step the Clique ↔ Independent Set reduction.";
        if (codeNote) {
          codeNote.innerHTML = "A set is a clique in G iff it is independent in the complement.";
        }
        return;
      }
      var step = RED_STEPS[i];
      var hi = step.highlight || [];
      var side = step.side || "g";
      paintGraph(gRoot, G_EDGES, side === "gc" ? [] : hi, side !== "gc");
      paintGraph(
        gcRoot,
        step.showComplement ? GC_EDGES : [],
        side === "g" ? [] : hi,
        side !== "g"
      );
      highlight(step.line);
      if (hiEl) hiEl.innerHTML = step.note;
      if (badge) {
        badge.textContent = step.phase;
        badge.dataset.phase = step.phase;
      }
      if (focusEl) focusEl.textContent = "reduction";
      if (status) status.textContent = step.status;
      if (codeNote) codeNote.innerHTML = step.note;
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearInterval(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-pnp-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (redIndex >= RED_STEPS.length - 1) {
        stopPlay();
        return;
      }
      applyRed(redIndex + 1);
      if (redIndex >= RED_STEPS.length - 1) stopPlay();
    }

    function togglePlay() {
      if (playing) {
        stopPlay();
        return;
      }
      if (redIndex >= RED_STEPS.length - 1) applyRed(-1);
      playing = true;
      var playBtn = document.querySelector('[data-pnp-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";
      playTimer = window.setInterval(stepOnce, reduceMotion ? 250 : 800);
    }

    renderCode();
    paintMap();
    applyRed(-1);

    document.querySelectorAll("[data-pnp-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-pnp-action");
        if (action === "step") stepOnce();
        else if (action === "play") togglePlay();
        else if (action === "reset") {
          stopPlay();
          applyRed(-1);
          document.querySelectorAll(".pnp-class").forEach(function (el) {
            el.classList.remove("is-active");
          });
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPnp);
  } else {
    initPnp();
  }
})();
