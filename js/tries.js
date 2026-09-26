/**
 * Interactive trie (prefix tree) with insert/search C highlighter.
 */
(function () {
  var MAX_WORDS = 12;
  var MAX_LEN = 8;

  var CODE_LINES = [
    { html: '<span class="code-kw">typedef struct</span> Node {' },
    { html: '  Node *child[<span class="code-num">26</span>];' },
    { html: '  <span class="code-type">int</span> end; <span class="code-cm">/* 1 = word ends here */</span>' },
    { html: '} Node;' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">insert</span>(Node *r, <span class="code-type">char</span> *w) {', id: "i-sig" },
    { html: '  Node *cur = r;', id: "i-cur" },
    { html: '  <span class="code-kw">for</span> (; *w; w++) {', id: "i-loop" },
    { html: '    <span class="code-type">int</span> i = *w - <span class="code-str">\'a\'</span>;', id: "i-idx" },
    { html: '    <span class="code-kw">if</span> (!cur-&gt;child[i]) cur-&gt;child[i] = make();', id: "i-make" },
    { html: '    cur = cur-&gt;child[i];', id: "i-down" },
    { html: '  }' },
    { html: '  cur-&gt;end = <span class="code-num">1</span>;', id: "i-end" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">int</span> <span class="code-fn">search</span>(Node *r, <span class="code-type">char</span> *w) {', id: "s-sig" },
    { html: '  Node *cur = r;', id: "s-cur" },
    { html: '  <span class="code-kw">for</span> (; *w; w++) {', id: "s-loop" },
    { html: '    <span class="code-type">int</span> i = *w - <span class="code-str">\'a\'</span>;', id: "s-idx" },
    { html: '    <span class="code-kw">if</span> (!cur-&gt;child[i]) <span class="code-kw">return</span> <span class="code-num">0</span>;', id: "s-miss" },
    { html: '    cur = cur-&gt;child[i];', id: "s-down" },
    { html: '  }' },
    { html: '  <span class="code-kw">return</span> cur-&gt;end; <span class="code-cm">/* or 1 for prefix */</span>', id: "s-ret" },
    { html: '}' }
  ];

  function initTrie() {
    var nodesEl = document.getElementById("trie-nodes");
    var edgesEl = document.getElementById("trie-edges");
    var stage = document.querySelector(".trie-stage");
    var status = document.getElementById("trie-status");
    var wordCountMeta = document.getElementById("trie-count");
    var nodeCountMeta = document.getElementById("trie-node-count");
    var codeRoot = document.getElementById("trie-code");
    var codeNote = document.getElementById("trie-code-note");
    var wordInput = document.getElementById("trie-word");
    if (!nodesEl || !edgesEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};
    var idSeq = 1;
    var pathIds = [];
    var newId = null;
    var missId = null;
    var wordCount = 0;
    var root = null;

    function makeNode(ch) {
      return { id: idSeq++, ch: ch || "", end: false, children: {} };
    }

    function insertSilent(word) {
      var cur = root;
      for (var i = 0; i < word.length; i++) {
        var c = word[i];
        if (!cur.children[c]) cur.children[c] = makeNode(c);
        cur = cur.children[c];
      }
      if (!cur.end) {
        cur.end = true;
        wordCount += 1;
      }
    }

    function seed() {
      idSeq = 1;
      root = makeNode("");
      wordCount = 0;
      ["cat", "car", "dog", "do"].forEach(insertSilent);
      pathIds = [];
      newId = null;
      missId = null;
    }

    function countNodes(node) {
      if (!node) return 0;
      var n = 1;
      Object.keys(node.children).forEach(function (k) {
        n += countNodes(node.children[k]);
      });
      return n;
    }

    function readWord() {
      if (!wordInput) return "";
      var w = String(wordInput.value || "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      if (w.length > MAX_LEN) w = w.slice(0, MAX_LEN);
      wordInput.value = w;
      return w;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
      if (wordCountMeta) wordCountMeta.textContent = String(wordCount);
      if (nodeCountMeta) nodeCountMeta.textContent = String(countNodes(root));
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

    function collectLayout(node, depth, left, right, positions) {
      var keys = Object.keys(node.children).sort();
      positions[node.id] = { x: (left + right) / 2, y: depth, node: node };
      if (!keys.length) return;
      var span = (right - left) / keys.length;
      keys.forEach(function (k, i) {
        collectLayout(
          node.children[k],
          depth + 1,
          left + i * span,
          left + (i + 1) * span,
          positions
        );
      });
    }

    function maxDepth(node) {
      var keys = Object.keys(node.children);
      if (!keys.length) return 0;
      var m = 0;
      keys.forEach(function (k) {
        m = Math.max(m, maxDepth(node.children[k]));
      });
      return 1 + m;
    }

    function paint() {
      var positions = {};
      collectLayout(root, 0, 0, 1, positions);

      var stageW = stage ? stage.clientWidth : 420;
      var stageH = stage ? stage.clientHeight : 280;
      var padX = 28;
      var padY = 26;
      var usableW = Math.max(120, stageW - padX * 2);
      var usableH = Math.max(100, stageH - padY * 2);
      var h = Math.max(0, maxDepth(root));
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
        Object.keys(node.children).forEach(function (ch) {
          var child = node.children[ch];
          if (!positions[child.id]) return;
          var to = px(positions[child.id]);
          var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", String(from.x));
          line.setAttribute("y1", String(from.y));
          line.setAttribute("x2", String(to.x));
          line.setAttribute("y2", String(to.y));
          var onPath =
            pathIds.indexOf(node.id) !== -1 && pathIds.indexOf(child.id) !== -1;
          line.setAttribute("class", "trie-edge" + (onPath ? " is-path" : ""));
          edgesEl.appendChild(line);
        });
      });

      nodesEl.innerHTML = "";
      Object.keys(positions).forEach(function (idStr) {
        var pos = positions[idStr];
        var node = pos.node;
        var p = px(pos);
        var el = document.createElement("div");
        el.className = "trie-node";
        if (!node.ch) el.classList.add("is-root");
        if (node.end) el.classList.add("is-end");
        if (pathIds.indexOf(node.id) !== -1) el.classList.add("is-path");
        if (newId === node.id) el.classList.add("is-new");
        if (missId === node.id) el.classList.add("is-miss");
        el.textContent = node.ch || "ε";
        el.style.left = p.x + "px";
        el.style.top = p.y + "px";
        el.setAttribute(
          "aria-label",
          (node.ch ? "Letter " + node.ch : "Root") + (node.end ? ", word end" : "")
        );
        nodesEl.appendChild(el);
      });
    }

    function doInsert() {
      if (busy) return;
      var word = readWord();
      if (!word) {
        setStatus("Enter a lowercase word (a–z).");
        return;
      }
      if (wordCount >= MAX_WORDS) {
        setStatus("Demo cap — max " + MAX_WORDS + " words.");
        return;
      }

      busy = true;
      var cursor = root;
      var built = [];
      built.push({
        line: "i-sig",
        note: "Enter <strong>insert</strong> with <strong>" + word + "</strong>.",
        visit: root.id,
        status: "Inserting “" + word + "”…"
      });
      built.push({ line: "i-cur", note: "Start at the root.", visit: root.id });

      word.split("").forEach(function (ch) {
        built.push({
          line: "i-loop",
          note: "Next character <strong>" + ch + "</strong>.",
          visitFn: function () {
            return cursor.id;
          }
        });
        built.push({
          line: "i-idx",
          note: "Index for <strong>" + ch + "</strong>.",
          visitFn: function () {
            return cursor.id;
          }
        });
        built.push({
          line: "i-make",
          apply: function () {
            if (!cursor.children[ch]) {
              cursor.children[ch] = makeNode(ch);
              newId = cursor.children[ch].id;
              setCodeNote("Created child <strong>" + ch + "</strong>.");
            } else {
              newId = null;
              setCodeNote("Child <strong>" + ch + "</strong> already present.");
            }
            cursor = cursor.children[ch];
          },
          visitFn: function () {
            return cursor.id;
          }
        });
        built.push({
          line: "i-down",
          note: "Descend on <strong>" + ch + "</strong>.",
          visitFn: function () {
            return cursor.id;
          }
        });
      });

      built.push({
        line: "i-end",
        apply: function () {
          if (!cursor.end) {
            cursor.end = true;
            wordCount += 1;
            setCodeNote("Marked end-of-word.");
            setStatus("Inserted “" + word + "”.");
          } else {
            setCodeNote("Word already marked — no-op.");
            setStatus("“" + word + "” was already in the trie.");
          }
        },
        visitFn: function () {
          return cursor.id;
        }
      });

      clearStepTimers();
      var delay = reduceMotion ? 0 : 400;
      pathIds = [root.id];
      newId = null;
      missId = null;
      paint();

      built.forEach(function (step, idx) {
        var tid = window.setTimeout(function () {
          try {
            highlight(step.line, true);
            if (step.note) setCodeNote(step.note);
            if (step.apply) step.apply();
            var vid = step.visitFn ? step.visitFn() : step.visit;
            if (vid && pathIds.indexOf(vid) === -1) pathIds.push(vid);
            paint();
            if (step.status) setStatus(step.status);
            else setStatus(status ? status.textContent : "");
            if (wordCountMeta) wordCountMeta.textContent = String(wordCount);
            if (nodeCountMeta) nodeCountMeta.textContent = String(countNodes(root));
            if (idx === built.length - 1) busy = false;
          } catch (err) {
            console.error("[learn-trie] Insert failed", { step: step, err: err });
            busy = false;
          }
        }, idx * delay);
        stepTimers.push(tid);
      });
    }

    function doSearch() {
      if (busy) return;
      var word = readWord();
      if (!word) {
        setStatus("Enter a lowercase word or prefix (a–z).");
        return;
      }

      busy = true;
      var cursor = root;
      var failed = false;
      var built = [];

      built.push({
        line: "s-sig",
        note: "Enter <strong>search</strong> for <strong>" + word + "</strong>.",
        visit: root.id,
        status: "Searching “" + word + "”…"
      });
      built.push({ line: "s-cur", note: "Start at the root.", visit: root.id });

      word.split("").forEach(function (ch) {
        built.push({
          line: "s-loop",
          note: "Look for <strong>" + ch + "</strong>.",
          visitFn: function () {
            return cursor.id;
          },
          skipIfFailed: true
        });
        built.push({
          line: "s-idx",
          note: "Index for <strong>" + ch + "</strong>.",
          visitFn: function () {
            return cursor.id;
          },
          skipIfFailed: true
        });
        built.push({
          line: "s-miss",
          apply: function () {
            if (!cursor.children[ch]) {
              missId = cursor.id;
              failed = true;
              setCodeNote("No edge for <strong>" + ch + "</strong> — miss.");
              setStatus("“" + word + "” not found (broke at “" + ch + "”).");
              return;
            }
            setCodeNote("Edge <strong>" + ch + "</strong> exists.");
          },
          visitFn: function () {
            return cursor.id;
          },
          skipIfFailed: true
        });
        built.push({
          line: "s-down",
          apply: function () {
            if (failed) return;
            cursor = cursor.children[ch];
            setCodeNote("Descend to <strong>" + ch + "</strong>.");
          },
          visitFn: function () {
            return cursor.id;
          },
          skipIfFailed: true
        });
      });

      built.push({
        line: "s-ret",
        apply: function () {
          if (failed) return;
          if (cursor.end) {
            setCodeNote("end == 1 — exact match.");
            setStatus("Exact word “" + word + "” found.");
          } else {
            setCodeNote("Path ok, end == 0 — prefix only.");
            setStatus("Prefix “" + word + "” exists (not a completed word).");
          }
        },
        visitFn: function () {
          return cursor.id;
        },
        skipIfFailed: true
      });

      clearStepTimers();
      var delay = reduceMotion ? 0 : 400;
      pathIds = [root.id];
      newId = null;
      missId = null;
      paint();

      built.forEach(function (step, idx) {
        var tid = window.setTimeout(function () {
          try {
            if (failed && step.skipIfFailed && step.line !== "s-miss") {
              if (idx === built.length - 1) busy = false;
              return;
            }
            highlight(step.line, true);
            if (step.note) setCodeNote(step.note);
            if (step.apply) step.apply();
            var vid = step.visitFn ? step.visitFn() : step.visit;
            if (vid && pathIds.indexOf(vid) === -1) pathIds.push(vid);
            paint();
            if (step.status) setStatus(step.status);
            if (wordCountMeta) wordCountMeta.textContent = String(wordCount);
            if (nodeCountMeta) nodeCountMeta.textContent = String(countNodes(root));
            if (idx === built.length - 1) busy = false;
          } catch (err) {
            console.error("[learn-trie] Search failed", { step: step, err: err });
            busy = false;
          }
        }, idx * delay);
        stepTimers.push(tid);
      });
    }

    function reset() {
      if (busy) return;
      clearStepTimers();
      seed();
      paint();
      clearHighlight();
      setStatus("Reset — seeded with cat, car, dog, do.");
      setCodeNote(
        "Press <strong>Insert word</strong> or <strong>Search</strong> — each character step lights up in the C code."
      );
      if (wordInput) wordInput.value = "care";
    }

    document.querySelectorAll("[data-trie-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-trie-action");
        if (action === "insert") doInsert();
        else if (action === "search") doSearch();
        else if (action === "reset") reset();
      });
    });

    if (wordInput) {
      wordInput.addEventListener("keydown", function (e) {
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
          console.warn("[learn-trie] Repaint on resize failed", err);
        }
      }, 80);
    });

    renderCode();
    seed();
    paint();
    clearHighlight();
    setStatus("Seeded with cat, car, dog, do. Insert a word or search a prefix.");
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(function () {
        try {
          paint();
        } catch (err) {
          console.warn("[learn-trie] Initial layout pass failed", err);
        }
      });
    }
  }

  try {
    initTrie();
  } catch (err) {
    console.error("[learn-trie] Init failed", err);
  }
})();
