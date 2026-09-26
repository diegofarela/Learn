/**
 * Commit DAG walk with branch / merge highlighting.
 */
(function () {
  // A -- B -- D -- F (merge)
  //       \      /
  //        C -- E   (feature)
  var NODES = [
    { id: "A", x: 50, y: 100, msg: "init" },
    { id: "B", x: 130, y: 100, msg: "main: scaffold" },
    { id: "C", x: 210, y: 160, msg: "feature: start" },
    { id: "D", x: 210, y: 100, msg: "main: docs" },
    { id: "E", x: 290, y: 160, msg: "feature: done" },
    { id: "F", x: 370, y: 100, msg: "merge feature" }
  ];

  var EDGES = [
    ["A", "B"],
    ["B", "D"],
    ["B", "C"],
    ["D", "F"],
    ["C", "E"],
    ["E", "F"]
  ];

  var STEPS = [
    { focus: null, branch: null, note: "Ready — press Step to walk commits from root to merge.", log: ["# git log --graph --oneline"] },
    { focus: "A", branch: "main", note: "Root commit A — history begins.", log: ["* A  init"] },
    { focus: "B", branch: "main", note: "B on main — linear history so far.", log: ["* B  main: scaffold", "* A  init"] },
    { focus: "C", branch: "feature", note: "Branch feature at C — diverges from B.", log: ["| * C  feature: start", "* | B  …", "|/"] },
    { focus: "D", branch: "main", note: "D continues on main while feature advances.", log: ["* D  main: docs", "| * C  …"] },
    { focus: "E", branch: "feature", note: "E is the feature tip — ready to merge.", log: ["| * E  feature: done", "* | D  …"] },
    { focus: "F", branch: "main", merge: true, note: "Merge commit F joins main and feature (two parents).", log: ["*   F  merge feature", "|\\", "| * E", "* | D"] }
  ];

  function initVc() {
    var svg = document.getElementById("vc-svg");
    var status = document.getElementById("vc-status");
    var meta = document.getElementById("vc-meta");
    var phase = document.getElementById("vc-phase");
    var codeRoot = document.getElementById("vc-code");
    var codeNote = document.getElementById("vc-code-note");
    if (!svg) return;

    var step = 0;
    var playTimer = null;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var byId = {};
    NODES.forEach(function (n) {
      byId[n.id] = n;
    });

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function draw(s) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      // labels for branches
      var mainLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      mainLabel.setAttribute("x", "420");
      mainLabel.setAttribute("y", "104");
      mainLabel.setAttribute("class", "vc-ref" + (s.branch === "main" ? " is-active" : ""));
      mainLabel.textContent = "main";
      svg.appendChild(mainLabel);

      var featLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      featLabel.setAttribute("x", "320");
      featLabel.setAttribute("y", "164");
      featLabel.setAttribute("class", "vc-ref" + (s.branch === "feature" ? " is-active" : ""));
      featLabel.textContent = "feature";
      svg.appendChild(featLabel);

      EDGES.forEach(function (e) {
        var a = byId[e[0]];
        var b = byId[e[1]];
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", a.x);
        line.setAttribute("y1", a.y);
        line.setAttribute("x2", b.x);
        line.setAttribute("y2", b.y);
        var isMergeEdge = s.merge && (e[1] === "F");
        line.setAttribute(
          "class",
          "vc-edge" + (isMergeEdge ? " is-merge" : "")
        );
        svg.appendChild(line);
      });

      NODES.forEach(function (n) {
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", "translate(" + n.x + "," + n.y + ")");
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "16");
        var cls = "vc-node";
        if (s.focus === n.id) cls += " is-focus";
        if (s.merge && n.id === "F") cls += " is-merge";
        circle.setAttribute("class", cls);
        var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dy", "0.35em");
        text.setAttribute("class", "vc-node-label");
        text.textContent = n.id;
        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
      });
    }

    function renderCode(s) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      (s.log || []).forEach(function (line) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.textContent = line;
        codeRoot.appendChild(row);
      });
    }

    function apply(s) {
      setStatus(s.note);
      if (meta) meta.textContent = s.focus || "—";
      if (phase) phase.textContent = s.branch || "history";
      draw(s);
      renderCode(s);
      if (codeNote) {
        codeNote.textContent = s.merge
          ? "Merge commit: two parents, one join point."
          : "Branches are pointers; commits are immutable nodes.";
      }
    }

    function go(n) {
      step = Math.max(0, Math.min(n, STEPS.length - 1));
      apply(STEPS[step]);
    }

    function onStep() {
      if (step >= STEPS.length - 1) {
        clearPlay();
        return;
      }
      go(step + 1);
    }

    document.querySelectorAll("[data-vc-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-vc-action");
        if (a === "step") {
          clearPlay();
          onStep();
        } else if (a === "play") {
          clearPlay();
          if (step >= STEPS.length - 1) go(0);
          function tick() {
            if (step >= STEPS.length - 1) {
              clearPlay();
              return;
            }
            onStep();
            playTimer = window.setTimeout(tick, reduceMotion ? 0 : 700);
          }
          tick();
        } else if (a === "reset") {
          clearPlay();
          go(0);
        }
      });
    });

    go(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVc);
  } else {
    initVc();
  }
})();
