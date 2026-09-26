/**
 * Consistency models: linearizability vs eventual on a read/write timeline.
 */
(function () {
  var SCRIPT = [
    { t: 0, who: "client", op: "W(x=1)", note: "write x←1 starts" },
    { t: 1, who: "R1", op: "apply W", note: "R1 has x=1" },
    { t: 2, who: "client", op: "R(x)@R2", note: "read from R2" },
    { t: 3, who: "R2", op: "apply W", note: "R2 catches up x=1" },
    { t: 4, who: "client", op: "R(x)@R2", note: "read again from R2" }
  ];

  function init() {
    var timeline = document.getElementById("cmod-timeline");
    var status = document.getElementById("cmod-status");
    var phase = document.getElementById("cmod-phase");
    var meta = document.getElementById("cmod-meta");
    var codeRoot = document.getElementById("cmod-code");
    var codeNote = document.getElementById("cmod-code-note");
    if (!timeline) return;

    var model = "lin";
    var step = 0;
    var r1 = 0;
    var r2 = 0;
    var history = [];

    function paint() {
      if (phase) {
        phase.textContent = model === "lin" ? "LINEARIZABLE" : "EVENTUAL";
      }
      if (meta) {
        meta.textContent = model === "lin" ? "linearizable" : "eventual";
      }

      document.querySelectorAll("[data-cmod-model]").forEach(function (btn) {
        btn.classList.toggle(
          "is-selected",
          btn.getAttribute("data-cmod-model") === model
        );
      });

      timeline.innerHTML = "";
      var row = document.createElement("div");
      row.className = "cmod-replicas";
      row.innerHTML =
        '<div class="cmod-rep"><span class="cmod-rep-n">R1</span><span class="cmod-rep-v">x=' +
        r1 +
        '</span></div>' +
        '<div class="cmod-rep"><span class="cmod-rep-n">R2</span><span class="cmod-rep-v">x=' +
        r2 +
        "</span></div>";
      timeline.appendChild(row);

      var track = document.createElement("div");
      track.className = "cmod-track";
      SCRIPT.forEach(function (ev, i) {
        var chip = document.createElement("div");
        chip.className =
          "cmod-chip" +
          (i < step ? " is-done" : "") +
          (i === step ? " is-active" : "");
        chip.innerHTML =
          '<span class="cmod-chip-t">t' +
          ev.t +
          '</span><span class="cmod-chip-op">' +
          ev.op +
          "</span>";
        track.appendChild(chip);
      });
      timeline.appendChild(track);

      if (codeRoot) {
        codeRoot.innerHTML = "";
        history.forEach(function (src, i) {
          var el = document.createElement("div");
          el.className = "code-line" + (i === history.length - 1 ? " is-active" : "");
          el.innerHTML =
            '<span class="code-ln">' +
            (i + 1) +
            '</span><span class="code-src">' +
            src +
            "</span>";
          codeRoot.appendChild(el);
        });
      }
    }

    function advance() {
      if (step >= SCRIPT.length) {
        if (status) status.textContent = "Scenario complete. Reset to replay.";
        return;
      }
      var ev = SCRIPT[step];

      if (ev.op === "W(x=1)") {
        history.push("write x=1 issued");
        if (model === "lin") {
          /* linearizable write waits until both (quorum) */
          r1 = 1;
          r2 = 1;
          history.push("linearizable: both replicas updated before ack");
          if (status) {
            status.textContent = "Write completes only when the system has one new value.";
          }
          if (codeNote) {
            codeNote.textContent = "Linearizable write is not visible until committed.";
          }
        } else {
          r1 = 1;
          history.push("eventual: ack after R1; R2 still stale");
          if (status) {
            status.textContent = "Eventual: write acked on R1; R2 may lag.";
          }
          if (codeNote) {
            codeNote.textContent = "Client may read stale data from R2.";
          }
        }
      } else if (ev.op === "apply W") {
        if (ev.who === "R1") {
          r1 = 1;
          history.push("R1.x = 1");
        } else {
          r2 = 1;
          history.push("R2.x = 1 (catch-up)");
          if (status) status.textContent = "R2 has converged.";
        }
      } else if (ev.op.indexOf("R(x)") === 0) {
        var seen = r2;
        if (model === "lin") {
          seen = 1;
          r2 = 1;
          history.push("read R2 → " + seen + " (must be latest)");
          if (status) {
            status.textContent = "Linearizable read cannot return stale 0 after the write.";
          }
        } else {
          history.push("read R2 → " + seen + (seen === 0 ? " (stale OK)" : ""));
          if (status) {
            status.textContent =
              seen === 0
                ? "Eventual: stale read of 0 is allowed before catch-up."
                : "Eventual: after sync, reads see 1.";
          }
        }
      }

      step += 1;
      paint();
    }

    function reset() {
      step = 0;
      r1 = 0;
      r2 = 0;
      history = [];
      if (status) {
        status.textContent =
          model === "lin"
            ? "Linearizable: every read sees the latest completed write."
            : "Eventual: replicas converge; stale reads allowed in between.";
      }
      if (codeNote) {
        codeNote.textContent =
          "Same client ops; different models allow different read results.";
      }
      paint();
    }

    document.querySelectorAll("[data-cmod-model]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          model = btn.getAttribute("data-cmod-model") || "lin";
          reset();
        } catch (err) {
          console.error("[learn-cmod] Model failed", err);
        }
      });
    });

    document.querySelectorAll("[data-cmod-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var a = btn.getAttribute("data-cmod-action");
          if (a === "step") advance();
          else if (a === "reset") reset();
        } catch (err) {
          console.error("[learn-cmod] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-cmod] Init failed", err);
  }
})();
