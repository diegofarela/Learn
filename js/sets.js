/**
 * Interactive set demo: membership universe + union/intersect + C highlighter.
 */
(function () {
  var DEFAULT_UNIVERSE = ["a", "b", "c", "d", "e", "f", "g", "h"];
  var SET_B = ["b", "d", "f"];
  var STARTER_A = ["a", "b", "c"];

  var CODE_LINES = [
    { html: '<span class="code-cm">/* set = unique membership */</span>' },
    { html: '<span class="code-type">void</span> <span class="code-fn">add</span>(Set *S, Item x) {', id: "add-sig" },
    { html: '  <span class="code-kw">if</span> (has(S, x)) <span class="code-kw">return</span>; <span class="code-cm">/* unique */</span>', id: "add-dup" },
    { html: '  insert(S, x);', id: "add-ins" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">void</span> <span class="code-fn">remove</span>(Set *S, Item x) {', id: "rem-sig" },
    { html: '  erase(S, x); <span class="code-cm">/* no-op if absent */</span>', id: "rem-erase" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">bool</span> <span class="code-fn">has</span>(Set *S, Item x) {', id: "has-sig" },
    { html: '  <span class="code-kw">return</span> find(S, x) != NULL;', id: "has-find" },
    { html: '}' },
    { blank: true },
    { html: 'Set <span class="code-fn">union_set</span>(Set A, Set B);', id: "union" },
    { html: 'Set <span class="code-fn">intersect</span>(Set A, Set B);', id: "inter" }
  ];

  var STEPS = {
    add: [
      { line: "add-sig", note: "Enter <strong>add</strong> with element x.", visual: "probe" },
      { line: "add-dup", note: "If already present, keep uniqueness — no insert.", visual: "dup" },
      { line: "add-ins", note: "Otherwise insert x into the set.", visual: "commit" }
    ],
    addDup: [
      { line: "add-sig", note: "Enter <strong>add</strong> with element x.", visual: "probe" },
      { line: "add-dup", note: "x already in A — <strong>return</strong>. Size unchanged.", visual: "dup" }
    ],
    remove: [
      { line: "rem-sig", note: "Enter <strong>remove</strong>.", visual: "probe" },
      { line: "rem-erase", note: "Erase x if present.", visual: "commit" }
    ],
    has: [
      { line: "has-sig", note: "Enter <strong>has</strong>.", visual: "probe" },
      { line: "has-find", note: "Membership test — true or false.", visual: "commit" }
    ],
    union: [
      { line: "union", note: "A ∪ B — every element in A or B (unique).", visual: "union" }
    ],
    intersect: [
      { line: "inter", note: "A ∩ B — only elements in both sets.", visual: "inter" }
    ],
    reset: [{ line: "add-sig", note: "Reset: A = {a, b, c}, B = {b, d, f}." }]
  };

  function initSets() {
    var universeEl = document.getElementById("set-universe");
    var setBEl = document.getElementById("set-b");
    var resultEl = document.getElementById("set-result");
    var status = document.getElementById("set-status");
    var sizeEl = document.getElementById("set-size");
    var opEl = document.getElementById("set-op");
    var input = document.getElementById("set-input");
    var codeRoot = document.getElementById("set-code");
    var codeNote = document.getElementById("set-code-note");
    if (!universeEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var universe = DEFAULT_UNIVERSE.slice();
    var setA = {};
    var highlight = {};
    var resultMode = null;
    var resultMembers = {};
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

    function setOp(label) {
      if (opEl) {
        opEl.textContent = label;
        opEl.dataset.op = label;
      }
    }

    function sizeOf(obj) {
      return Object.keys(obj).length;
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

    function paintB() {
      if (!setBEl) return;
      setBEl.innerHTML = SET_B.map(function (x) {
        return '<span class="set-chip set-chip-b">' + x + "</span>";
      }).join("");
    }

    function paintUniverse() {
      universeEl.innerHTML = "";
      universe.forEach(function (x) {
        var el = document.createElement("button");
        el.type = "button";
        el.className =
          "set-cell" +
          (setA[x] ? " is-in" : "") +
          (highlight[x] ? " is-" + highlight[x] : "");
        el.textContent = x;
        el.setAttribute("aria-pressed", setA[x] ? "true" : "false");
        el.title = setA[x] ? x + " ∈ A" : x + " ∉ A";
        el.addEventListener("click", function () {
          if (input) input.value = x;
        });
        universeEl.appendChild(el);
      });
      if (sizeEl) sizeEl.textContent = String(sizeOf(setA));
    }

    function paintResult() {
      if (!resultEl) return;
      if (!resultMode) {
        resultEl.innerHTML = "";
        return;
      }
      var keys = Object.keys(resultMembers).sort();
      resultEl.innerHTML =
        '<p class="set-result-label">' +
        resultMode +
        "</p>" +
        '<div class="set-chips">' +
        (keys.length
          ? keys
              .map(function (x) {
                return '<span class="set-chip is-result">' + x + "</span>";
              })
              .join("")
          : '<span class="set-empty">∅</span>') +
        "</div>";
    }

    function runSteps(name, onVisual, doneMsg) {
      clearTimers();
      busy = true;
      var list = STEPS[name] || [];
      var delay = reduceMotion ? 0 : 380;
      list.forEach(function (step, i) {
        var t = window.setTimeout(function () {
          try {
            highlightLine(step.line);
            setCodeNote(step.note);
            if (onVisual) onVisual(step.visual, i === list.length - 1);
            if (i === list.length - 1) {
              busy = false;
              if (doneMsg) setStatus(doneMsg);
            }
          } catch (err) {
            console.error("[learn-sets] Step failed", { name: name, i: i, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(t);
      });
      if (!list.length) busy = false;
    }

    function readElem() {
      var raw = input ? String(input.value || "").trim().toLowerCase() : "";
      if (!raw) return null;
      if (raw.length > 6) raw = raw.slice(0, 6);
      return raw;
    }

    function ensureInUniverse(x) {
      if (universe.indexOf(x) === -1) {
        if (universe.length >= 12) return false;
        universe.push(x);
      }
      return true;
    }

    function doAdd() {
      if (busy) return;
      var x = readElem();
      if (!x) {
        setStatus("Type an element (e.g. d), then Add.");
        return;
      }
      if (!ensureInUniverse(x)) {
        setStatus("Universe full — remove something first.");
        return;
      }
      resultMode = null;
      paintResult();
      setOp("add");
      var exists = Boolean(setA[x]);
      highlight = {};
      highlight[x] = "probe";
      paintUniverse();
      runSteps(
        exists ? "addDup" : "add",
        function (visual) {
          highlight = {};
          if (visual === "probe") highlight[x] = "probe";
          if (visual === "dup") highlight[x] = "dup";
          if (visual === "commit" && !exists) {
            setA[x] = true;
            highlight[x] = "hit";
          }
          paintUniverse();
        },
        exists
          ? "'" + x + "' already in A — uniqueness kept. |A| = " + sizeOf(setA) + "."
          : "Added '" + x + "'. |A| = " + sizeOf(setA) + "."
      );
    }

    function doRemove() {
      if (busy) return;
      var x = readElem();
      if (!x) {
        setStatus("Type an element to remove.");
        return;
      }
      resultMode = null;
      paintResult();
      setOp("remove");
      var existed = Boolean(setA[x]);
      highlight = {};
      highlight[x] = "probe";
      paintUniverse();
      runSteps(
        "remove",
        function (visual) {
          highlight = {};
          if (visual === "probe") highlight[x] = "probe";
          if (visual === "commit") {
            delete setA[x];
            highlight[x] = "miss";
          }
          paintUniverse();
        },
        existed
          ? "Removed '" + x + "'. |A| = " + (sizeOf(setA) - (setA[x] ? 1 : 0)) + "."
          : "'" + x + "' was not in A. |A| = " + sizeOf(setA) + "."
      );
      window.setTimeout(
        function () {
          setStatus(
            existed
              ? "Removed '" + x + "'. |A| = " + sizeOf(setA) + "."
              : "'" + x + "' was not in A. |A| = " + sizeOf(setA) + "."
          );
        },
        reduceMotion ? 0 : 800
      );
    }

    function doHas() {
      if (busy) return;
      var x = readElem();
      if (!x) {
        setStatus("Type an element to test.");
        return;
      }
      resultMode = null;
      paintResult();
      setOp("has?");
      var found = Boolean(setA[x]);
      runSteps(
        "has",
        function (visual) {
          highlight = {};
          highlight[x] = visual === "commit" ? (found ? "hit" : "miss") : "probe";
          paintUniverse();
        },
        found ? "'" + x + "' ∈ A — true." : "'" + x + "' ∉ A — false."
      );
    }

    function doUnion() {
      if (busy) return;
      setOp("union");
      resultMembers = {};
      Object.keys(setA).forEach(function (k) {
        resultMembers[k] = true;
      });
      SET_B.forEach(function (k) {
        resultMembers[k] = true;
      });
      resultMode = "A ∪ B";
      highlight = {};
      Object.keys(resultMembers).forEach(function (k) {
        highlight[k] = setA[k] && SET_B.indexOf(k) !== -1 ? "both" : "hit";
      });
      paintUniverse();
      paintResult();
      runSteps("union", null, "Union has " + sizeOf(resultMembers) + " unique elements.");
    }

    function doIntersect() {
      if (busy) return;
      setOp("intersect");
      resultMembers = {};
      SET_B.forEach(function (k) {
        if (setA[k]) resultMembers[k] = true;
      });
      resultMode = "A ∩ B";
      highlight = {};
      Object.keys(setA).forEach(function (k) {
        highlight[k] = resultMembers[k] ? "both" : "miss";
      });
      SET_B.forEach(function (k) {
        if (!highlight[k]) highlight[k] = "miss";
      });
      paintUniverse();
      paintResult();
      runSteps(
        "intersect",
        null,
        "Intersection: {" + Object.keys(resultMembers).sort().join(", ") + "}."
      );
    }

    function reset() {
      clearTimers();
      busy = false;
      setA = {};
      STARTER_A.forEach(function (x) {
        setA[x] = true;
      });
      highlight = {};
      resultMode = null;
      resultMembers = {};
      universe = DEFAULT_UNIVERSE.slice();
      paintUniverse();
      paintB();
      paintResult();
      highlightLine(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setOp("ready");
      setCodeNote("Press an operation — membership rules and set algebra light up.");
      setStatus("Set A starts with a, b, c. Try Add with a duplicate—it stays unique.");
      if (input) input.value = "";
    }

    document.querySelectorAll("[data-set-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-set-action");
        try {
          if (action === "add") doAdd();
          else if (action === "remove") doRemove();
          else if (action === "has") doHas();
          else if (action === "union") doUnion();
          else if (action === "intersect") doIntersect();
          else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-sets] Action failed", { action: action, err: err });
        }
      });
    });

    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          doAdd();
        }
      });
    }

    renderCode();
    reset();
  }

  try {
    initSets();
  } catch (err) {
    console.error("[learn-sets] Init failed", err);
  }
})();
