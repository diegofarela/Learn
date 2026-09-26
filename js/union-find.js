/**
 * Interactive union-find (disjoint-set forest) with C highlighter.
 */
(function () {
  var N = 6;

  var CODE_LINES = [
    { html: '<span class="code-type">int</span> parent[N], rankv[N];' },
    { blank: true },
    { html: '<span class="code-type">int</span> <span class="code-fn">find</span>(<span class="code-type">int</span> x) {', id: "f-sig" },
    { html: '  <span class="code-kw">while</span> (parent[x] != x)', id: "f-loop" },
    { html: '    x = parent[x]; <span class="code-cm">/* climb to root */</span>', id: "f-climb" },
    { html: '  <span class="code-kw">return</span> x;', id: "f-ret" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">unite</span>(<span class="code-type">int</span> a, <span class="code-type">int</span> b) {', id: "u-sig" },
    { html: '  a = find(a); b = find(b);', id: "u-find" },
    { html: '  <span class="code-kw">if</span> (a == b) <span class="code-kw">return</span>;', id: "u-same" },
    { html: '  <span class="code-kw">if</span> (rankv[a] &lt; rankv[b]) parent[a] = b;', id: "u-link-a" },
    { html: '  <span class="code-kw">else if</span> (rankv[b] &lt; rankv[a]) parent[b] = a;', id: "u-link-b" },
    { html: '  <span class="code-kw">else</span> { parent[b] = a; rankv[a]++; }', id: "u-tie" },
    { html: '}' }
  ];

  var COLORS = ["#3d8ea0", "#c4784a", "#6a8f4e", "#8b6bb5", "#c45c6a", "#4a7ab5"];

  function initUf() {
    var nodesEl = document.getElementById("uf-nodes");
    var edgesEl = document.getElementById("uf-edges");
    var stage = document.querySelector(".uf-stage");
    var parentsEl = document.getElementById("uf-parents");
    var status = document.getElementById("uf-status");
    var setsEl = document.getElementById("uf-sets");
    var nEl = document.getElementById("uf-n");
    var codeRoot = document.getElementById("uf-code");
    var codeNote = document.getElementById("uf-code-note");
    var inputA = document.getElementById("uf-a");
    var inputB = document.getElementById("uf-b");
    if (!nodesEl || !edgesEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};
    var parent = [];
    var rankv = [];
    var highlightPath = [];
    var activeRoot = null;
    var linkPair = null;

    function seed() {
      parent = [];
      rankv = [];
      for (var i = 0; i < N; i++) {
        parent[i] = i;
        rankv[i] = 0;
      }
      /* Seed: {0,1} and {2,3} merged */
      parent[1] = 0;
      rankv[0] = 1;
      parent[3] = 2;
      rankv[2] = 1;
      highlightPath = [];
      activeRoot = null;
      linkPair = null;
    }

    function findRoot(x) {
      while (parent[x] !== x) x = parent[x];
      return x;
    }

    function countSets() {
      var n = 0;
      for (var i = 0; i < N; i++) if (parent[i] === i) n += 1;
      return n;
    }

    function readVal(input) {
      if (!input) return NaN;
      var n = parseInt(input.value, 10);
      if (isNaN(n) || n < 0 || n >= N) return NaN;
      input.value = String(n);
      return n;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
      if (setsEl) setsEl.textContent = String(countSets());
      if (nEl) nEl.textContent = String(N);
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function clearStepTimers() {
      stepTimers.forEach(function (id) {
        window.clearTimeout(id);
      });
      stepTimers = [];
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

    function highlight(id, dimOthers) {
      Object.keys(lineEls).forEach(function (key) {
        var el = lineEls[key];
        el.classList.toggle("is-active", key === id);
        el.classList.toggle("is-dim", Boolean(dimOthers) && key !== id);
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

    function clearHighlight() {
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
    }

    function paint() {
      var stageW = stage ? stage.clientWidth : 420;
      var stageH = stage ? stage.clientHeight : 220;
      var padX = 36;
      var usableW = Math.max(120, stageW - padX * 2);
      var y = stageH * 0.55;

      var pos = [];
      for (var i = 0; i < N; i++) {
        pos[i] = {
          x: padX + ((i + 0.5) / N) * usableW,
          y: y
        };
      }

      /* Lift roots slightly for visual hierarchy */
      for (var r = 0; r < N; r++) {
        if (parent[r] === r) pos[r].y = stageH * 0.32;
      }
      for (var c = 0; c < N; c++) {
        if (parent[c] !== c) {
          var depth = 0;
          var x = c;
          while (parent[x] !== x && depth < 4) {
            x = parent[x];
            depth += 1;
          }
          pos[c].y = stageH * (0.32 + 0.22 * Math.min(depth, 2));
        }
      }

      edgesEl.setAttribute("viewBox", "0 0 " + stageW + " " + stageH);
      edgesEl.setAttribute("width", String(stageW));
      edgesEl.setAttribute("height", String(stageH));
      edgesEl.innerHTML = "";

      for (var e = 0; e < N; e++) {
        if (parent[e] === e) continue;
        var from = pos[e];
        var to = pos[parent[e]];
        var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(from.x));
        line.setAttribute("y1", String(from.y));
        line.setAttribute("x2", String(to.x));
        line.setAttribute("y2", String(to.y));
        var onPath =
          highlightPath.indexOf(e) !== -1 &&
          highlightPath.indexOf(parent[e]) !== -1;
        var isLink =
          linkPair &&
          ((linkPair[0] === e && linkPair[1] === parent[e]) ||
            (linkPair[1] === e && linkPair[0] === parent[e]));
        line.setAttribute(
          "class",
          "uf-edge" + (onPath || isLink ? " is-active" : "")
        );
        edgesEl.appendChild(line);

        /* arrow tip */
        var tip = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        tip.setAttribute("cx", String(to.x));
        tip.setAttribute("cy", String(to.y));
        tip.setAttribute("r", "3");
        tip.setAttribute("class", "uf-arrow-dot");
        edgesEl.appendChild(tip);
      }

      nodesEl.innerHTML = "";
      for (var n = 0; n < N; n++) {
        var root = findRoot(n);
        var el = document.createElement("div");
        el.className = "uf-node";
        if (parent[n] === n) el.classList.add("is-root");
        if (highlightPath.indexOf(n) !== -1) el.classList.add("is-path");
        if (activeRoot === n) el.classList.add("is-found");
        el.style.left = pos[n].x + "px";
        el.style.top = pos[n].y + "px";
        el.style.setProperty("--uf-tone", COLORS[root % COLORS.length]);
        el.textContent = String(n);
        el.setAttribute(
          "aria-label",
          "Element " + n + ", parent " + parent[n] + ", set root " + root
        );
        nodesEl.appendChild(el);
      }

      if (parentsEl) {
        var parts = [];
        for (var p = 0; p < N; p++) {
          parts.push("p[" + p + "]=" + parent[p]);
        }
        parentsEl.textContent = parts.join("  ·  ");
      }
    }

    function runSteps(steps, onDone) {
      clearStepTimers();
      var delay = reduceMotion ? 0 : 420;
      steps.forEach(function (step, i) {
        var tid = window.setTimeout(function () {
          try {
            highlight(step.line, true);
            if (step.note) setCodeNote(step.note);
            if (step.apply) step.apply();
            paint();
            if (step.status) setStatus(step.status);
            if (i === steps.length - 1 && onDone) onDone();
          } catch (err) {
            console.error("[learn-uf] Step failed", { step: step, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(tid);
      });
    }

    function doFind() {
      if (busy) return;
      var a = readVal(inputA);
      if (isNaN(a)) {
        setStatus("Enter a in 0–" + (N - 1) + ".");
        return;
      }

      busy = true;
      highlightPath = [a];
      activeRoot = null;
      linkPair = null;
      var x = a;
      var steps = [
        {
          line: "f-sig",
          note: "Enter <strong>find(" + a + ")</strong>.",
          apply: function () {
            highlightPath = [a];
          }
        }
      ];

      while (parent[x] !== x) {
        (function (cur, next) {
          steps.push({
            line: "f-loop",
            note: "parent[" + cur + "] = " + next + " ≠ " + cur + " — keep climbing.",
            apply: function () {
              if (highlightPath.indexOf(next) === -1) highlightPath.push(next);
            }
          });
          steps.push({
            line: "f-climb",
            note: "Move to parent <strong>" + next + "</strong>.",
            apply: function () {
              if (highlightPath.indexOf(next) === -1) highlightPath.push(next);
            }
          });
        })(x, parent[x]);
        x = parent[x];
      }

      var root = x;
      steps.push({
        line: "f-loop",
        note: "parent[" + root + "] == " + root + " — stop.",
        apply: function () {
          if (highlightPath.indexOf(root) === -1) highlightPath.push(root);
        }
      });
      steps.push({
        line: "f-ret",
        note: "Return root <strong>" + root + "</strong>.",
        apply: function () {
          activeRoot = root;
        },
        status: "Find(" + a + ") → root " + root + "."
      });

      runSteps(steps, function () {
        busy = false;
      });
    }

    function doUnion() {
      if (busy) return;
      var a = readVal(inputA);
      var b = readVal(inputB);
      if (isNaN(a) || isNaN(b)) {
        setStatus("Enter a and b in 0–" + (N - 1) + ".");
        return;
      }

      busy = true;
      highlightPath = [];
      activeRoot = null;
      linkPair = null;

      var ra = findRoot(a);
      var rb = findRoot(b);

      var steps = [
        {
          line: "u-sig",
          note: "Enter <strong>unite(" + a + ", " + b + ")</strong>."
        },
        {
          line: "u-find",
          note:
            "find(" +
            a +
            ") = <strong>" +
            ra +
            "</strong>, find(" +
            b +
            ") = <strong>" +
            rb +
            "</strong>.",
          apply: function () {
            highlightPath = [a, ra, b, rb].filter(function (v, i, arr) {
              return arr.indexOf(v) === i;
            });
            activeRoot = null;
          }
        }
      ];

      if (ra === rb) {
        steps.push({
          line: "u-same",
          note: "Same root — already united.",
          apply: function () {
            activeRoot = ra;
          },
          status: a + " and " + b + " already in the same set (root " + ra + ")."
        });
      } else if (rankv[ra] < rankv[rb]) {
        steps.push({
          line: "u-same",
          note: "Different roots — link by rank."
        });
        steps.push({
          line: "u-link-a",
          note:
            "rank[" +
            ra +
            "] &lt; rank[" +
            rb +
            "] — parent[" +
            ra +
            "] = " +
            rb +
            ".",
          apply: function () {
            parent[ra] = rb;
            linkPair = [ra, rb];
            activeRoot = rb;
            highlightPath = [ra, rb];
          },
          status: "United sets of " + a + " and " + b + " under root " + rb + "."
        });
      } else if (rankv[rb] < rankv[ra]) {
        steps.push({
          line: "u-same",
          note: "Different roots — link by rank."
        });
        steps.push({
          line: "u-link-b",
          note:
            "rank[" +
            rb +
            "] &lt; rank[" +
            ra +
            "] — parent[" +
            rb +
            "] = " +
            ra +
            ".",
          apply: function () {
            parent[rb] = ra;
            linkPair = [rb, ra];
            activeRoot = ra;
            highlightPath = [ra, rb];
          },
          status: "United sets of " + a + " and " + b + " under root " + ra + "."
        });
      } else {
        steps.push({
          line: "u-same",
          note: "Different roots — ranks tie."
        });
        steps.push({
          line: "u-tie",
          note:
            "Tie: parent[" +
            rb +
            "] = " +
            ra +
            ", rank[" +
            ra +
            "]++.",
          apply: function () {
            parent[rb] = ra;
            rankv[ra] += 1;
            linkPair = [rb, ra];
            activeRoot = ra;
            highlightPath = [ra, rb];
          },
          status: "United sets of " + a + " and " + b + " under root " + ra + "."
        });
      }

      runSteps(steps, function () {
        busy = false;
        linkPair = null;
        paint();
      });
    }

    function reset() {
      if (busy) return;
      clearStepTimers();
      seed();
      paint();
      clearHighlight();
      setStatus("Reset — sets {0,1}, {2,3}, {4}, {5}.");
      setCodeNote(
        "Press <strong>Union</strong> or <strong>Find</strong> — parent walks and rank links light up in the C code."
      );
      if (inputA) inputA.value = "1";
      if (inputB) inputB.value = "4";
    }

    document.querySelectorAll("[data-uf-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-uf-action");
        if (action === "union") doUnion();
        else if (action === "find") doFind();
        else if (action === "reset") reset();
      });
    });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        try {
          paint();
        } catch (err) {
          console.warn("[learn-uf] Repaint on resize failed", err);
        }
      }, 80);
    });

    renderCode();
    seed();
    paint();
    clearHighlight();
    setStatus("Seeded forest. Union two elements or Find a root.");
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        try {
          paint();
        } catch (err) {
          console.warn("[learn-uf] Initial layout pass failed", err);
        }
      });
    }
  }

  try {
    initUf();
  } catch (err) {
    console.error("[learn-uf] Init failed", err);
  }
})();
