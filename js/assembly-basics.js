/**
 * Assembly basics: register file + memory; step MOV/ADD/CALL/RET.
 */
(function () {
  var PROGRAM = [
    { op: "MOV", args: ["R0", "5"], text: "MOV R0, 5" },
    { op: "MOV", args: ["R1", "3"], text: "MOV R1, 3" },
    { op: "CALL", args: ["add"], text: "CALL add" },
    { op: "HALT", args: [], text: "HALT" },
    { op: "ADD", args: ["R0", "R1"], text: "ADD R0, R1", label: "add" },
    { op: "RET", args: [], text: "RET" }
  ];

  function init() {
    var regsEl = document.getElementById("asm-regs");
    var memEl = document.getElementById("asm-mem");
    var insnEl = document.getElementById("asm-insn");
    var status = document.getElementById("asm-status");
    var phase = document.getElementById("asm-phase");
    var meta = document.getElementById("asm-meta");
    var codeRoot = document.getElementById("asm-code");
    var codeNote = document.getElementById("asm-code-note");
    if (!regsEl) return;

    var regs = { R0: 0, R1: 0, R2: 0, SP: 7 };
    var mem = [0, 0, 0, 0, 0, 0, 0, 0];
    var pc = 0;
    var halted = false;
    var labels = {};
    PROGRAM.forEach(function (ins, i) {
      if (ins.label) labels[ins.label] = i;
    });

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      PROGRAM.forEach(function (ins, i) {
        var el = document.createElement("div");
        el.className =
          "code-line" +
          (i === pc && !halted ? " is-active" : "") +
          (ins.label ? "" : "");
        var prefix = ins.label ? ins.label + ": " : "";
        el.innerHTML =
          '<span class="code-ln">' +
          i +
          '</span><span class="code-src">' +
          prefix +
          ins.text +
          "</span>";
        codeRoot.appendChild(el);
      });
    }

    function paint() {
      if (meta) meta.textContent = String(pc);
      if (phase) phase.textContent = halted ? "HALTED" : "PC=" + pc;
      if (insnEl) {
        insnEl.textContent = halted
          ? "HALT"
          : PROGRAM[pc]
            ? PROGRAM[pc].text
            : "—";
      }

      regsEl.innerHTML = "";
      ["R0", "R1", "R2", "SP"].forEach(function (name) {
        var d = document.createElement("div");
        d.className = "asm-reg";
        d.innerHTML =
          '<span class="asm-reg-n">' +
          name +
          '</span><span class="asm-reg-v">' +
          regs[name] +
          "</span>";
        regsEl.appendChild(d);
      });

      memEl.innerHTML = "";
      mem.forEach(function (v, i) {
        var cell = document.createElement("div");
        cell.className =
          "asm-cell" + (i >= regs.SP ? " is-stack" : "");
        cell.innerHTML =
          '<span class="asm-cell-a">[' +
          i +
          ']</span><span class="asm-cell-v">' +
          v +
          "</span>";
        memEl.appendChild(cell);
      });

      renderCode();
    }

    function readVal(tok) {
      if (regs.hasOwnProperty(tok)) return regs[tok];
      var n = Number(tok);
      return isFinite(n) ? n : 0;
    }

    function step() {
      if (halted || pc < 0 || pc >= PROGRAM.length) {
        halted = true;
        setStatus("Halted.");
        paint();
        return;
      }
      var ins = PROGRAM[pc];
      var next = pc + 1;
      if (ins.op === "MOV") {
        regs[ins.args[0]] = readVal(ins.args[1]);
        setStatus("MOV: " + ins.args[0] + " ← " + regs[ins.args[0]]);
        if (codeNote) codeNote.textContent = "Copy value into destination register.";
      } else if (ins.op === "ADD") {
        regs[ins.args[0]] = regs[ins.args[0]] + readVal(ins.args[1]);
        setStatus("ADD: " + ins.args[0] + " = " + regs[ins.args[0]]);
        if (codeNote) codeNote.textContent = "ALU adds into destination.";
      } else if (ins.op === "CALL") {
        regs.SP -= 1;
        if (regs.SP < 0) regs.SP = 0;
        mem[regs.SP] = next;
        next = labels[ins.args[0]] != null ? labels[ins.args[0]] : next;
        setStatus("CALL: push " + mem[regs.SP] + ", jump to " + ins.args[0]);
        if (codeNote) codeNote.textContent = "Return address pushed; PC jumps to label.";
      } else if (ins.op === "RET") {
        next = mem[regs.SP] || 0;
        mem[regs.SP] = 0;
        regs.SP = Math.min(7, regs.SP + 1);
        setStatus("RET: PC ← " + next);
        if (codeNote) codeNote.textContent = "Pop return address into PC.";
      } else if (ins.op === "HALT") {
        halted = true;
        setStatus("HALT — program finished. R0=" + regs.R0);
        if (codeNote) codeNote.textContent = "Stop fetching instructions.";
        pc = next;
        paint();
        return;
      }
      pc = next;
      paint();
    }

    function reset() {
      regs = { R0: 0, R1: 0, R2: 0, SP: 7 };
      mem = [0, 0, 0, 0, 0, 0, 0, 0];
      pc = 0;
      halted = false;
      paint();
      setStatus("Program loaded. Step to execute the next instruction.");
      if (codeNote) codeNote.textContent = "Highlighted line is about to run (or just ran).";
    }

    document.querySelectorAll("[data-asm-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var a = btn.getAttribute("data-asm-action");
          if (a === "step") step();
          else if (a === "reset") reset();
        } catch (err) {
          console.error("[learn-asm] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-asm] Init failed", err);
  }
})();
