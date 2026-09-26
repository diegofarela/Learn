/**
 * Interactive binary tree builder + preorder traversal highlighter.
 */
(function () {
  var MAX_NODES = 15;
  var MAX_DEPTH = 4;

  var CODE_LINES = [
    { html: '<span class="code-kw">typedef struct</span> Node {' },
    { html: '  <span class="code-type">char</span> label;' },
    { html: '  <span class="code-kw">struct</span> Node *left, *right;' },
    { html: '} Node;' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">preorder</span>(Node *n) {', id: "pre-sig" },
    { html: '  <span class="code-kw">if</span> (n == NULL) <span class="code-kw">return</span>;', id: "pre-null" },
    { html: '  visit(n); <span class="code-cm">/* root */</span>', id: "pre-visit" },
    { html: '  preorder(n-&gt;left);  <span class="code-cm">/* left */</span>', id: "pre-left" },
    { html: '  preorder(n-&gt;right); <span class="code-cm">/* right */</span>', id: "pre-right" },
    { html: '}' }
  ];

  function initBinaryTree() {
    var nodesEl = document.getElementById("btree-nodes");
    var edgesEl = document.getElementById("btree-edges");
    var stage = document.querySelector(".btree-stage");
    var status = document.getElementById("btree-status");
    var sizeEl = document.getElementById("btree-size");
    var heightEl = document.getElementById("btree-height");
    var codeRoot = document.getElementById("btree-code");
    var codeNote = document.getElementById("btree-code-note");
    if (!nodesEl || !edgesEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};
    var nextLabel = 66; // 'B'
    var idSeq = 1;
    var selectedId = null;
    var visitOrder = [];

    /** @type {{id:number,label:string,left:object|null,right:object|null}|null} */
    var root = null;

    function makeNode(label) {
      return {
        id: idSeq++,
        label: label,
        left: null,
        right: null
      };
    }

    function seed() {
      root = makeNode("A");
      root.left = makeNode("B");
      root.right = makeNode("C");
      nextLabel = 68; // 'D'
      selectedId = root.id;
      visitOrder = [];
    }

    function nextLetter() {
      var ch = String.fromCharCode(nextLabel);
      nextLabel = nextLabel >= 90 ? 65 : nextLabel + 1;
      return ch;
    }

    function findById(node, id) {
      if (!node) return null;
      if (node.id === id) return node;
      return findById(node.left, id) || findById(node.right, id);
    }

    function countNodes(node) {
      if (!node) return 0;
      return 1 + countNodes(node.left) + countNodes(node.right);
    }

    function treeHeight(node) {
      if (!node) return -1;
      return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
    }

    function depthOf(node, id, depth) {
      if (!node) return -1;
      if (node.id === id) return depth;
      var L = depthOf(node.left, id, depth + 1);
      if (L >= 0) return L;
      return depthOf(node.right, id, depth + 1);
    }

    function collectPreorder(node, out) {
      if (!node) return;
      out.push(node);
      collectPreorder(node.left, out);
      collectPreorder(node.right, out);
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

    /**
     * Assign layout positions: depth levels, x in [0,1] by subtree slots.
     */
    function layout(node, depth, left, right, positions) {
      if (!node) return;
      var mid = (left + right) / 2;
      positions[node.id] = { x: mid, y: depth, node: node };
      layout(node.left, depth + 1, left, mid, positions);
      layout(node.right, depth + 1, mid, right, positions);
    }

    function paint(opts) {
      opts = opts || {};
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
          line.setAttribute("class", "btree-edge");
          edgesEl.appendChild(line);

          var tag = document.createElementNS("http://www.w3.org/2000/svg", "text");
          tag.setAttribute("x", String((from.x + to.x) / 2 + (pair[0] === "left" ? -10 : 10)));
          tag.setAttribute("y", String((from.y + to.y) / 2 - 4));
          tag.setAttribute("class", "btree-edge-label");
          tag.textContent = pair[0] === "left" ? "L" : "R";
          edgesEl.appendChild(tag);
        });
      });

      nodesEl.innerHTML = "";
      Object.keys(positions).forEach(function (idStr) {
        var pos = positions[idStr];
        var node = pos.node;
        var p = px(pos);
        var el = document.createElement("button");
        el.type = "button";
        el.className = "btree-node";
        el.textContent = node.label;
        el.style.left = p.x + "px";
        el.style.top = p.y + "px";
        el.dataset.id = String(node.id);
        if (selectedId === node.id) el.classList.add("is-selected");
        if (opts.visitId === node.id) el.classList.add("is-visit");
        if (opts.newId === node.id) el.classList.add("is-new");
        if (visitOrder.indexOf(node.id) !== -1 && opts.visitId !== node.id) {
          el.classList.add("is-visited");
        }
        var isRoot = root && root.id === node.id;
        var isLeaf = !node.left && !node.right;
        el.setAttribute(
          "aria-label",
          "Node " +
            node.label +
            (isRoot ? ", root" : "") +
            (isLeaf ? ", leaf" : "") +
            (selectedId === node.id ? ", selected" : "")
        );
        el.addEventListener("click", function () {
          if (busy) return;
          selectedId = node.id;
          visitOrder = [];
          paint();
          setStatus(
            "Selected \u201C" +
              node.label +
              "\u201D" +
              (isRoot ? " (root)" : isLeaf ? " (leaf)" : "") +
              ". Add left or right."
          );
        });
        nodesEl.appendChild(el);
      });
    }

    function addChild(side) {
      if (busy) return;
      if (!root) {
        root = makeNode("A");
        selectedId = root.id;
        nextLabel = 66;
        paint({ newId: root.id });
        setStatus("Created root “A”.");
        return;
      }
      if (!selectedId) {
        setStatus("Select a node first.");
        return;
      }
      var parent = findById(root, selectedId);
      if (!parent) {
        setStatus("Select a node first.");
        return;
      }
      if (side === "left" && parent.left) {
        setStatus("“" + parent.label + "” already has a left child.");
        return;
      }
      if (side === "right" && parent.right) {
        setStatus("“" + parent.label + "” already has a right child.");
        return;
      }
      if (countNodes(root) >= MAX_NODES) {
        setStatus("Demo cap — max " + MAX_NODES + " nodes.");
        return;
      }
      var depth = depthOf(root, parent.id, 0);
      if (depth >= MAX_DEPTH) {
        setStatus("Demo cap — max depth " + MAX_DEPTH + ".");
        return;
      }

      var child = makeNode(nextLetter());
      if (side === "left") parent.left = child;
      else parent.right = child;
      selectedId = child.id;
      visitOrder = [];
      paint({ newId: child.id });
      setStatus(
        "Added “" +
          child.label +
          "” as " +
          side +
          " of “" +
          parent.label +
          "”."
      );
    }

    function clearTree() {
      if (busy) return;
      clearStepTimers();
      seed();
      paint();
      clearHighlight();
      setStatus("Cleared to starter tree A → B, C. Root selected.");
      setCodeNote(
        "Press <strong>Traverse</strong> to walk the tree preorder — root, then left, then right — with each recursive call highlighted."
      );
    }

    function traverse() {
      if (busy) return;
      if (!root) {
        setStatus("Tree is empty.");
        return;
      }

      busy = true;
      visitOrder = [];
      clearStepTimers();
      var nodes = [];
      collectPreorder(root, nodes);
      var delay = reduceMotion ? 0 : 520;
      var i = 0;

      highlight("pre-sig", true);
      setCodeNote("Enter <strong>preorder</strong> at the root.");

      function step() {
        try {
          if (i >= nodes.length) {
            highlight("pre-sig", false);
            setCodeNote(
              "Done. Order: <strong>" +
                nodes
                  .map(function (n) {
                    return n.label;
                  })
                  .join(" → ") +
                "</strong>."
            );
            setStatus(
              "Preorder: " +
                nodes
                  .map(function (n) {
                    return n.label;
                  })
                  .join(" → ") +
                "."
            );
            paint();
            busy = false;
            return;
          }

          var node = nodes[i];
          highlight("pre-null", true);
          setCodeNote("Node is not NULL — continue.");

          var t1 = window.setTimeout(function () {
            highlight("pre-visit", true);
            visitOrder.push(node.id);
            paint({ visitId: node.id });
            setCodeNote("Visit <strong>“" + node.label + "”</strong> (root of this subtree).");
            setStatus("Visiting “" + node.label + "” (" + (i + 1) + "/" + nodes.length + ").");

            var t2 = window.setTimeout(function () {
              highlight("pre-left", true);
              setCodeNote("Recurse on <strong>left</strong> of “" + node.label + "”.");

              var t3 = window.setTimeout(function () {
                highlight("pre-right", true);
                setCodeNote("Recurse on <strong>right</strong> of “" + node.label + "”.");

                var t4 = window.setTimeout(function () {
                  i += 1;
                  step();
                }, reduceMotion ? 0 : delay * 0.45);
                stepTimers.push(t4);
              }, reduceMotion ? 0 : delay * 0.45);
              stepTimers.push(t3);
            }, reduceMotion ? 0 : delay * 0.55);
            stepTimers.push(t2);
          }, reduceMotion ? 0 : delay * 0.35);
          stepTimers.push(t1);
        } catch (err) {
          console.error("[learn-btree] Traverse step failed", { i: i, err: err });
          busy = false;
        }
      }

      var startId = window.setTimeout(step, reduceMotion ? 0 : 280);
      stepTimers.push(startId);
    }

    document.querySelectorAll("[data-btree-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-btree-action");
        if (action === "add-left") addChild("left");
        else if (action === "add-right") addChild("right");
        else if (action === "traverse") traverse();
        else if (action === "clear") clearTree();
      });
    });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        try {
          paint();
        } catch (err) {
          console.warn("[learn-btree] Repaint on resize failed", err);
        }
      }, 80);
    });

    renderCode();
    seed();
    paint();
    clearHighlight();
    setStatus("Root A selected. Add a left or right child.");
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        try {
          paint();
        } catch (err) {
          console.warn("[learn-btree] Initial layout pass failed", err);
        }
      });
    }
  }

  try {
    initBinaryTree();
  } catch (err) {
    console.error("[learn-btree] Init failed", err);
  }
})();
