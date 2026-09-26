/**
 * Variable slots with type tags; mutate vs rebind intuition + type diagram.
 */
(function () {
  function initVt() {
    var slotsEl = document.getElementById("vt-slots");
    var status = document.getElementById("vt-status");
    var meta = document.getElementById("vt-meta");
    var modeEl = document.getElementById("vt-mode");
    var codeRoot = document.getElementById("vt-code");
    var codeNote = document.getElementById("vt-code-note");
    if (!slotsEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var state = {
      x: { type: "number", value: 3, id: "n3" },
      items: { type: "object", value: [1, 2], id: "arr1" }
    };
    var nextId = 2;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setMode(label) {
      if (modeEl) modeEl.textContent = label;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function typeOf(binding) {
      return binding.type;
    }

    function displayValue(binding) {
      if (binding.type === "object") {
        return "[" + binding.value.join(", ") + "]";
      }
      if (binding.type === "string") return '"' + binding.value + '"';
      return String(binding.value);
    }

    function flashSlot(name) {
      var el = slotsEl.querySelector('[data-vt-slot="' + name + '"]');
      if (!el || reduceMotion) return;
      el.classList.remove("is-flash");
      void el.offsetWidth;
      el.classList.add("is-flash");
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
      var lines = [
        "let x = " + displayValue(state.x) + ";  // " + typeOf(state.x),
        "let items = " + displayValue(state.items) + ";  // object",
        "",
        "// identity: x@" + state.x.id + "  items@" + state.items.id
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

    function paint() {
      slotsEl.innerHTML = "";
      ["x", "items"].forEach(function (name) {
        var b = state[name];
        var slot = document.createElement("div");
        slot.className = "vt-slot";
        slot.dataset.vtSlot = name;
        slot.innerHTML =
          '<span class="vt-slot-name">' +
          name +
          '</span><span class="vt-slot-type">' +
          typeOf(b) +
          '</span><span class="vt-slot-val">' +
          displayValue(b) +
          '</span><span class="vt-slot-id" title="value identity">@' +
          b.id +
          "</span>";
        slotsEl.appendChild(slot);
      });
      if (meta) meta.textContent = typeOf(state.x);
      paintTypes(typeOf(state.x));
      renderCode();
    }

    function reset() {
      state = {
        x: { type: "number", value: 3, id: "n3" },
        items: { type: "object", value: [1, 2], id: "arr1" }
      };
      nextId = 2;
      setMode("reset");
      paint();
      flashSlot("x");
      flashSlot("items");
      setStatus("x holds a number; items holds a mutable list.");
      setCodeNote("Names on the left; values (and types) on the right.");
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
            state.items.value = state.items.value.concat([
              state.items.value.length + 1
            ]);
            setMode("mutate");
            paint();
            flashSlot("items");
            setStatus(
              "Mutated items in place — same @id, longer list."
            );
            setCodeNote(
              "Mutation keeps the <strong>same object identity</strong>."
            );
            return;
          }
          if (action === "rebind") {
            nextId += 1;
            state.x = {
              type: "string",
              value: "hi",
              id: "s" + nextId
            };
            setMode("rebind");
            paint();
            flashSlot("x");
            setStatus("Rebound x to a new string — new @id and type.");
            setCodeNote(
              "Rebind attaches the name to a <strong>different value</strong>."
            );
            return;
          }
          if (action === "set-num") {
            nextId += 1;
            state.x = { type: "number", value: 7, id: "n" + nextId };
            setMode("assign");
            paint();
            flashSlot("x");
            setStatus("Assigned x = 7 (number).");
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
            number: { type: "number", value: 42, id: "n" + nextId },
            string: { type: "string", value: "ok", id: "s" + nextId },
            boolean: { type: "boolean", value: true, id: "b" + nextId },
            object: { type: "object", value: [9], id: "o" + nextId }
          };
          if (!samples[t]) return;
          state.x = samples[t];
          setMode("type:" + t);
          paint();
          flashSlot("x");
          setStatus("Set x to a sample " + t + " value.");
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
