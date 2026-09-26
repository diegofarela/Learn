/**
 * Interactive hash table (chaining) + C code line highlighter.
 */
(function () {
  var BUCKETS = 8;

  var CODE_LINES = [
    { html: '<span class="code-kw">#define</span> N <span class="code-num">8</span>' },
    { html: 'Node *buckets[N]; <span class="code-cm">/* each may be a chain */</span>', id: "buckets" },
    { blank: true },
    { html: '<span class="code-type">int</span> <span class="code-fn">hash</span>(<span class="code-type">char</span> *key) {', id: "hash-sig" },
    { html: '  <span class="code-type">int</span> h = <span class="code-num">0</span>;', id: "hash-init" },
    { html: '  <span class="code-kw">while</span> (*key) h += *key++;', id: "hash-loop" },
    { html: '  <span class="code-kw">return</span> h % N;', id: "hash-mod" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">insert</span>(<span class="code-type">char</span> *k, <span class="code-type">char</span> *v) {', id: "ins-sig" },
    { html: '  <span class="code-type">int</span> i = hash(k);', id: "ins-hash" },
    { html: '  Node *n = buckets[i];', id: "ins-walk" },
    { html: '  <span class="code-kw">while</span> (n) { <span class="code-cm">/* update if key exists */</span>', id: "ins-find" },
    { html: '    <span class="code-kw">if</span> (eq(n-&gt;k, k)) { n-&gt;v = v; <span class="code-kw">return</span>; }', id: "ins-update" },
    { html: '    n = n-&gt;next;', id: "ins-next" },
    { html: '  }' },
    { html: '  push_front(&amp;buckets[i], k, v); <span class="code-cm">/* chain */</span>', id: "ins-push" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">char</span> *<span class="code-fn">lookup</span>(<span class="code-type">char</span> *k) {', id: "look-sig" },
    { html: '  <span class="code-type">int</span> i = hash(k);', id: "look-hash" },
    { html: '  Node *n = buckets[i];', id: "look-start" },
    { html: '  <span class="code-kw">while</span> (n) {', id: "look-loop" },
    { html: '    <span class="code-kw">if</span> (eq(n-&gt;k, k)) <span class="code-kw">return</span> n-&gt;v;', id: "look-hit" },
    { html: '    n = n-&gt;next;', id: "look-next" },
    { html: '  }' },
    { html: '  <span class="code-kw">return</span> NULL;', id: "look-miss" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">delete</span>(<span class="code-type">char</span> *k) {', id: "del-sig" },
    { html: '  <span class="code-type">int</span> i = hash(k);', id: "del-hash" },
    { html: '  unlink(&amp;buckets[i], k); <span class="code-cm">/* walk + splice */</span>', id: "del-unlink" },
    { html: '}' }
  ];

  var STEPS = {
    insert: [
      { line: "ins-sig", note: "Enter <strong>insert</strong> with key and value." },
      { line: "hash-sig", note: "Compute <strong>hash(key)</strong>." },
      { line: "hash-loop", note: "Sum character codes of the key." },
      { line: "hash-mod", note: "Reduce to a bucket index with <strong>% N</strong>.", visual: "hash" },
      { line: "ins-hash", note: "Land on bucket <strong>i</strong>.", visual: "bucket" },
      { line: "ins-walk", note: "Start at the head of that bucket’s chain." },
      { line: "ins-find", note: "Walk the chain looking for an equal key.", visual: "walk" },
      { line: "ins-push", note: "No match — push a new node onto the chain.", visual: "commit" },
      { line: "buckets", note: "Table updated. Load factor = n / N." }
    ],
    insertUpdate: [
      { line: "ins-sig", note: "Enter <strong>insert</strong> with key and value." },
      { line: "hash-sig", note: "Compute <strong>hash(key)</strong>." },
      { line: "hash-mod", note: "Bucket index ready.", visual: "hash" },
      { line: "ins-hash", note: "Land on bucket <strong>i</strong>.", visual: "bucket" },
      { line: "ins-find", note: "Walk the chain — key already present.", visual: "walk" },
      { line: "ins-update", note: "Overwrite the stored value.", visual: "commit" },
      { line: "buckets", note: "Same key, new value. Count unchanged." }
    ],
    lookup: [
      { line: "look-sig", note: "Enter <strong>lookup</strong>." },
      { line: "hash-sig", note: "Hash the key." },
      { line: "hash-mod", note: "Index = hash % N.", visual: "hash" },
      { line: "look-hash", note: "Jump to that bucket.", visual: "bucket" },
      { line: "look-start", note: "Start at the chain head." },
      { line: "look-loop", note: "Compare keys along the chain.", visual: "walk" },
      { line: "look-hit", note: "Match — return the value.", visual: "commit" }
    ],
    lookupMiss: [
      { line: "look-sig", note: "Enter <strong>lookup</strong>." },
      { line: "hash-mod", note: "Index = hash % N.", visual: "hash" },
      { line: "look-hash", note: "Jump to that bucket.", visual: "bucket" },
      { line: "look-loop", note: "Walk the chain — no matching key.", visual: "walk" },
      { line: "look-miss", note: "Return <strong>NULL</strong> — key not found.", visual: "commit" }
    ],
    "delete": [
      { line: "del-sig", note: "Enter <strong>delete</strong>." },
      { line: "hash-sig", note: "Hash the key." },
      { line: "hash-mod", note: "Index = hash % N.", visual: "hash" },
      { line: "del-hash", note: "Open that bucket.", visual: "bucket" },
      { line: "del-unlink", note: "Walk the chain and unlink the matching node.", visual: "commit" },
      { line: "buckets", note: "Entry removed. Load factor drops." }
    ],
    reset: [
      { line: "buckets", note: "Reset demo: three starter pairs in the table." }
    ]
  };

  function initHashTable() {
    var bucketsEl = document.getElementById("hash-buckets");
    var status = document.getElementById("hash-status");
    var loadEl = document.getElementById("hash-load");
    var countEl = document.getElementById("hash-count");
    var formulaEl = document.getElementById("hash-formula");
    var keyInput = document.getElementById("hash-key");
    var valInput = document.getElementById("hash-val");
    var codeRoot = document.getElementById("hash-code");
    var codeNote = document.getElementById("hash-code-note");
    if (!bucketsEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};
    var buckets = [];
    var lastIndex = -1;

    function emptyBuckets() {
      buckets = [];
      for (var i = 0; i < BUCKETS; i++) buckets.push([]);
    }

    function hashKey(key) {
      var h = 0;
      var s = String(key || "");
      for (var i = 0; i < s.length; i++) h += s.charCodeAt(i);
      return h % BUCKETS;
    }

    function countEntries() {
      var n = 0;
      for (var i = 0; i < BUCKETS; i++) n += buckets[i].length;
      return n;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
      var n = countEntries();
      if (countEl) countEl.textContent = String(n);
      if (loadEl) loadEl.textContent = (n / BUCKETS).toFixed(2);
    }

    function setFormula(key, index) {
      if (!formulaEl) return;
      var s = String(key || "");
      if (!s) {
        formulaEl.textContent = "hash(key) = Σ code(c) % " + BUCKETS;
        return;
      }
      formulaEl.innerHTML =
        "hash(<strong>" +
        escapeHtml(s) +
        "</strong>) → <strong>" +
        index +
        "</strong>";
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
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

    function clearVisualFlags() {
      bucketsEl.querySelectorAll(".hash-bucket").forEach(function (el) {
        el.classList.remove("is-target", "is-hashing");
      });
      bucketsEl.querySelectorAll(".hash-entry").forEach(function (el) {
        el.classList.remove("is-probe", "is-hit", "is-new", "is-gone");
      });
    }

    function paint(opts) {
      opts = opts || {};
      bucketsEl.innerHTML = "";
      buckets.forEach(function (chain, i) {
        var col = document.createElement("div");
        col.className = "hash-bucket";
        col.dataset.index = String(i);
        if (opts.targetIndex === i) col.classList.add("is-target");
        if (opts.hashingIndex === i) col.classList.add("is-hashing");

        var idx = document.createElement("div");
        idx.className = "hash-bucket-idx";
        idx.textContent = String(i);
        col.appendChild(idx);

        var chainEl = document.createElement("div");
        chainEl.className = "hash-chain";
        if (!chain.length) {
          var empty = document.createElement("span");
          empty.className = "hash-empty";
          empty.textContent = "·";
          chainEl.appendChild(empty);
        } else {
          chain.forEach(function (entry, j) {
            if (j > 0) {
              var arrow = document.createElement("span");
              arrow.className = "hash-arrow";
              arrow.setAttribute("aria-hidden", "true");
              arrow.textContent = "↓";
              chainEl.appendChild(arrow);
            }
            var node = document.createElement("div");
            node.className = "hash-entry";
            node.dataset.key = entry.key;
            if (opts.probeKey === entry.key) node.classList.add("is-probe");
            if (opts.hitKey === entry.key) node.classList.add("is-hit");
            if (opts.newKey === entry.key) node.classList.add("is-new");
            var k = document.createElement("span");
            k.className = "hash-entry-k";
            k.textContent = entry.key;
            var v = document.createElement("span");
            v.className = "hash-entry-v";
            v.textContent = entry.val;
            node.appendChild(k);
            node.appendChild(v);
            node.setAttribute(
              "aria-label",
              "Key " + entry.key + ", value " + entry.val
            );
            chainEl.appendChild(node);
          });
        }
        col.appendChild(chainEl);
        bucketsEl.appendChild(col);
      });
    }

    function findInBucket(index, key) {
      var chain = buckets[index];
      for (var i = 0; i < chain.length; i++) {
        if (chain[i].key === key) return i;
      }
      return -1;
    }

    function readKey() {
      var k = (keyInput && keyInput.value ? keyInput.value : "").trim();
      return k.slice(0, 8);
    }

    function readVal() {
      var v = (valInput && valInput.value ? valInput.value : "").trim();
      if (!v) v = "·";
      return v.slice(0, 8);
    }

    function runSteps(name, ctx) {
      clearStepTimers();
      var steps = STEPS[name] || [];
      var delay = reduceMotion ? 0 : 380;
      var pending = null;

      if (!steps.length) {
        if (ctx && typeof ctx.onDone === "function") ctx.onDone();
        return;
      }

      steps.forEach(function (step, i) {
        var id = window.setTimeout(function () {
          try {
            highlight(step.line, true);
            if (step.note) setCodeNote(step.note);

            if (step.visual === "hash" && ctx && typeof ctx.onHash === "function") {
              ctx.onHash();
            }
            if (step.visual === "bucket" && ctx && typeof ctx.onBucket === "function") {
              ctx.onBucket();
            }
            if (step.visual === "walk" && ctx && typeof ctx.onWalk === "function") {
              pending = ctx.onWalk();
            }
            if (step.visual === "commit" && ctx && typeof ctx.onCommit === "function") {
              ctx.onCommit(pending);
              pending = null;
            }

            if (i === steps.length - 1) {
              var doneId = window.setTimeout(function () {
                if (ctx && typeof ctx.onDone === "function") ctx.onDone();
              }, reduceMotion ? 0 : 260);
              stepTimers.push(doneId);
            }
          } catch (err) {
            console.error("[learn-hash] Step failed", {
              name: name,
              step: step,
              err: err
            });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(id);
      });
    }

    function seed() {
      emptyBuckets();
      var starters = [
        { key: "ab", val: "1" },
        { key: "ba", val: "2" },
        { key: "hi", val: "3" }
      ];
      starters.forEach(function (pair) {
        var i = hashKey(pair.key);
        buckets[i].push({ key: pair.key, val: pair.val });
      });
    }

    function doInsert() {
      if (busy) return;
      var key = readKey();
      if (!key) {
        setStatus("Enter a key to insert.");
        if (keyInput) keyInput.focus();
        return;
      }
      var val = readVal();
      var index = hashKey(key);
      var existing = findInBucket(index, key);
      busy = true;
      lastIndex = index;
      setFormula(key, index);

      var stepName = existing >= 0 ? "insertUpdate" : "insert";

      runSteps(stepName, {
        onHash: function () {
          paint({ hashingIndex: index });
        },
        onBucket: function () {
          paint({ targetIndex: index });
        },
        onWalk: function () {
          paint({ targetIndex: index, probeKey: key });
        },
        onCommit: function () {
          if (existing >= 0) {
            buckets[index][existing].val = val;
            paint({ targetIndex: index, hitKey: key });
            setStatus('Updated “' + key + '” → “' + val + '” in bucket ' + index + ".");
          } else {
            buckets[index].unshift({ key: key, val: val });
            paint({ targetIndex: index, newKey: key });
            var collided = buckets[index].length > 1;
            setStatus(
              'Inserted “' +
                key +
                '” → “' +
                val +
                '” at bucket ' +
                index +
                (collided ? " (collision — chained)." : ".")
            );
          }
        },
        onDone: function () {
          busy = false;
          setStatus(
            status
              ? status.textContent
              : "Ready."
          );
        }
      });
    }

    function doLookup() {
      if (busy) return;
      var key = readKey();
      if (!key) {
        setStatus("Enter a key to look up.");
        if (keyInput) keyInput.focus();
        return;
      }
      var index = hashKey(key);
      var at = findInBucket(index, key);
      busy = true;
      setFormula(key, index);

      runSteps(at >= 0 ? "lookup" : "lookupMiss", {
        onHash: function () {
          paint({ hashingIndex: index });
        },
        onBucket: function () {
          paint({ targetIndex: index });
        },
        onWalk: function () {
          paint({ targetIndex: index, probeKey: key });
        },
        onCommit: function () {
          if (at >= 0) {
            paint({ targetIndex: index, hitKey: key });
            setStatus(
              'Lookup “' + key + '” → “' + buckets[index][at].val + '” (bucket ' + index + ")."
            );
          } else {
            paint({ targetIndex: index });
            setStatus('Lookup “' + key + '” → miss (bucket ' + index + ").");
          }
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function doDelete() {
      if (busy) return;
      var key = readKey();
      if (!key) {
        setStatus("Enter a key to delete.");
        if (keyInput) keyInput.focus();
        return;
      }
      var index = hashKey(key);
      var at = findInBucket(index, key);
      if (at < 0) {
        highlight("del-unlink", true);
        setFormula(key, index);
        paint({ targetIndex: index });
        setCodeNote("Key not in the table — delete is a no-op.");
        setStatus('Delete “' + key + '” — not found.');
        return;
      }

      busy = true;
      setFormula(key, index);

      runSteps("delete", {
        onHash: function () {
          paint({ hashingIndex: index });
        },
        onBucket: function () {
          paint({ targetIndex: index, probeKey: key });
        },
        onCommit: function () {
          buckets[index].splice(at, 1);
          paint({ targetIndex: index });
          setStatus('Deleted “' + key + '” from bucket ' + index + ".");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function doReset() {
      if (busy) return;
      busy = true;
      seed();
      paint();
      setFormula("", -1);
      setStatus("Reset. Three pairs loaded — “ab” and “ba” collide. Try lookup or insert.");
      runSteps("reset", {
        onDone: function () {
          busy = false;
          setCodeNote(
            "Press <strong>Insert</strong>, <strong>Lookup</strong>, or <strong>Delete</strong> — each step of the matching function lights up."
          );
          clearHighlight();
        }
      });
    }

    document.querySelectorAll("[data-hash-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-hash-action");
        if (action === "insert") doInsert();
        else if (action === "lookup") doLookup();
        else if (action === "delete") doDelete();
        else if (action === "reset") doReset();
      });
    });

    function onEnter(e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      doInsert();
    }
    if (keyInput) keyInput.addEventListener("keydown", onEnter);
    if (valInput) valInput.addEventListener("keydown", onEnter);

    renderCode();
    seed();
    paint();
    clearHighlight();
    setStatus("Three pairs loaded — “ab” and “ba” collide. Try lookup or insert.");
    setFormula("", -1);
  }

  try {
    initHashTable();
  } catch (err) {
    console.error("[learn-hash] Init failed", err);
  }
})();
