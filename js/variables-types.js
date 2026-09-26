/**
 * Variable slots with type tags; mutate vs rebind intuition + type diagram.
 * Visual: each row is name → arrow → memory cell (orphans below).
 */
(function () {
  function initVt() {
    var rowsEl = document.getElementById("vt-rows");
    var orphansEl = document.getElementById("vt-orphans");
    var mapEl = document.getElementById("vt-map");
    var status = document.getElementById("vt-status");
    var meta = document.getElementById("vt-meta");
    var modeEl = document.getElementById("vt-mode");
    var actionTag = document.getElementById("vt-action-tag");
    var codeRoot = document.getElementById("vt-code");
    var codeNote = document.getElementById("vt-code-note");
    if (!rowsEl || !orphansEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** @type {{ bindings: Object.<string, string>, heap: Object.<string, {type: string, value: *}>, orphans: string[] }} */
    var state;
    var nextId = 2;
    var lastAction = "";
    var flashTargets = { names: [], cells: [], orphans: [] };

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setMode(label) {
      if (modeEl) modeEl.textContent = label;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function setActionTag(text, kind) {
      if (!actionTag) return;
      actionTag.textContent = text || "";
      actionTag.dataset.kind = kind || "";
      actionTag.hidden = !text;
    }

    function displayValue(cell) {
      if (cell.type === "object") {
        return "[" + cell.value.join(", ") + "]";
      }
      if (cell.type === "string") return '"' + cell.value + '"';
      return String(cell.value);
    }

    function bindingOf(name) {
      return state.bindings[name];
    }

    function cellOf(id) {
      return state.heap[id];
    }

    function referredIds() {
      var ids = {};
      Object.keys(state.bindings).forEach(function (name) {
        ids[state.bindings[name]] = true;
      });
      return ids;
    }

    function paintTypes(active) {
      document.querySelectorAll(".vt-type").forEach(function (btn) {
        btn.classList.toggle(
          "is-active",
          btn.getAttribute("data-vt-type") === active
        );
      });
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      var xCell = cellOf(bindingOf("x"));
      var itemsCell = cellOf(bindingOf("items"));
      var lines = [
        "let x = " + displayValue(xCell) + ";  // " + xCell.type,
        "let items = " + displayValue(itemsCell) + ";  // object",
        "",
        "// x → @" + bindingOf("x") + "   items → @" + bindingOf("items")
      ];
      lines.forEach(function (src, i) {
        var line = document.createElement("div");
        var dim = !src;
        line.className = "code-line" + (dim ? " is-dim" : " is-active");
        line.innerHTML =
          '<span class="code-ln">' +
          (src ? i + 1 : "") +
          '</span><span class="code-src">' +
          (src
            ? src.replace(
                /(\d+|object|number|string|boolean)/g,
                '<span class="code-num">$1</span>'
              )
            : "") +
          "</span>";
        codeRoot.appendChild(line);
      });
    }

    function flashClass(el, cls) {
      if (!el || reduceMotion) return;
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    function cellHtml(id, opts) {
      var cell = state.heap[id];
      if (!cell) return "";
      var isOrphan = !!opts.orphan;
      var pointedBy = opts.pointedBy || [];
      return (
        '<div class="vt-cell' +
        (isOrphan ? " is-orphan" : "") +
        (pointedBy.indexOf("x") !== -1 ? " is-x" : "") +
        (pointedBy.indexOf("items") !== -1 ? " is-items" : "") +
        '" data-vt-cell="' +
        id +
        '">' +
        '<div class="vt-cell-top">' +
        '<span class="vt-cell-addr">@' +
        id +
        "</span>" +
        '<span class="vt-cell-type">' +
        cell.type +
        "</span>" +
        (isOrphan ? '<span class="vt-cell-orphan-tag">unbound</span>' : "") +
        "</div>" +
        '<div class="vt-cell-val">' +
        displayValue(cell) +
        "</div>" +
        '<div class="vt-cell-refs">' +
        (pointedBy.length
          ? "← " + pointedBy.join(", ")
          : "no name points here") +
        "</div></div>"
      );
    }

    function paint() {
      var live = referredIds();
      var xId = bindingOf("x");

      rowsEl.innerHTML = "";
      ["x", "items"].forEach(function (name) {
        var id = bindingOf(name);
        var cell = cellOf(id);
        var row = document.createElement("div");
        row.className = "vt-row";
        row.dataset.vtName = name;
        row.innerHTML =
          '<div class="vt-name">' +
          '<span class="vt-name-label">' +
          name +
          '</span><span class="vt-name-type">' +
          cell.type +
          "</span></div>" +
          '<div class="vt-link" aria-hidden="true">' +
          '<svg class="vt-arrow" viewBox="0 0 48 24">' +
          '<path class="vt-arrow-path" d="M2 12 H38" fill="none" />' +
          '<path class="vt-arrow-head" d="M34 6 L46 12 L34 18 Z" />' +
          "</svg>" +
          '<span class="vt-arrow-meta">→ @' +
          id +
          "</span></div>" +
          cellHtml(id, { pointedBy: [name] });
        rowsEl.appendChild(row);
      });

      var orphanIds = state.orphans.filter(function (id) {
        return state.heap[id] && !live[id];
      });
      orphansEl.innerHTML = "";
      orphanIds.forEach(function (id) {
        orphansEl.insertAdjacentHTML(
          "beforeend",
          cellHtml(id, { orphan: true, pointedBy: [] })
        );
      });
      orphansEl.hidden = orphanIds.length === 0;

      if (meta) meta.textContent = cellOf(xId).type;
      paintTypes(cellOf(xId).type);
      renderCode();

      if (mapEl) mapEl.dataset.action = lastAction || "";

      flashTargets.names.forEach(function (name) {
        flashClass(
          rowsEl.querySelector('[data-vt-name="' + name + '"]'),
          lastAction === "rebind" ||
            lastAction === "assign" ||
            lastAction === "type"
            ? "is-rebind"
            : "is-flash"
        );
      });
      flashTargets.cells.forEach(function (id) {
        flashClass(
          mapEl.querySelector('[data-vt-cell="' + id + '"]'),
          lastAction === "mutate" ? "is-mutate" : "is-flash"
        );
      });
      flashTargets.orphans.forEach(function (id) {
        flashClass(
          orphansEl.querySelector('[data-vt-cell="' + id + '"]'),
          "is-orphan-flash"
        );
      });
      flashTargets = { names: [], cells: [], orphans: [] };
    }

    function markOrphan(id) {
      if (referredIds()[id]) return;
      if (state.orphans.indexOf(id) === -1) state.orphans.push(id);
    }

    function clearStaleOrphans() {
      if (state.orphans.length > 1) {
        var keep = state.orphans[state.orphans.length - 1];
        state.orphans.slice(0, -1).forEach(function (id) {
          if (!referredIds()[id]) delete state.heap[id];
        });
        state.orphans = referredIds()[keep] ? [] : [keep];
      }
    }

    function reset() {
      state = {
        bindings: { x: "n3", items: "arr1" },
        heap: {
          n3: { type: "number", value: 3 },
          arr1: { type: "object", value: [1, 2] }
        },
        orphans: []
      };
      nextId = 2;
      lastAction = "reset";
      flashTargets = { names: ["x", "items"], cells: ["n3", "arr1"], orphans: [] };
      setMode("reset");
      setActionTag("names point at memory cells", "idle");
      paint();
      setStatus(
        "x → @n3 (number 3). items → @arr1 ([1, 2]). Mutate keeps the arrow; rebind moves it."
      );
      setCodeNote("Names on the left; values live in memory cells on the right.");
    }

    document.querySelectorAll("[data-vt-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-vt-action");
          if (action === "reset") {
            reset();
            return;
          }
          if (action === "mutate") {
            var itemsId = bindingOf("items");
            var cell = cellOf(itemsId);
            cell.value = cell.value.concat([cell.value.length + 1]);
            lastAction = "mutate";
            flashTargets = { names: ["items"], cells: [itemsId], orphans: [] };
            clearStaleOrphans();
            setMode("mutate");
            setActionTag("mutate · same cell, new contents", "mutate");
            paint();
            setStatus(
              "Mutated @" +
                itemsId +
                " in place — arrow still points here, list grew to " +
                displayValue(cell) +
                "."
            );
            setCodeNote(
              "Mutation keeps the <strong>same memory cell</strong> and identity."
            );
            return;
          }
          if (action === "rebind") {
            var oldId = bindingOf("x");
            nextId += 1;
            var newId = "s" + nextId;
            state.heap[newId] = { type: "string", value: "hi" };
            state.bindings.x = newId;
            markOrphan(oldId);
            clearStaleOrphans();
            lastAction = "rebind";
            flashTargets = {
              names: ["x"],
              cells: [newId],
              orphans: referredIds()[oldId] ? [] : [oldId]
            };
            setMode("rebind");
            setActionTag("rebind · name points at a new cell", "rebind");
            paint();
            setStatus(
              "Rebound x: arrow left @" +
                oldId +
                " and now points at @" +
                newId +
                ' ("hi").'
            );
            setCodeNote(
              "Rebind moves the arrow to a <strong>different memory cell</strong>."
            );
            return;
          }
          if (action === "set-num") {
            var prevId = bindingOf("x");
            nextId += 1;
            var numId = "n" + nextId;
            state.heap[numId] = { type: "number", value: 7 };
            state.bindings.x = numId;
            markOrphan(prevId);
            clearStaleOrphans();
            lastAction = "assign";
            flashTargets = {
              names: ["x"],
              cells: [numId],
              orphans: referredIds()[prevId] ? [] : [prevId]
            };
            setMode("assign");
            setActionTag("assign · new number cell", "rebind");
            paint();
            setStatus("Assigned x = 7 — new cell @" + numId + ".");
            setCodeNote("Assignment can change both value and type (dynamic).");
          }
        } catch (err) {
          console.error("[learn-vt] Action failed", err);
        }
      });
    });

    document.querySelectorAll("[data-vt-type]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var t = btn.getAttribute("data-vt-type");
          nextId += 1;
          var samples = {
            number: { type: "number", value: 42, prefix: "n" },
            string: { type: "string", value: "ok", prefix: "s" },
            boolean: { type: "boolean", value: true, prefix: "b" },
            object: { type: "object", value: [9], prefix: "o" }
          };
          var sample = samples[t];
          if (!sample) return;
          var prev = bindingOf("x");
          var id = sample.prefix + nextId;
          state.heap[id] = { type: sample.type, value: sample.value };
          state.bindings.x = id;
          markOrphan(prev);
          clearStaleOrphans();
          lastAction = "type";
          flashTargets = {
            names: ["x"],
            cells: [id],
            orphans: referredIds()[prev] ? [] : [prev]
          };
          setMode("type:" + t);
          setActionTag("rebind · sample " + t, "rebind");
          paint();
          setStatus("Set x to a sample " + t + " in @" + id + ".");
          setCodeNote("Type diagram highlights the active kind for <code>x</code>.");
        } catch (err) {
          console.error("[learn-vt] Type pick failed", err);
        }
      });
    });

    reset();
  }

  try {
    initVt();
  } catch (err) {
    console.error("[learn-vt] Init failed", err);
  }
})();
