/**
 * Instruction cycle: animate fetch → decode → execute → writeback.
 */
(function () {
  var STAGES = ["fetch", "decode", "execute", "writeback"];
  var STAGE_LABEL = {
    fetch: "FETCH",
    decode: "DECODE",
    execute: "EXECUTE",
    writeback: "WRITEBACK"
  };
  var PROGRAM = [
    { ir: "ADD R1, R2", note: "ALU: R1 ← R1 + R2" },
    { ir: "LW  R3, 0(R4)", note: "Load word from memory into R3" },
    { ir: "SW  R3, 4(R4)", note: "Store R3 to memory" }
  ];

  function init() {
    var flow = document.getElementById("icycle-flow");
    var regs = document.getElementById("icycle-regs");
    var status = document.getElementById("icycle-status");
    var phase = document.getElementById("icycle-phase");
    var meta = document.getElementById("icycle-meta");
    var codeRoot = document.getElementById("icycle-code");
    var codeNote = document.getElementById("icycle-code-note");
    if (!flow) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var pc = 0;
    var stageIdx = 0;
    var ir = "—";
    var result = "—";
    var timer = null;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function renderCode(lines, active) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lines.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className = "code-line" + (i === active ? " is-active" : "");
        el.innerHTML =
          '<span class="code-ln">' +
          (i + 1) +
          '</span><span class="code-src">' +
          src +
          "</span>";
        codeRoot.appendChild(el);
      });
    }

    function paint() {
      var stage = STAGES[stageIdx];
      if (phase) phase.textContent = STAGE_LABEL[stage];
      if (meta) meta.textContent = stage;

      if (regs) {
        regs.innerHTML =
          '<div class="icycle-reg"><span class="icycle-reg-n">PC</span><span class="icycle-reg-v">' +
          pc +
          '</span></div>' +
          '<div class="icycle-reg"><span class="icycle-reg-n">IR</span><span class="icycle-reg-v">' +
          ir +
          '</span></div>' +
          '<div class="icycle-reg"><span class="icycle-reg-n">ACC</span><span class="icycle-reg-v">' +
          result +
          "</span></div>";
      }

      flow.innerHTML = "";
      STAGES.forEach(function (s, i) {
        var node = document.createElement("div");
        node.className =
          "icycle-node" +
          (i === stageIdx ? " is-active" : "") +
          (i < stageIdx ? " is-done" : "");
        node.innerHTML =
          '<span class="icycle-node-n">' +
          (i + 1) +
          '</span><span class="icycle-node-l">' +
          STAGE_LABEL[s] +
          "</span>";
        flow.appendChild(node);
        if (i < STAGES.length - 1) {
          var arrow = document.createElement("span");
          arrow.className = "icycle-arrow" + (i < stageIdx ? " is-lit" : "");
          arrow.setAttribute("aria-hidden", "true");
          arrow.textContent = "→";
          flow.appendChild(arrow);
        }
      });

      var insn = PROGRAM[pc % PROGRAM.length];
      var lines;
      var msg;
      if (stage === "fetch") {
        lines = [
          "MAR ← PC  (" + pc + ")",
          "IR ← Mem[MAR]",
          "PC ← PC + 1"
        ];
        msg = "Fetch: load instruction at PC=" + pc + " into IR.";
        if (codeNote) codeNote.textContent = "Memory read using the program counter.";
      } else if (stage === "decode") {
        lines = ["decode(IR): " + ir, "select ALU / mem / branch controls"];
        msg = "Decode: control unit interprets " + ir + ".";
        if (codeNote) codeNote.textContent = "Opcode and operand fields drive control signals.";
      } else if (stage === "execute") {
        lines = ["execute: " + ir, insn.note];
        msg = "Execute: " + insn.note;
        if (codeNote) codeNote.textContent = "Functional units carry out the decoded op.";
      } else {
        lines = ["writeback result → register / memory", "result = " + result];
        msg = "Writeback: commit result, then start the next cycle.";
        if (codeNote) codeNote.textContent = "Architectural state updates after execute.";
      }
      renderCode(lines, Math.min(lines.length - 1, stageIdx));
      setStatus(msg);
    }

    function applyStageSideEffects() {
      var stage = STAGES[stageIdx];
      var insn = PROGRAM[pc % PROGRAM.length];
      if (stage === "fetch") {
        ir = insn.ir;
      } else if (stage === "execute") {
        result = insn.note.indexOf("R1") >= 0 ? "R1'" : "ok";
      } else if (stage === "writeback") {
        /* advance PC after full cycle */
      }
    }

    function step() {
      applyStageSideEffects();
      if (stageIdx === STAGES.length - 1) {
        pc = (pc + 1) % PROGRAM.length;
        stageIdx = 0;
        ir = "—";
        result = "—";
      } else {
        stageIdx += 1;
        applyStageSideEffects();
      }
      paint();
    }

    function reset() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      pc = 0;
      stageIdx = 0;
      ir = "—";
      result = "—";
      paint();
      setStatus("PC points at the next instruction. Step to fetch it into the IR.");
    }

    function play() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        setStatus("Paused.");
        return;
      }
      var ms = reduceMotion ? 900 : 650;
      timer = setInterval(function () {
        try {
          step();
        } catch (err) {
          console.error("[learn-icycle] Play step failed", err);
        }
      }, ms);
      setStatus("Playing… click Play again to pause.");
    }

    document.querySelectorAll("[data-icycle-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var a = btn.getAttribute("data-icycle-action");
          if (a === "step") step();
          else if (a === "play") play();
          else if (a === "reset") reset();
        } catch (err) {
          console.error("[learn-icycle] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-icycle] Init failed", err);
  }
})();
