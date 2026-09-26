/**
 * Tiny TM: walk tape flipping 0↔1, then accept.
 */
(function () {
  // δ: state + read → {write, move, next}
  // q0: flip bits moving right; blank → q_accept
  var DELTA = {
    q0: {
      "0": { write: "1", move: 1, next: "q0" },
      "1": { write: "0", move: 1, next: "q0" },
      "□": { write: "□", move: 0, next: "q_acc" }
    }
  };

  function init() {
    var inputEl = document.getElementById("ture-input");
    var tapeEl = document.getElementById("ture-tape");
    var stateEl = document.getElementById("ture-state");
    var status = document.getElementById("ture-status");
    var badge = document.getElementById("ture-badge");
    var meta = document.getElementById("ture-meta");
    var code = document.getElementById("ture-code");
    var stepBtn = document.getElementById("ture-step");
    var runBtn = document.getElementById("ture-run");
    var resetBtn = document.getElementById("ture-reset");
    if (!inputEl || !tapeEl) return;

    var tape = [];
    var head = 0;
    var state = "q0";
    var steps = 0;
    var halt = false;
    var timer = null;

    function load() {
      var raw = String(inputEl.value || "").replace(/[^01]/g, "");
      inputEl.value = raw;
      tape = raw.split("");
      if (!tape.length) tape = ["□"];
      head = 0;
      state = "q0";
      steps = 0;
      halt = false;
      render();
      if (status) status.textContent = "Ready. Flips each bit, then accepts on blank.";
    }

    function cell(i) {
      return i >= 0 && i < tape.length ? tape[i] : "□";
    }

    function ensureHead() {
      while (head < 0) {
        tape.unshift("□");
        head += 1;
      }
      while (head >= tape.length) tape.push("□");
    }

    function render() {
      ensureHead();
      tapeEl.innerHTML = "";
      var start = Math.max(0, head - 4);
      var end = Math.max(tape.length, head + 5);
      for (var i = start; i < end; i++) {
        var d = document.createElement("div");
        d.className = "ture-cell" + (i === head ? " is-head" : "");
        d.textContent = cell(i);
        tapeEl.appendChild(d);
      }
      if (stateEl) {
        stateEl.textContent =
          "state " + state + " · head at " + head + (halt ? " · HALT" : "");
      }
      if (badge) badge.textContent = halt ? (state === "q_acc" ? "accept" : "halt") : state;
      if (meta) meta.textContent = String(steps);
      if (code) {
        var r = cell(head);
        var tr = DELTA[state] && DELTA[state][r];
        code.textContent = tr
          ? "δ(" + state + ", " + r + ") = (" + tr.next + ", write " + tr.write + ", " + (tr.move > 0 ? "R" : tr.move < 0 ? "L" : "—") + ")"
          : state + " has no transition on " + r;
      }
    }

    function stepOnce() {
      if (halt) return;
      ensureHead();
      var r = cell(head);
      var tr = DELTA[state] && DELTA[state][r];
      if (!tr) {
        halt = true;
        if (status) status.textContent = "Stuck — no transition.";
        render();
        return;
      }
      tape[head] = tr.write;
      head += tr.move;
      state = tr.next;
      steps += 1;
      if (state === "q_acc") {
        halt = true;
        if (status) status.textContent = "Accept: finished flipping, saw blank.";
      } else if (status) {
        status.textContent = "Wrote " + tr.write + ", moved, now " + state + ".";
      }
      render();
    }

    if (stepBtn) stepBtn.addEventListener("click", stepOnce);
    if (runBtn) {
      runBtn.addEventListener("click", function () {
        if (timer) return;
        var n = 0;
        timer = setInterval(function () {
          stepOnce();
          n += 1;
          if (halt || n > 80) {
            clearInterval(timer);
            timer = null;
          }
        }, 220);
      });
    }
    if (resetBtn) resetBtn.addEventListener("click", load);
    inputEl.addEventListener("change", load);
    load();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
