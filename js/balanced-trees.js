/**
 * Interactive AVL demo: insert skewing sequence, step left rotation.
 */
(function () {
  var SEQUENCE = [10, 20, 30];

  var CODE_LINES = [
    { html: '<span class="code-kw">typedef struct</span> Node {' },
    { html: '  <span class="code-type">int</span> key, height;' },
    { html: '  Node *left, *right;' },
    { html: '} Node;' },
    { blank: true },
    { html: '<span class="code-type">int</span> <span class="code-fn">bf</span>(Node *n) { <span class="code-cm">/* balance factor */</span>', id: "bf-sig" },
    { html: '  <span class="code-kw">return</span> h(n-&gt;left) - h(n-&gt;right);', id: "bf-ret" },
    { html: '}' },
    { blank: true },
    { html: 'Node *<span class="code-fn">rotateLeft</span>(Node *x) {', id: "rl-sig" },
    { html: '  Node *y = x-&gt;right;', id: "rl-y" },
    { html: '  x-&gt;right = y-&gt;left;', id: "rl-move" },
    { html: '  y-&gt;left = x;', id: "rl-pivot" },
    { html: '  update(x); update(y);', id: "rl-upd" },
    { html: '  <span class="code-kw">return</span> y;', id: "rl-ret" },
    { html: '}' },
    { blank: true },
    { html: 'Node *<span class="code-fn">insert</span>(Node *n, <span class="code-type">int</span> k) {', id: "i-sig" },
    { html: '  <span class="code-kw">if</span> (!n) <span class="code-kw">return</span> make(k);', id: "i-null" },
    { html: '  <span class="code-kw">if</span> (k &lt; n-&gt;key) n-&gt;left = insert(n-&gt;left, k);', id: "i-left" },
    { html: '  <span class="code-kw">else if</span> (k &gt; n-&gt;key) n-&gt;right = insert(n-&gt;right, k);', id: "i-right" },
    { html: '  update(n);', id: "i-upd" },
    { html: '  <span class="code-kw">if</span> (bf(n) &lt; -<span class="code-num">1</span>) <span class="code-kw">return</span> rotateLeft(n);', id: "i-check" },
    { html: '  <span class="code-kw">return</span> n;', id: "i-ret" },
    { html: '}' }
  ];

  function initAvl() {
    var nodesEl = document.getElementById("avl-nodes");
    var edgesEl = document.getElementById("avl-edges");
    var stage = document.querySelector(".avl-stage");
    var status = document.getElementById("avl-status");
    var heightEl = document.getElementById("avl-height");
    var nextEl = document.getElementById("avl-next");
    var phaseEl = document.getElementById("avl-phase");
    var codeRoot = document.getElementById("avl-code");
    var codeNote = document.getElementById("avl-code-note");
    var rotateBtn = document.getElementById("avl-rotate-btn");
    if (!nodesEl || !edgesEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};
    var idSeq = 1;
    var root = null;
    var seqIndex = 0;
    var pendingRotation = null;
    var pathIds = [];
    var pivotId = null;
    var newId = null;
    var unbalancedId = null;

    function makeNode(key) {
      return {
        id: idSeq++,
        key: key,
        left: null,
        right: null,
        height: 0
      };
    }

    function heightOf(n) {
      return n ? n.height : -1;
    }

    function updateHeight(n) {
      if (!n) return;
      n.height = 1 + Math.max(heightOf(n.left), heightOf(n.right));
    }

    function balanceFactor(n) {
      if (!n) return 0;
      return heightOf(n.left) - heightOf(n.right);
    }

    function treeHeight(n) {
      return heightOf(n);
    }

    function seed() {
      idSeq = 1;
      root = null;
      seqIndex = 0;
      pendingRotation = null;
      pathIds = [];
      pivotId = null;
      newId = null;
      unbalancedId = null;
      setRotateEnabled(false);
      setPhase("Ready");
    }

    function setRotateEnabled(on) {
      if (rotateBtn) rotateBtn.disabled = !on;
    }

    function setPhase(text) {
      if (phaseEl) phaseEl.textContent = text;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
      if (heightEl) heightEl.textContent = String(Math.max(0, treeHeight(root)));
      if (nextEl) {
        nextEl.textContent =
          seqIndex < SEQUENCE.length ? String(SEQUENCE[seqIndex]) : "—";
      }
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

    function layout(node, depth, left, right, positions) {
      if (!node) return;
      positions[node.id] = { x: (left + right) / 2, y: depth, node: node };
      layout(node.left, depth + 1, left, (left + right) / 2, positions);
      layout(node.right, depth + 1, (left + right) / 2, right, positions);
    }

    function paint() {
      var positions = {};
      if (root) layout(root, 0, 0, 1, positions);

      var stageW = stage ? stage.clientWidth : 400;
      var stageH = stage ? stage.clientHeight : 260;
      var padX = 36;
      var padY = 28;
      var usableW = Math.max(120, stageW - padX * 2);
      var usableH = Math.max(100, stageH - padY * 2);
      var h = Math.max(0, treeHeight(root));
      var levelGap = h > 0 ? usableH / h : 0;

      function px(pos) {
        return {
          x: padX + pos.x * usableW,
          y: padY + (h > 0 ? pos.y * levelGap : usableH / 2)
        };
      }

      edgesEl.setAttribute("viewBox", "0 0 " + stageW + " " + stageH);
      edgesEl.setAttribute("width", String(stageW));
      edgesEl.setAttribute("height", String(stageH));
      edgesEl.innerHTML = "";

      Object.keys(positions).forEach(function (idStr) {
        var pos = positions[idStr];
        var node = pos.node;
        var from = px(pos);
        [
          ["left", node.left],
          ["right", node.right]
        ].forEach(function (pair) {
          var child = pair[1];
          if (!child || !positions[child.id]) return;
          var to = px(positions[child.id]);
          var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", String(from.x));
          line.setAttribute("y1", String(from.y));
          line.setAttribute("x2", String(to.x));
          line.setAttribute("y2", String(to.y));
          var onPath =
            pathIds.indexOf(node.id) !== -1 && pathIds.indexOf(child.id) !== -1;
          line.setAttribute("class", "avl-edge" + (onPath ? " is-path" : ""));
          edgesEl.appendChild(line);
        });
      });

      nodesEl.innerHTML = "";
      if (!root) {
        var empty = document.createElement("div");
        empty.className = "avl-empty";
        empty.textContent = "(empty)";
        nodesEl.appendChild(empty);
        return;
      }

      Object.keys(positions).forEach(function (idStr) {
        var pos = positions[idStr];
        var node = pos.node;
        var p = px(pos);
        var bf = balanceFactor(node);
        var el = document.createElement("div");
        el.className = "avl-node";
        if (pathIds.indexOf(node.id) !== -1) el.classList.add("is-path");
        if (newId === node.id) el.classList.add("is-new");
        if (pivotId === node.id) el.classList.add("is-pivot");
        if (unbalancedId === node.id) el.classList.add("is-unbalanced");
        if (Math.abs(bf) > 1) el.classList.add("is-unbalanced");
        el.innerHTML =
          '<span class="avl-key">' +
          node.key +
          '</span><span class="avl-bf">bf ' +
          bf +
          "</span>";
        el.style.left = p.x + "px";
        el.style.top = p.y + "px";
        el.setAttribute(
          "aria-label",
          "Key " + node.key + ", balance factor " + bf
        );
        nodesEl.appendChild(el);
      });
    }

    function runSteps(steps, onDone) {
      clearStepTimers();
      var delay = reduceMotion ? 0 : 400;
      steps.forEach(function (step, i) {
        var tid = window.setTimeout(function () {
          try {
            highlight(step.line, true);
            if (step.note) setCodeNote(step.note);
            if (step.apply) step.apply();
            paint();
            if (step.status) setStatus(step.status);
            if (step.phase) setPhase(step.phase);
            if (i === steps.length - 1 && onDone) onDone();
          } catch (err) {
            console.error("[learn-avl] Step failed", { step: step, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(tid);
      });
    }

    function insertBstOnly(key) {
      if (!root) {
        root = makeNode(key);
        newId = root.id;
        pathIds = [root.id];
        updateHeight(root);
        return root;
      }
      var cur = root;
      pathIds = [root.id];
      while (cur) {
        if (key === cur.key) return cur;
        if (key < cur.key) {
          if (!cur.left) {
            cur.left = makeNode(key);
            newId = cur.left.id;
            pathIds.push(cur.left.id);
            updateHeightsUp();
            return cur.left;
          }
          cur = cur.left;
        } else {
          if (!cur.right) {
            cur.right = makeNode(key);
            newId = cur.right.id;
            pathIds.push(cur.right.id);
            updateHeightsUp();
            return cur.right;
          }
          cur = cur.right;
        }
        pathIds.push(cur.id);
      }
      return null;
    }

    function updateHeightsUp() {
      function walk(n) {
        if (!n) return;
        walk(n.left);
        walk(n.right);
        updateHeight(n);
      }
      walk(root);
    }

    function findUnbalanced() {
      var found = null;
      function walk(n) {
        if (!n) return;
        walk(n.left);
        walk(n.right);
        if (Math.abs(balanceFactor(n)) > 1) found = n;
      }
      walk(root);
      return found;
    }

    function doInsertNext() {
      if (busy) return;
      if (pendingRotation) {
        setStatus("Tree is unbalanced — press Step rotation first.");
        return;
      }
      if (seqIndex >= SEQUENCE.length) {
        setStatus("Sequence done. Reset to replay 10 → 20 → 30.");
        return;
      }

      busy = true;
      var key = SEQUENCE[seqIndex];
      pathIds = [];
      newId = null;
      unbalancedId = null;
      pivotId = null;

      var steps = [
        {
          line: "i-sig",
          note: "Enter <strong>insert</strong> with key <strong>" + key + "</strong>.",
          phase: "Inserting " + key,
          status: "Inserting " + key + "…"
        }
      ];

      if (!root) {
        steps.push({
          line: "i-null",
          note: "Empty tree — <strong>make(" + key + ")</strong>.",
          apply: function () {
            insertBstOnly(key);
          }
        });
      } else {
        steps.push({
          line: "i-null",
          note: "Tree not empty — walk for a slot."
        });
        steps.push({
          line: key > (root ? root.key : 0) || seqIndex > 0 ? "i-right" : "i-left",
          note: "BST walk toward the insertion point.",
          apply: function () {
            insertBstOnly(key);
          }
        });
      }

      steps.push({
        line: "i-upd",
        note: "Update heights along the path.",
        apply: function () {
          updateHeightsUp();
        }
      });

      steps.push({
        line: "bf-sig",
        note: "Check balance factors."
      });
      steps.push({
        line: "bf-ret",
        note: "bf = height(left) − height(right).",
        apply: function () {
          updateHeightsUp();
        }
      });
      steps.push({
        line: "i-check",
        note: "Look for |bf| &gt; 1.",
        apply: function () {
          var bad = findUnbalanced();
          if (bad) {
            unbalancedId = bad.id;
            pendingRotation = { node: bad, type: "left" };
            setRotateEnabled(true);
            setPhase("Needs rotation");
            setCodeNote(
              "Node <strong>" +
                bad.key +
                "</strong> has bf=" +
                balanceFactor(bad) +
                " — press <strong>Step rotation</strong>."
            );
            setStatus(
              "Inserted " +
                key +
                ". Unbalanced at " +
                bad.key +
                " (before rotation)."
            );
          } else {
            setPhase("Balanced");
            setStatus("Inserted " + key + ". Tree still balanced.");
            setCodeNote("All balance factors in {−1, 0, +1}.");
          }
        }
      });
      steps.push({
        line: "i-ret",
        note: "Return after height / balance check."
      });

      runSteps(steps, function () {
        seqIndex += 1;
        setStatus(status ? status.textContent : "");
        if (nextEl) {
          nextEl.textContent =
            seqIndex < SEQUENCE.length ? String(SEQUENCE[seqIndex]) : "—";
        }
        if (heightEl) heightEl.textContent = String(Math.max(0, treeHeight(root)));
        busy = false;
        newId = null;
        paint();
      });
    }

    function rotateLeft(x) {
      var y = x.right;
      if (!y) return x;
      x.right = y.left;
      y.left = x;
      updateHeight(x);
      updateHeight(y);
      return y;
    }

    function replaceRoot(oldNode, newNode) {
      if (root === oldNode) {
        root = newNode;
        return;
      }
      function walk(n) {
        if (!n) return false;
        if (n.left === oldNode) {
          n.left = newNode;
          return true;
        }
        if (n.right === oldNode) {
          n.right = newNode;
          return true;
        }
        return walk(n.left) || walk(n.right);
      }
      walk(root);
    }

    function doRotate() {
      if (busy) return;
      if (!pendingRotation) {
        setStatus("Nothing to rotate — insert until the tree skews.");
        return;
      }

      busy = true;
      var x = pendingRotation.node;
      pivotId = x.id;
      unbalancedId = x.id;
      pathIds = [x.id];
      if (x.right) pathIds.push(x.right.id);

      runSteps(
        [
          {
            line: "rl-sig",
            note: "Enter <strong>rotateLeft</strong> at <strong>" + x.key + "</strong>.",
            phase: "Rotating",
            status: "Stepping left rotation at " + x.key + "…"
          },
          {
            line: "rl-y",
            note: "y = x→right (" + (x.right ? x.right.key : "?") + ").",
            apply: function () {
              if (x.right) pivotId = x.right.id;
            }
          },
          {
            line: "rl-move",
            note: "x→right = y→left (often NULL here)."
          },
          {
            line: "rl-pivot",
            note: "y→left = x — x drops one level.",
            apply: function () {
              var y = rotateLeft(x);
              replaceRoot(x, y);
              updateHeightsUp();
              pivotId = y.id;
              unbalancedId = null;
              pathIds = [y.id, x.id];
              if (y.right) pathIds.push(y.right.id);
            }
          },
          {
            line: "rl-upd",
            note: "Recompute heights of x and y."
          },
          {
            line: "rl-ret",
            note: "New subtree root is y.",
            phase: "Balanced",
            status:
              "Rotation done. Tree is balanced again (height " +
              Math.max(0, treeHeight(root)) +
              ")."
          }
        ],
        function () {
          pendingRotation = null;
          setRotateEnabled(false);
          busy = false;
          paint();
          setStatus(
            "After rotation: balanced AVL. " +
              (seqIndex < SEQUENCE.length
                ? "You can keep inserting, or Reset."
                : "Sequence complete — Reset to replay.")
          );
        }
      );
    }

    function reset() {
      if (busy) return;
      clearStepTimers();
      seed();
      paint();
      clearHighlight();
      setStatus(
        "Empty tree. Insert next (10, then 20, then 30) to force a left rotation."
      );
      setCodeNote(
        "Press <strong>Insert next</strong> through the skewing sequence, then <strong>Step rotation</strong> when balance breaks."
      );
    }

    document.querySelectorAll("[data-avl-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-avl-action");
        if (action === "insert") doInsertNext();
        else if (action === "rotate") doRotate();
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
          console.warn("[learn-avl] Repaint on resize failed", err);
        }
      }, 80);
    });

    renderCode();
    seed();
    paint();
    clearHighlight();
    setStatus(
      "Empty tree. Insert next (10, then 20, then 30) to force a left rotation."
    );
  }

  try {
    initAvl();
  } catch (err) {
    console.error("[learn-avl] Init failed", err);
  }
})();
