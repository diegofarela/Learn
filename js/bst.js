/**
 * Interactive BST insert/search + C code highlighter.
 */
(function () {
  var MAX_NODES = 15;
  var MAX_DEPTH = 5;

  var CODE_LINES = [
    { html: '<span class="code-kw">typedef struct</span> Node {' },
    { html: '  <span class="code-type">int</span> key;' },
    { html: '  <span class="code-kw">struct</span> Node *left, *right;' },
    { html: '} Node;' },
    { blank: true },
    { html: 'Node *<span class="code-fn">search</span>(Node *n, <span class="code-type">int</span> k) {', id: "s-sig" },
    { html: '  <span class="code-kw">if</span> (n == NULL) <span class="code-kw">return</span> NULL;', id: "s-null" },
    { html: '  <span class="code-kw">if</span> (k == n-&gt;key) <span class="code-kw">return</span> n;', id: "s-eq" },
    { html: '  <span class="code-kw">if</span> (k &lt; n-&gt;key) <span class="code-kw">return</span> search(n-&gt;left, k);', id: "s-left" },
    { html: '  <span class="code-kw">return</span> search(n-&gt;right, k);', id: "s-right" },
    { html: '}' },
    { blank: true },
    { html: 'Node *<span class="code-fn">insert</span>(Node *n, <span class="code-type">int</span> k) {', id: "i-sig" },
    { html: '  <span class="code-kw">if</span> (n == NULL) <span class="code-kw">return</span> make(k);', id: "i-null" },
    { html: '  <span class="code-kw">if</span> (k &lt; n-&gt;key) n-&gt;left = insert(n-&gt;left, k);', id: "i-left" },
    { html: '  <span class="code-kw">else if</span> (k &gt; n-&gt;key) n-&gt;right = insert(n-&gt;right, k);', id: "i-right" },
    { html: '  <span class="code-kw">return</span> n; <span class="code-cm">/* duplicate: no-op */</span>', id: "i-ret" },
    { html: '}' }
  ];

  function initBst() {
    var nodesEl = document.getElementById("bst-nodes");
    var edgesEl = document.getElementById("bst-edges");
    var stage = document.querySelector(".bst-stage");
    var status = document.getElementById("bst-status");
    var sizeEl = document.getElementById("bst-size");
    var heightEl = document.getElementById("bst-height");
    var codeRoot = document.getElementById("bst-code");
    var codeNote = document.getElementById("bst-code-note");
    var valueInput = document.getElementById("bst-value");
    if (!nodesEl || !edgesEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};
    var idSeq = 1;
    var pathIds = [];
    var foundId = null;
    var newId = null;

    /** @type {{id:number,key:number,left:object|null,right:object|null}|null} */
    var root = null;

    function makeNode(key) {
      return { id: idSeq++, key: key, left: null, right: null };
    }

    function seed() {
      idSeq = 1;
      root = makeNode(20);
      root.left = makeNode(10);
      root.right = makeNode(30);
      root.left.left = makeNode(5);
      root.left.right = makeNode(15);
      pathIds = [];
      foundId = null;
      newId = null;
    }

    function countNodes(node) {
      if (!node) return 0;
      return 1 + countNodes(node.left) + countNodes(node.right);
    }

    function treeHeight(node) {
      if (!node) return -1;
      return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
    }

    function readValue() {
      if (!valueInput) return NaN;
      var n = parseInt(valueInput.value, 10);
      if (isNaN(n)) return NaN;
      if (n < 0) n = 0;
      if (n > 99) n = 99;
      valueInput.value = String(n);
      return n;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
      if (sizeEl) sizeEl.textContent = String(countNodes(root));
      if (heightEl) heightEl.textContent = String(Math.max(0, treeHeight(root)));
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
      var mid = (left + right) / 2;
      positions[node.id] = { x: mid, y: depth, node: node };
      layout(node.left, depth + 1, left, mid, positions);
      layout(node.right, depth + 1, mid, right, positions);
    }

    function paint() {
      var positions = {};
      if (root) layout(root, 0, 0, 1, positions);

      var stageW = stage ? stage.clientWidth : 400;
      var stageH = stage ? stage.clientHeight : 280;
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
        [["left", node.left], ["right", node.right]].forEach(function (pair) {
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
          line.setAttribute("class", "bst-edge" + (onPath ? " is-path" : ""));
          edgesEl.appendChild(line);
        });
      });

      nodesEl.innerHTML = "";
      Object.keys(positions).forEach(function (idStr) {
        var pos = positions[idStr];
        var node = pos.node;
        var p = px(pos);
        var el = document.createElement("div");
        el.className = "bst-node";
        el.textContent = String(node.key);
        el.style.left = p.x + "px";
        el.style.top = p.y + "px";
        el.dataset.id = String(node.id);
        if (pathIds.indexOf(node.id) !== -1) el.classList.add("is-path");
        if (foundId === node.id) el.classList.add("is-found");
        if (newId === node.id) el.classList.add("is-new");
        var isRoot = root && root.id === node.id;
        el.setAttribute(
          "aria-label",
          "Key " + node.key + (isRoot ? ", root" : "")
        );
        nodesEl.appendChild(el);
      });
    }

    function depthOf(node) {
      if (!node) return 0;
      return 1 + Math.max(depthOf(node.left), depthOf(node.right));
    }

    function containsKey(node, key) {
      if (!node) return false;
      if (key === node.key) return true;
      if (key < node.key) return containsKey(node.left, key);
      return containsKey(node.right, key);
    }

    function buildSearchTrace(key) {
      var steps = [];
      var cur = root;
      steps.push({ line: "s-sig", note: "Enter <strong>search</strong> looking for <strong>" + key + "</strong>." });

      while (true) {
        if (!cur) {
          steps.push({
            line: "s-null",
            note: "Hit <strong>NULL</strong> — key not found.",
            found: false,
            visual: "commit"
          });
          break;
        }
        steps.push({
          line: "s-null",
          note: "Node <strong>" + cur.key + "</strong> is not NULL.",
          visit: cur.id
        });
        if (key === cur.key) {
          steps.push({
            line: "s-eq",
            note: "Key equals <strong>" + cur.key + "</strong> — found.",
            visit: cur.id,
            found: true,
            visual: "commit"
          });
          break;
        }
        if (key < cur.key) {
          steps.push({
            line: "s-left",
            note: "<strong>" + key + "</strong> &lt; <strong>" + cur.key + "</strong> — go left.",
            visit: cur.id
          });
          cur = cur.left;
        } else {
          steps.push({
            line: "s-right",
            note: "<strong>" + key + "</strong> &gt; <strong>" + cur.key + "</strong> — go right.",
            visit: cur.id
          });
          cur = cur.right;
        }
      }
      return steps;
    }

    function buildInsertTrace(key) {
      var steps = [];
      steps.push({ line: "i-sig", note: "Enter <strong>insert</strong> with key <strong>" + key + "</strong>." });

      if (!root) {
        steps.push({
          line: "i-null",
          note: "Tree empty — <strong>make(" + key + ")</strong> becomes the root.",
          visual: "commit",
          attach: { parent: null, side: null, key: key }
        });
        return steps;
      }

      var cur = root;
      while (cur) {
        steps.push({
          line: "i-null",
          note: "At <strong>" + cur.key + "</strong> — not NULL.",
          visit: cur.id
        });
        if (key === cur.key) {
          steps.push({
            line: "i-ret",
            note: "Duplicate key <strong>" + key + "</strong> — no-op.",
            visit: cur.id,
            visual: "commit",
            duplicate: true
          });
          return steps;
        }
        if (key < cur.key) {
          steps.push({
            line: "i-left",
            note: "<strong>" + key + "</strong> &lt; <strong>" + cur.key + "</strong> — recurse left.",
            visit: cur.id
          });
          if (!cur.left) {
            steps.push({
              line: "i-null",
              note: "Left link is NULL — attach <strong>" + key + "</strong>.",
              visit: cur.id,
              visual: "commit",
              attach: { parentId: cur.id, side: "left", key: key }
            });
            return steps;
          }
          cur = cur.left;
        } else {
          steps.push({
            line: "i-right",
            note: "<strong>" + key + "</strong> &gt; <strong>" + cur.key + "</strong> — recurse right.",
            visit: cur.id
          });
          if (!cur.right) {
            steps.push({
              line: "i-null",
              note: "Right link is NULL — attach <strong>" + key + "</strong>.",
              visit: cur.id,
              visual: "commit",
              attach: { parentId: cur.id, side: "right", key: key }
            });
            return steps;
          }
          cur = cur.right;
        }
      }
      return steps;
    }

    function findById(node, id) {
      if (!node) return null;
      if (node.id === id) return node;
      return findById(node.left, id) || findById(node.right, id);
    }

    function runTrace(steps, ctx) {
      clearStepTimers();
      var delay = reduceMotion ? 0 : 480;
      pathIds = [];
      foundId = null;
      newId = null;
      paint();

      if (!steps.length) {
        if (ctx && typeof ctx.onDone === "function") ctx.onDone();
        return;
      }

      steps.forEach(function (step, i) {
        var id = window.setTimeout(function () {
          try {
            highlight(step.line, true);
            if (step.note) setCodeNote(step.note);
            if (step.visit) {
              if (pathIds.indexOf(step.visit) === -1) pathIds.push(step.visit);
              paint();
            }
            if (step.visual === "commit" && ctx && typeof ctx.onCommit === "function") {
              ctx.onCommit(step);
            }
            if (i === steps.length - 1) {
              var doneId = window.setTimeout(function () {
                if (ctx && typeof ctx.onDone === "function") ctx.onDone();
              }, reduceMotion ? 0 : 260);
              stepTimers.push(doneId);
            }
          } catch (err) {
            console.error("[learn-bst] Step failed", { step: step, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(id);
      });
    }

    function doSearch() {
      if (busy) return;
      var key = readValue();
      if (isNaN(key)) {
        setStatus("Enter a number from 0–99.");
        return;
      }
      busy = true;
      var steps = buildSearchTrace(key);
      runTrace(steps, {
        onCommit: function (step) {
          if (step.found) {
            foundId = pathIds[pathIds.length - 1] || null;
            paint();
            setStatus("Found " + key + ".");
          } else {
            foundId = null;
            paint();
            setStatus(key + " not in the tree.");
          }
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function doInsert() {
      if (busy) return;
      var key = readValue();
      if (isNaN(key)) {
        setStatus("Enter a number from 0–99.");
        return;
      }
      if (countNodes(root) >= MAX_NODES && !containsKey(root, key)) {
        setStatus("Demo cap — max " + MAX_NODES + " nodes.");
        return;
      }
      if (depthOf(root) >= MAX_DEPTH && !containsKey(root, key)) {
        /* allow insert only if it wouldn't deepen past cap — approximate */
        var probe = root;
        var d = 0;
        while (probe) {
          if (key === probe.key) break;
          d += 1;
          probe = key < probe.key ? probe.left : probe.right;
        }
        if (!probe && d >= MAX_DEPTH) {
          setStatus("Demo cap — max depth " + MAX_DEPTH + ".");
          return;
        }
      }

      busy = true;
      var steps = buildInsertTrace(key);
      runTrace(steps, {
        onCommit: function (step) {
          if (step.duplicate) {
            setStatus("Key " + key + " already present — no insert.");
            return;
          }
          if (!step.attach) return;
          var node = makeNode(step.attach.key);
          if (!step.attach.parentId) {
            root = node;
          } else {
            var parent = findById(root, step.attach.parentId);
            if (!parent) return;
            if (step.attach.side === "left") parent.left = node;
            else parent.right = node;
          }
          newId = node.id;
          if (pathIds.indexOf(node.id) === -1) pathIds.push(node.id);
          paint();
          setStatus("Inserted " + key + ".");
          if (valueInput) {
            var next = key + 7;
            if (next > 99) next = key - 3;
            if (next < 0) next = 1;
            valueInput.value = String(next);
          }
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function reset() {
      if (busy) return;
      clearStepTimers();
      seed();
      paint();
      clearHighlight();
      setStatus("Reset to starter tree: 20 → 10, 30 → 5, 15.");
      setCodeNote(
        "Press <strong>Insert</strong> or <strong>Search</strong> — each comparison on the path lights up in the C code."
      );
      if (valueInput) valueInput.value = "15";
    }

    document.querySelectorAll("[data-bst-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-bst-action");
        if (action === "insert") doInsert();
        else if (action === "search") doSearch();
        else if (action === "reset") reset();
      });
    });

    if (valueInput) {
      valueInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          doInsert();
        }
      });
    }

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        try {
          paint();
        } catch (err) {
          console.warn("[learn-bst] Repaint on resize failed", err);
        }
      }, 80);
    });

    renderCode();
    seed();
    paint();
    clearHighlight();
    setStatus("Seeded tree ready. Insert a value or search for one.");
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        try {
          paint();
        } catch (err) {
          console.warn("[learn-bst] Initial layout pass failed", err);
        }
      });
    }
  }

  try {
    initBst();
  } catch (err) {
    console.error("[learn-bst] Init failed", err);
  }
})();
