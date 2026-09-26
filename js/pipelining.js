/**
 * Pipelining: 5-stage IF/ID/EX/MEM/WB with stall vs forward on RAW hazard.
 */
(function () {
  var STAGES = ["IF", "ID", "EX", "MEM", "WB"];
  var INSNS = [
    { id: "I1", text: "ADD R1, R2, R3", color: "a" },
    { id: "I2", text: "SUB R4, R1, R5", color: "b" },
    { id: "I3", text: "AND R6, R4, R7", color: "c" },
    { id: "I4", text: "OR  R8, R6, R9", color: "d" }
  ];

  function init() {
    var grid = document.getElementById("pipe-grid");
    var status = document.getElementById("pipe-status");
    var phase = document.getElementById("pipe-phase");
    var meta = document.getElementById("pipe-meta");
    var codeRoot = document.getElementById("pipe-code");
    var codeNote = document.getElementById("pipe-code-note");
    if (!grid) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var cycle = 0;
    var mode = "forward"; /* stall | forward */
    /* pipe[stageIdx] = insn index or null; bubble marked specially */
    var pipe = [null, null, null, null, null];
    var nextIssue = 0;
    var stalled = false;
    var forwarding = false;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      INSNS.forEach(function (ins, i) {
        var el = document.createElement("div");
        var inPipe = pipe.indexOf(i) >= 0;
        el.className = "code-line" + (inPipe ? " is-active" : "");
        el.innerHTML =
          '<span class="code-ln">' +
          (i + 1) +
          '</span><span class="code-src">' +
          ins.id +
          ": " +
          ins.text +
          "</span>";
        codeRoot.appendChild(el);
      });
    }

    function hasRawHazard() {
      /* I2 needs R1 from I1 — hazard if I1 is in EX/MEM and I2 in ID */
      var i1 = pipe.indexOf(0);
      var i2 = pipe.indexOf(1);
      if (i2 !== 1) return false;
      return i1 === 2 || i1 === 3;
    }

    function paint() {
      if (meta) meta.textContent = String(cycle);
      if (phase) phase.textContent = "CYCLE " + cycle;

      grid.innerHTML = "";
      var head = document.createElement("div");
      head.className = "pipe-row pipe-head";
      head.innerHTML =
        '<span class="pipe-label"></span>' +
        STAGES.map(function (s) {
          return '<span class="pipe-stage-h">' + s + "</span>";
        }).join("");
      grid.appendChild(head);

      INSNS.forEach(function (ins, ii) {
        var row = document.createElement("div");
        row.className = "pipe-row";
        var label = document.createElement("span");
        label.className = "pipe-label";
        label.textContent = ins.id;
        row.appendChild(label);
        STAGES.forEach(function (s, si) {
          var cell = document.createElement("span");
          cell.className = "pipe-cell";
          if (pipe[si] === ii) {
            cell.classList.add("is-filled", "is-" + ins.color);
            cell.textContent = s;
            if (stalled && si === 1 && ii === 1) cell.classList.add("is-stall");
            if (forwarding && si === 1 && ii === 1) cell.classList.add("is-forward");
          } else if (pipe[si] === "bubble" && false) {
            /* unused */
          }
          row.appendChild(cell);
        });
        grid.appendChild(row);
      });

      /* bubble row indicator */
      if (pipe.indexOf("bubble") >= 0) {
        var brow = document.createElement("div");
        brow.className = "pipe-row";
        brow.innerHTML = '<span class="pipe-label">stall</span>';
        STAGES.forEach(function (s, si) {
          var cell = document.createElement("span");
          cell.className =
            "pipe-cell" + (pipe[si] === "bubble" ? " is-bubble" : "");
          if (pipe[si] === "bubble") cell.textContent = "●";
          brow.appendChild(cell);
        });
        grid.appendChild(brow);
      }

      document.querySelectorAll("[data-pipe-mode]").forEach(function (btn) {
        btn.classList.toggle(
          "is-selected",
          btn.getAttribute("data-pipe-mode") === mode
        );
      });

      renderCode();
    }

    function step() {
      stalled = false;
      forwarding = false;
      var hazard = hasRawHazard();

      if (hazard && mode === "stall") {
        /* freeze ID and earlier; advance EX..WB only */
        stalled = true;
        var newPipe = [null, pipe[1], null, null, null];
        /* shift EX→MEM→WB */
        newPipe[4] = pipe[3] !== null && pipe[3] !== "bubble" ? pipe[3] : null;
        newPipe[3] = pipe[2] !== null && pipe[2] !== "bubble" ? pipe[2] : null;
        newPipe[2] = "bubble";
        /* IF stays / insert bubble into EX by not advancing ID */
        newPipe[1] = pipe[1];
        newPipe[0] = pipe[0];
        pipe = newPipe;
        cycle += 1;
        setStatus("Stall: I2 waits in ID while I1 proceeds — bubble inserted in EX.");
        if (codeNote) {
          codeNote.innerHTML =
            "RAW hazard on <strong>R1</strong> — stall inserts a bubble.";
        }
        paint();
        return;
      }

      if (hazard && mode === "forward") {
        forwarding = true;
        setStatus("Forward: EX/MEM result of I1 fed into I2’s ID/EX — no stall.");
        if (codeNote) {
          codeNote.innerHTML =
            "Forwarding bypasses the register file for <strong>R1</strong>.";
        }
      } else {
        setStatus("Cycle " + (cycle + 1) + ": instructions advance one stage.");
        if (codeNote) codeNote.textContent = "I1 writes R1; I2 reads R1 — a classic RAW hazard.";
      }

      /* normal advance */
      var next = [null, null, null, null, null];
      next[4] = pipe[3] !== null && pipe[3] !== "bubble" ? pipe[3] : null;
      next[3] = pipe[2] !== null && pipe[2] !== "bubble" ? pipe[2] : null;
      next[2] = pipe[1] !== null && pipe[1] !== "bubble" ? pipe[1] : null;
      next[1] = pipe[0] !== null && pipe[0] !== "bubble" ? pipe[0] : null;
      if (nextIssue < INSNS.length) {
        next[0] = nextIssue;
        nextIssue += 1;
      } else {
        next[0] = null;
      }
      pipe = next;
      cycle += 1;
      paint();
    }

    function reset() {
      cycle = 0;
      pipe = [null, null, null, null, null];
      nextIssue = 0;
      stalled = false;
      forwarding = false;
      paint();
      setStatus("Classic RISC: IF → ID → EX → MEM → WB. Step to fill the pipe.");
      if (codeNote) codeNote.textContent = "I1 writes R1; I2 reads R1 — a classic RAW hazard.";
    }

    document.querySelectorAll("[data-pipe-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var a = btn.getAttribute("data-pipe-action");
          if (a === "step") step();
          else if (a === "reset") reset();
        } catch (err) {
          console.error("[learn-pipe] Action failed", err);
        }
      });
    });

    document.querySelectorAll("[data-pipe-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          mode = btn.getAttribute("data-pipe-mode") || "forward";
          paint();
          setStatus(
            mode === "stall"
              ? "Mode: stall on RAW hazard."
              : "Mode: forward on RAW hazard."
          );
        } catch (err) {
          console.error("[learn-pipe] Mode failed", err);
        }
      });
    });

    paint();
    if (reduceMotion) {
      /* no continuous animation; step-only */
    }
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-pipe] Init failed", err);
  }
})();
