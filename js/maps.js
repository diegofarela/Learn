/**
 * Interactive map/dictionary demo: put/get/delete + C highlighter.
 */
(function () {
  var STARTER = [
    { k: "cat", v: "meow" },
    { k: "dog", v: "woof" },
    { k: "owl", v: "hoot" }
  ];

  var CODE_LINES = [
    { html: '<span class="code-cm">/* map: unique key → value */</span>' },
    { html: '<span class="code-type">void</span> <span class="code-fn">put</span>(Map *M, Key k, Val v) {', id: "put-sig" },
    { html: '  Entry *e = find(M, k);', id: "put-find" },
    { html: '  <span class="code-kw">if</span> (e) { e-&gt;v = v; <span class="code-kw">return</span>; } <span class="code-cm">/* update */</span>', id: "put-upd" },
    { html: '  insert(M, k, v); <span class="code-cm">/* often via hash */</span>', id: "put-ins" },
    { html: '}' },
    { blank: true },
    { html: 'Val <span class="code-fn">get</span>(Map *M, Key k) {', id: "get-sig" },
    { html: '  Entry *e = find(M, k);', id: "get-find" },
    { html: '  <span class="code-kw">return</span> e ? e-&gt;v : MISSING;', id: "get-ret" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">delete</span>(Map *M, Key k) {', id: "del-sig" },
    { html: '  unlink(M, k);', id: "del-unlink" },
    { html: '}' }
  ];

  var STEPS = {
    putNew: [
      { line: "put-sig", note: "Enter <strong>put</strong> with key and value." },
      { line: "put-find", note: "Look up the key — not present.", visual: "probe" },
      { line: "put-ins", note: "Insert a new key→value pair.", visual: "commit" }
    ],
    putUpd: [
      { line: "put-sig", note: "Enter <strong>put</strong> with key and value." },
      { line: "put-find", note: "Key already exists.", visual: "probe" },
      { line: "put-upd", note: "Overwrite the stored value.", visual: "commit" }
    ],
    getHit: [
      { line: "get-sig", note: "Enter <strong>get</strong>." },
      { line: "get-find", note: "Find the entry for this key.", visual: "probe" },
      { line: "get-ret", note: "Return the bound value.", visual: "hit" }
    ],
    getMiss: [
      { line: "get-sig", note: "Enter <strong>get</strong>." },
      { line: "get-find", note: "No entry for this key.", visual: "probe" },
      { line: "get-ret", note: "Return <strong>MISSING</strong>.", visual: "miss" }
    ],
    "delete": [
      { line: "del-sig", note: "Enter <strong>delete</strong>." },
      { line: "del-unlink", note: "Unlink the key→value pair.", visual: "commit" }
    ],
    reset: [{ line: "put-sig", note: "Reset demo: three starter pairs." }]
  };

  function initMaps() {
    var pairsEl = document.getElementById("map-pairs");
    var status = document.getElementById("map-status");
    var sizeEl = document.getElementById("map-size");
    var formulaEl = document.getElementById("map-formula");
    var keyInput = document.getElementById("map-key");
    var valInput = document.getElementById("map-val");
    var codeRoot = document.getElementById("map-code");
    var codeNote = document.getElementById("map-code-note");
    if (!pairsEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pairs = [];
    var focusKey = null;
    var focusKind = null;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};

    function clearTimers() {
      stepTimers.forEach(function (t) {
        window.clearTimeout(t);
      });
      stepTimers = [];
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function setFormula(html) {
      if (formulaEl) formulaEl.innerHTML = html;
    }

    function findIndex(k) {
      for (var i = 0; i < pairs.length; i++) {
        if (pairs[i].k === k) return i;
      }
      return -1;
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

    function highlightLine(id) {
      Object.keys(lineEls).forEach(function (key) {
        var el = lineEls[key];
        el.classList.toggle("is-active", key === id);
        el.classList.toggle("is-dim", Boolean(id) && key !== id);
      });
    }

    function paint() {
      pairsEl.innerHTML = "";
      if (!pairs.length) {
        var empty = document.createElement("p");
        empty.className = "map-empty";
        empty.textContent = "Map empty — Put a key and value.";
        pairsEl.appendChild(empty);
      } else {
        pairs.forEach(function (p) {
          var row = document.createElement("div");
          row.className =
            "map-pair" +
            (focusKey === p.k ? " is-" + (focusKind || "focus") : "");
          row.innerHTML =
            '<span class="map-pair-k">' +
            p.k +
            "</span>" +
            '<span class="map-pair-arrow" aria-hidden="true">→</span>' +
            '<span class="map-pair-v">' +
            p.v +
            "</span>";
          pairsEl.appendChild(row);
        });
      }
      if (sizeEl) sizeEl.textContent = String(pairs.length);
    }

    function runSteps(name, onVisual, doneMsg) {
      clearTimers();
      busy = true;
      var list = STEPS[name] || [];
      var delay = reduceMotion ? 0 : 360;
      list.forEach(function (step, i) {
        var t = window.setTimeout(function () {
          try {
            highlightLine(step.line);
            setCodeNote(step.note);
            if (onVisual && step.visual) onVisual(step.visual);
            if (i === list.length - 1) {
              busy = false;
              if (doneMsg) setStatus(doneMsg);
            }
          } catch (err) {
            console.error("[learn-maps] Step failed", { name: name, i: i, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(t);
      });
      if (!list.length) busy = false;
    }

    function readKey() {
      var raw = keyInput ? String(keyInput.value || "").trim() : "";
      if (!raw) return null;
      return raw.slice(0, 8);
    }

    function readVal() {
      var raw = valInput ? String(valInput.value || "").trim() : "";
      return raw ? raw.slice(0, 8) : "";
    }

    function doPut() {
      if (busy) return;
      var k = readKey();
      var v = readVal();
      if (!k) {
        setStatus("Enter a key (and optional value), then Put.");
        return;
      }
      if (!v) v = "…";
      var idx = findIndex(k);
      var isUpdate = idx !== -1;
      setFormula("put(<strong>" + k + "</strong>, <strong>" + v + "</strong>)");
      focusKey = k;
      focusKind = "probe";
      paint();
      runSteps(
        isUpdate ? "putUpd" : "putNew",
        function (visual) {
          if (visual === "probe") {
            focusKind = "probe";
          } else if (visual === "commit") {
            if (isUpdate) pairs[idx].v = v;
            else pairs.push({ k: k, v: v });
            focusKind = "hit";
          }
          paint();
        },
        null
      );
      window.setTimeout(
        function () {
          setStatus(
            (isUpdate ? "Updated" : "Inserted") +
              " '" +
              k +
              "' → '" +
              v +
              "'. n = " +
              pairs.length +
              "."
          );
        },
        reduceMotion ? 0 : 750
      );
    }

    function doGet() {
      if (busy) return;
      var k = readKey();
      if (!k) {
        setStatus("Enter a key to Get.");
        return;
      }
      var idx = findIndex(k);
      var hit = idx !== -1;
      setFormula("get(<strong>" + k + "</strong>)");
      focusKey = k;
      focusKind = "probe";
      paint();
      runSteps(
        hit ? "getHit" : "getMiss",
        function (visual) {
          focusKind = visual === "hit" ? "hit" : visual === "miss" ? "miss" : "probe";
          paint();
        },
        hit
          ? "get('" + k + "') → '" + pairs[idx].v + "'."
          : "get('" + k + "') → MISSING."
      );
    }

    function doDelete() {
      if (busy) return;
      var k = readKey();
      if (!k) {
        setStatus("Enter a key to Delete.");
        return;
      }
      var idx = findIndex(k);
      setFormula("delete(<strong>" + k + "</strong>)");
      focusKey = k;
      focusKind = "probe";
      paint();
      runSteps(
        "delete",
        function (visual) {
          if (visual === "commit" && idx !== -1) {
            pairs.splice(idx, 1);
            focusKey = null;
          } else {
            focusKind = idx === -1 ? "miss" : "probe";
          }
          paint();
        },
        idx !== -1
          ? "Deleted '" + k + "'. n = " + (pairs.length - 1) + "."
          : "Key '" + k + "' was not in the map."
      );
      window.setTimeout(
        function () {
          setStatus(
            idx !== -1
              ? "Deleted '" + k + "'. n = " + pairs.length + "."
              : "Key '" + k + "' was not in the map."
          );
        },
        reduceMotion ? 0 : 750
      );
    }

    function reset() {
      clearTimers();
      busy = false;
      pairs = STARTER.map(function (p) {
        return { k: p.k, v: p.v };
      });
      focusKey = null;
      focusKind = null;
      paint();
      highlightLine(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setFormula("map[key] → value");
      setCodeNote(
        "Press <strong>Put</strong>, <strong>Get</strong>, or <strong>Delete</strong> — the matching map operation lights up."
      );
      setStatus("Three pairs loaded. Try Get on “cat” or Put a new key.");
      if (keyInput) keyInput.value = "";
      if (valInput) valInput.value = "";
    }

    document.querySelectorAll("[data-map-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-map-action");
        try {
          if (action === "put") doPut();
          else if (action === "get") doGet();
          else if (action === "delete") doDelete();
          else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-maps] Action failed", { action: action, err: err });
        }
      });
    });

    renderCode();
    reset();
  }

  try {
    initMaps();
  } catch (err) {
    console.error("[learn-maps] Init failed", err);
  }
})();
