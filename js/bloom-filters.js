/**
 * Bloom filter: bit array add / membership query with false positives.
 */
(function () {
  var M = 16;
  var K = 3;

  var CODE_LINES = [
    { html: '<span class="code-type">void</span> <span class="code-fn">add</span>(item) {', id: "add" },
    { html: '  <span class="code-kw">for</span> (i <span class="code-kw">in</span> 0..k-1)', id: "add-loop" },
    { html: '    bits[h_i(item) % m] = 1;', id: "set" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">Answer</span> <span class="code-fn">mightContain</span>(item) {', id: "query" },
    { html: '  <span class="code-kw">for</span> (i <span class="code-kw">in</span> 0..k-1)', id: "q-loop" },
    { html: '    <span class="code-kw">if</span> (bits[h_i(item)%m]==0) <span class="code-kw">return</span> NO;', id: "no" },
    { html: '  <span class="code-kw">return</span> MAYBE; <span class="code-cm">/* FP possible */</span>', id: "maybe" },
    { html: '}' }
  ];

  function hash(str, seed) {
    var h = seed * 0x9e3779b9;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
      h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
      h ^= h >>> 16;
    }
    return (h >>> 0) % M;
  }

  function indices(item) {
    var out = [];
    for (var i = 0; i < K; i++) {
      out.push(hash(item, i + 1));
    }
    return out;
  }

  function initBloom() {
    var bitsEl = document.getElementById("bloom-bits");
    var itemInput = document.getElementById("bloom-item");
    var addedEl = document.getElementById("bloom-added");
    var status = document.getElementById("bloom-status");
    var badge = document.getElementById("bloom-badge");
    var countEl = document.getElementById("bloom-set-count");
    var codeRoot = document.getElementById("bloom-code");
    var codeNote = document.getElementById("bloom-code-note");
    if (!bitsEl || !itemInput) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var bits = new Array(M).fill(0);
    var added = [];
    var trueSet = {};
    var lineEls = {};
    var stepTimers = [];
    var focus = [];

    function clearTimers() {
      stepTimers.forEach(function (t) {
        window.clearTimeout(t);
      });
      stepTimers = [];
    }

    function after(ms, fn) {
      if (reduceMotion) {
        fn();
        return;
      }
      stepTimers.push(window.setTimeout(fn, ms));
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE_LINES.forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        if (line.blank) row.innerHTML = "&nbsp;";
        else row.innerHTML = line.html || "&nbsp;";
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        codeRoot.appendChild(row);
      });
    }

    function highlight(id) {
      Object.keys(lineEls).forEach(function (k) {
        lineEls[k].classList.remove("is-active");
      });
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function setCount() {
      var n = bits.reduce(function (a, b) {
        return a + b;
      }, 0);
      if (countEl) countEl.textContent = String(n);
      setBadge(n === 0 ? "empty" : n + " bits on");
    }

    function renderBits() {
      bitsEl.innerHTML = "";
      for (var i = 0; i < M; i++) {
        var cell = document.createElement("span");
        cell.className = "bloom-bit";
        if (bits[i]) cell.classList.add("is-on");
        if (focus.indexOf(i) !== -1) cell.classList.add("is-focus");
        cell.innerHTML =
          '<span class="bloom-bit-idx">' +
          i +
          '</span><span class="bloom-bit-val">' +
          bits[i] +
          "</span>";
        bitsEl.appendChild(cell);
      }
      if (addedEl) {
        addedEl.textContent =
          "Added: " + (added.length ? added.join(", ") : "(none)");
      }
      setCount();
    }

    function itemVal() {
      return String(itemInput.value || "").trim().toLowerCase() || "item";
    }

    function add() {
      clearTimers();
      var item = itemVal();
      var idx = indices(item);
      highlight("add");
      setCodeNote("Adding <strong>" + item + "</strong> with k=" + K + " hashes.");
      focus = [];
      renderBits();

      var i = 0;
      function step() {
        if (i >= idx.length) {
          if (added.indexOf(item) === -1) added.push(item);
          trueSet[item] = true;
          highlight("set");
          setStatus("Added “" + item + "”. Bits set at [" + idx.join(", ") + "].");
          setCodeNote("All hash positions written to 1.");
          focus = idx.slice();
          renderBits();
          return;
        }
        var pos = idx[i++];
        bits[pos] = 1;
        focus = [pos];
        highlight(i === 1 ? "add-loop" : "set");
        setCodeNote("Set bit <strong>" + pos + "</strong>.");
        renderBits();
        after(reduceMotion ? 0 : 280, step);
      }
      after(reduceMotion ? 0 : 120, step);
    }

    function query() {
      clearTimers();
      var item = itemVal();
      var idx = indices(item);
      highlight("query");
      setCodeNote("Query <strong>" + item + "</strong>.");
      focus = [];
      renderBits();

      var i = 0;
      function step() {
        if (i >= idx.length) {
          focus = idx.slice();
          renderBits();
          var really = !!trueSet[item];
          highlight("maybe");
          if (really) {
            setStatus("MAYBE — and it was actually added (true positive).");
            setCodeNote("All bits set · item really in the set.");
          } else {
            setStatus(
              "MAYBE — but it was never added (false positive). Bits collided."
            );
            setCodeNote("False positive: all bits 1 from other items.");
          }
          return;
        }
        var pos = idx[i];
        focus = [pos];
        renderBits();
        if (bits[pos] === 0) {
          highlight("no");
          setCodeNote("Bit <strong>" + pos + "</strong> is 0 → definitely NO.");
          setStatus("NO — “" + item + "” was never added (certain).");
          return;
        }
        highlight("q-loop");
        setCodeNote("Bit <strong>" + pos + "</strong> is 1 — keep checking.");
        i++;
        after(reduceMotion ? 0 : 300, step);
      }
      after(reduceMotion ? 0 : 120, step);
    }

    function reset() {
      clearTimers();
      bits = new Array(M).fill(0);
      added = [];
      trueSet = {};
      focus = [];
      highlight(null);
      setCodeNote("Add sets bits; query checks all hash positions.");
      setStatus("Empty filter. Add items, then query — “no” is certain; “maybe” is not.");
      renderBits();
    }

    renderCode();
    renderBits();

    document.querySelectorAll("[data-bloom-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-bloom-action");
        if (a === "add") add();
        else if (a === "query") query();
        else if (a === "reset") reset();
      });
    });

    itemInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") add();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBloom);
  } else {
    initBloom();
  }
})();
