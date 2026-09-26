/**
 * Interactive CFG: leftmost derivation of ()() with parse tree.
 */
(function () {
  /*
   * Grammar: S → ( S ) S | ε
   * Target: ()()
   * Leftmost derivation:
   *   S
   * → ( S ) S
   * → ( ε ) S          = () S
   * → () ( S ) S
   * → () ( ε ) S       = ()() S
   * → ()() ε           = ()()
   */
  var STEPS = [
    {
      sentential: "S",
      rule: null,
      line: "start",
      note: "Start symbol <strong>S</strong>.",
      status: "Sentential form: S.",
      tree: [{ id: "n0", label: "S", x: 50, y: 12, parent: null }]
    },
    {
      sentential: "( S ) S",
      rule: "S → ( S ) S",
      line: "expand",
      note: "Expand leftmost S with <strong>( S ) S</strong>.",
      status: "Apply S → ( S ) S.",
      tree: [
        { id: "n0", label: "S", x: 50, y: 10, parent: null },
        { id: "n1", label: "(", x: 18, y: 42, parent: "n0", term: true },
        { id: "n2", label: "S", x: 38, y: 42, parent: "n0" },
        { id: "n3", label: ")", x: 58, y: 42, parent: "n0", term: true },
        { id: "n4", label: "S", x: 78, y: 42, parent: "n0" }
      ]
    },
    {
      sentential: "( ε ) S",
      rule: "S → ε",
      line: "eps",
      note: "Innermost S → <strong>ε</strong> (empty).",
      status: "First pair closes: () S.",
      tree: [
        { id: "n0", label: "S", x: 50, y: 10, parent: null },
        { id: "n1", label: "(", x: 18, y: 42, parent: "n0", term: true },
        { id: "n2", label: "S", x: 38, y: 42, parent: "n0" },
        { id: "n2e", label: "ε", x: 38, y: 72, parent: "n2", term: true },
        { id: "n3", label: ")", x: 58, y: 42, parent: "n0", term: true },
        { id: "n4", label: "S", x: 78, y: 42, parent: "n0" }
      ]
    },
    {
      sentential: "() ( S ) S",
      rule: "S → ( S ) S",
      line: "expand",
      note: "Right S expands to another pair.",
      status: "Apply S → ( S ) S on the remaining S.",
      tree: [
        { id: "n0", label: "S", x: 50, y: 8, parent: null },
        { id: "n1", label: "(", x: 12, y: 36, parent: "n0", term: true },
        { id: "n2", label: "S", x: 28, y: 36, parent: "n0" },
        { id: "n2e", label: "ε", x: 28, y: 62, parent: "n2", term: true },
        { id: "n3", label: ")", x: 44, y: 36, parent: "n0", term: true },
        { id: "n4", label: "S", x: 72, y: 36, parent: "n0" },
        { id: "n5", label: "(", x: 58, y: 62, parent: "n4", term: true },
        { id: "n6", label: "S", x: 72, y: 62, parent: "n4" },
        { id: "n7", label: ")", x: 86, y: 62, parent: "n4", term: true },
        { id: "n8", label: "S", x: 98, y: 62, parent: "n4" }
      ]
    },
    {
      sentential: "() ( ε ) S",
      rule: "S → ε",
      line: "eps",
      note: "Inner S of second pair → ε.",
      status: "Second pair closes: ()() S.",
      tree: [
        { id: "n0", label: "S", x: 50, y: 8, parent: null },
        { id: "n1", label: "(", x: 12, y: 32, parent: "n0", term: true },
        { id: "n2", label: "S", x: 26, y: 32, parent: "n0" },
        { id: "n2e", label: "ε", x: 26, y: 56, parent: "n2", term: true },
        { id: "n3", label: ")", x: 40, y: 32, parent: "n0", term: true },
        { id: "n4", label: "S", x: 70, y: 32, parent: "n0" },
        { id: "n5", label: "(", x: 54, y: 56, parent: "n4", term: true },
        { id: "n6", label: "S", x: 68, y: 56, parent: "n4" },
        { id: "n6e", label: "ε", x: 68, y: 78, parent: "n6", term: true },
        { id: "n7", label: ")", x: 82, y: 56, parent: "n4", term: true },
        { id: "n8", label: "S", x: 96, y: 56, parent: "n4" }
      ]
    },
    {
      sentential: "()()",
      rule: "S → ε",
      line: "done",
      note: "Trailing S → ε. Yield: <strong>()()</strong>.",
      status: "Derivation complete — yield ()().",
      tree: [
        { id: "n0", label: "S", x: 50, y: 8, parent: null },
        { id: "n1", label: "(", x: 12, y: 32, parent: "n0", term: true },
        { id: "n2", label: "S", x: 26, y: 32, parent: "n0" },
        { id: "n2e", label: "ε", x: 26, y: 56, parent: "n2", term: true },
        { id: "n3", label: ")", x: 40, y: 32, parent: "n0", term: true },
        { id: "n4", label: "S", x: 70, y: 32, parent: "n0" },
        { id: "n5", label: "(", x: 54, y: 56, parent: "n4", term: true },
        { id: "n6", label: "S", x: 68, y: 56, parent: "n4" },
        { id: "n6e", label: "ε", x: 68, y: 78, parent: "n6", term: true },
        { id: "n7", label: ")", x: 82, y: 56, parent: "n4", term: true },
        { id: "n8", label: "S", x: 96, y: 56, parent: "n4" },
        { id: "n8e", label: "ε", x: 96, y: 78, parent: "n8", term: true }
      ]
    }
  ];

  var CODE_LINES = [
    { html: '<span class="code-cm">/* balanced parens CFG */</span>', id: "sig" },
    { html: 'S → ( S ) S  |  ε', id: "start" },
    { html: '<span class="code-kw">while</span> leftmost nonterminal exists {', id: "loop" },
    { html: '  replace it by a production RHS;', id: "expand" },
    { html: '  <span class="code-cm">/* or erase with ε */</span>', id: "eps" },
    { html: '}' },
    { html: '<span class="code-cm">/* yield = all terminals */</span>', id: "done" }
  ];

  function initCfg() {
    var treeRoot = document.getElementById("cfg-tree");
    var sentEl = document.getElementById("cfg-sentential");
    var status = document.getElementById("cfg-status");
    var badge = document.getElementById("cfg-badge");
    var stepEl = document.getElementById("cfg-step");
    var totalEl = document.getElementById("cfg-total");
    var codeRoot = document.getElementById("cfg-code");
    var codeNote = document.getElementById("cfg-code-note");
    if (!treeRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var index = 0;
    var playing = false;
    var playTimer = null;
    var lineEls = {};

    if (totalEl) totalEl.textContent = String(STEPS.length - 1);

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

    function paintTree(nodes) {
      treeRoot.innerHTML = "";
      var byId = {};
      nodes.forEach(function (n) {
        byId[n.id] = n;
      });
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "cfg-tree-edges");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");
      nodes.forEach(function (n) {
        if (!n.parent || !byId[n.parent]) return;
        var p = byId[n.parent];
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", p.x);
        line.setAttribute("y1", p.y);
        line.setAttribute("x2", n.x);
        line.setAttribute("y2", n.y);
        line.setAttribute("class", "cfg-edge");
        svg.appendChild(line);
      });
      treeRoot.appendChild(svg);

      nodes.forEach(function (n) {
        var el = document.createElement("div");
        el.className = "cfg-node" + (n.term ? " is-term" : " is-nt");
        if (!reduceMotion && index === STEPS.length - 1 && n.term && n.label !== "ε") {
          el.classList.add("is-pulse");
        }
        el.style.left = n.x + "%";
        el.style.top = n.y + "%";
        el.textContent = n.label;
        treeRoot.appendChild(el);
      });
    }

    function apply(i) {
      var step = STEPS[i];
      index = i;
      if (stepEl) stepEl.textContent = String(i);
      if (sentEl) {
        sentEl.innerHTML = step.sentential
          .replace(/S/g, '<span class="cfg-nt">S</span>')
          .replace(/ε/g, '<span class="cfg-eps">ε</span>');
      }
      paintTree(step.tree);
      highlight(step.line);
      if (badge) {
        badge.textContent = i === 0 ? "ready" : i === STEPS.length - 1 ? "yield" : "derive";
        badge.dataset.phase = badge.textContent;
      }
      if (codeNote) {
        codeNote.innerHTML = step.note + (step.rule ? " <code>" + step.rule + "</code>" : "");
      }
      if (status) status.textContent = step.status;
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearInterval(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-cfg-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (index >= STEPS.length - 1) {
        stopPlay();
        return;
      }
      apply(index + 1);
      if (index >= STEPS.length - 1) stopPlay();
    }

    function togglePlay() {
      if (playing) {
        stopPlay();
        return;
      }
      if (index >= STEPS.length - 1) apply(0);
      playing = true;
      var playBtn = document.querySelector('[data-cfg-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";
      playTimer = window.setInterval(
        stepOnce,
        reduceMotion ? 200 : 700
      );
    }

    renderCode();
    apply(0);

    document.querySelectorAll("[data-cfg-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-cfg-action");
        if (action === "step") stepOnce();
        else if (action === "play") togglePlay();
        else if (action === "reset") {
          stopPlay();
          apply(0);
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCfg);
  } else {
    initCfg();
  }
})();
