/**
 * Interactive memory map: pointer arrow, & / * with C code highlighting.
 */
(function () {
  var SLOTS = [
    { addr: "0x1004", value: 3 },
    { addr: "0x1008", value: 7, label: "x" },
    { addr: "0x100C", value: 11 },
    { addr: "0x1010", value: 0 }
  ];

  var CODE_LINES = [
    { html: '<span class="code-type">int</span> x = <span class="code-num">7</span>;', id: "decl-x" },
    { html: '<span class="code-type">int</span> *p;', id: "decl-p" },
    { blank: true },
    { html: 'p = &amp;x; <span class="code-cm">/* address of x */</span>', id: "point" },
    { blank: true },
    { html: '<span class="code-type">int</span> v = *p; <span class="code-cm">/* read through p */</span>', id: "deref" },
    { blank: true },
    { html: '*p = v; <span class="code-cm">/* write through p */</span>', id: "write" }
  ];

  var STEPS = {
    point: [
      { line: "point", note: "Store the address of the chosen slot in <strong>p</strong>.", visual: "commit" }
    ],
    deref: [
      { line: "deref", note: "Follow <strong>p</strong> and read the value at that address.", visual: "commit" }
    ],
    write: [
      { line: "write", note: "Write through <strong>*p</strong> — the pointed-at slot changes.", visual: "commit" }
    ],
    reset: [
      { line: "decl-x", note: "Reset: <strong>x = 7</strong>, <strong>p = &amp;x</strong>." }
    ]
  };

  function initMem() {
    var slotsRoot = document.getElementById("mem-slots");
    var status = document.getElementById("mem-status");
    var pLabel = document.getElementById("mem-p-label");
    var pVal = document.getElementById("mem-p-val");
    var xVal = document.getElementById("mem-x-val");
    var readout = document.getElementById("mem-readout");
    var targetSelect = document.getElementById("mem-target");
    var writeInput = document.getElementById("mem-write");
    var codeRoot = document.getElementById("mem-code");
    var codeNote = document.getElementById("mem-code-note");
    var arrowPath = document.getElementById("mem-arrow-path");
    if (!slotsRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};
    var memory = SLOTS.map(function (s) {
      return { addr: s.addr, value: s.value, label: s.label || null };
    });
    var ptr = "0x1008";

    function setStatus(msg) {
      if (status) status.textContent = msg;
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

    function findSlot(addr) {
      for (var i = 0; i < memory.length; i++) {
        if (memory[i].addr === addr) return memory[i];
      }
      return null;
    }

    function xSlot() {
      return findSlot("0x1008");
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
    }

    function clearHighlight() {
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
    }

    function arrowTargetIndex() {
      for (var i = 0; i < memory.length; i++) {
        if (memory[i].addr === ptr) return i;
      }
      return 1;
    }

    function updateArrow() {
      if (!arrowPath) return;
      var idx = arrowTargetIndex();
      var y = 28 + idx * 36;
      arrowPath.setAttribute(
        "d",
        "M10 110 C55 110, 55 " + y + ", 110 " + y
      );
    }

    function paint() {
      var x = xSlot();
      if (xVal && x) xVal.textContent = String(x.value);
      if (pVal) pVal.textContent = ptr;
      if (pLabel) pLabel.textContent = ptr;

      var pointed = findSlot(ptr);
      if (readout) {
        readout.textContent = pointed
          ? "*p = " + pointed.value
          : "*p = ?";
      }

      slotsRoot.innerHTML = "";
      memory.forEach(function (slot, i) {
        var cell = document.createElement("div");
        cell.className = "mem-slot";
        cell.dataset.addr = slot.addr;
        if (slot.addr === ptr) cell.classList.add("is-pointed");
        if (slot.label === "x") cell.classList.add("is-x");

        cell.innerHTML =
          '<span class="mem-slot-addr">' +
          slot.addr +
          '</span><span class="mem-slot-val">' +
          slot.value +
          "</span>" +
          (slot.label
            ? '<span class="mem-slot-tag">' + slot.label + "</span>"
            : "");

        cell.style.setProperty("--i", String(i));
        slotsRoot.appendChild(cell);
      });

      updateArrow();
    }

    function flashSlot(addr, klass) {
      var el = slotsRoot.querySelector('.mem-slot[data-addr="' + addr + '"]');
      if (!el) return;
      el.classList.add(klass);
      if (!reduceMotion) {
        window.setTimeout(function () {
          el.classList.remove(klass);
        }, 700);
      } else {
        window.setTimeout(function () {
          el.classList.remove(klass);
        }, 0);
      }
    }

    function runSteps(name, ctx) {
      clearStepTimers();
      var steps = STEPS[name] || [];
      var delay = reduceMotion ? 0 : 380;

      if (!steps.length) {
        if (ctx && typeof ctx.onDone === "function") ctx.onDone();
        return;
      }

      steps.forEach(function (step, i) {
        var id = window.setTimeout(function () {
          try {
            highlight(step.line, true);
            if (step.note) setCodeNote(step.note);
            if (step.visual === "commit" && ctx && typeof ctx.onCommit === "function") {
              ctx.onCommit();
            }
            if (i === steps.length - 1) {
              var doneId = window.setTimeout(function () {
                if (ctx && typeof ctx.onDone === "function") ctx.onDone();
              }, reduceMotion ? 0 : 220);
              stepTimers.push(doneId);
            }
          } catch (err) {
            console.error("[learn-mem] Step failed", { name: name, step: step, err: err });
            busy = false;
          }
        }, i * delay);
        stepTimers.push(id);
      });
    }

    function pointAt() {
      if (busy) return;
      var addr = targetSelect ? targetSelect.value : "0x1008";
      if (!findSlot(addr)) {
        setStatus("Unknown address — pick a listed slot.");
        return;
      }
      busy = true;
      runSteps("point", {
        onCommit: function () {
          ptr = addr;
          paint();
          flashSlot(addr, "is-access");
          setStatus("p = " + addr + (addr === "0x1008" ? " (&x)." : "."));
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function deref() {
      if (busy) return;
      var slot = findSlot(ptr);
      if (!slot) {
        setStatus("p is dangling — set it first.");
        return;
      }
      busy = true;
      runSteps("deref", {
        onCommit: function () {
          paint();
          flashSlot(ptr, "is-access");
          setStatus("Read *p → " + slot.value + " (at " + ptr + ").");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function writeThrough() {
      if (busy) return;
      var slot = findSlot(ptr);
      if (!slot) {
        setStatus("p is dangling — set it first.");
        return;
      }
      var raw = writeInput ? Number(writeInput.value) : 0;
      if (!isFinite(raw)) {
        setStatus("Enter a numeric value to write.");
        return;
      }
      var v = Math.max(0, Math.min(99, Math.floor(raw)));
      busy = true;
      runSteps("write", {
        onCommit: function () {
          slot.value = v;
          paint();
          flashSlot(ptr, "is-write");
          setStatus("Wrote *p = " + v + " at " + ptr + ".");
        },
        onDone: function () {
          busy = false;
        }
      });
    }

    function reset() {
      if (busy) return;
      busy = true;
      memory = SLOTS.map(function (s) {
        return { addr: s.addr, value: s.value, label: s.label || null };
      });
      ptr = "0x1008";
      if (targetSelect) targetSelect.value = "0x1008";
      if (writeInput) writeInput.value = "42";
      paint();
      setStatus("Reset. p holds 0x1008 — the address of x.");
      runSteps("reset", {
        onDone: function () {
          busy = false;
          clearHighlight();
          setCodeNote(
            "Press a control — <strong>&amp;</strong> takes an address, <strong>*</strong> follows it."
          );
        }
      });
    }

    document.querySelectorAll("[data-mem-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-mem-action");
        if (action === "point") pointAt();
        else if (action === "deref") deref();
        else if (action === "write") writeThrough();
        else if (action === "reset") reset();
      });
    });

    renderCode();
    paint();
    clearHighlight();
    setStatus("p holds 0x1008 — the address of x. Read or write through *p.");
  }

  try {
    initMem();
  } catch (err) {
    console.error("[learn-mem] Init failed", err);
  }
})();
