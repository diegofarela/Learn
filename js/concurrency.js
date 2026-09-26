/**
 * Concurrency: interleaved timeline of two tasks on one CPU.
 */
(function () {
  var SCHEDULE = ["A", "B", "A", "A", "B", "B", "A", "B"];
  var SLOTS = 8;

  var CODE_LINES = [
    { html: '<span class="code-cm">/* one core, time-sliced */</span>' },
    { html: 'ready = [TaskA, TaskB];', id: "ready" },
    { html: 'run = ready.dequeue();', id: "switch" },
    { html: 'run.step(); <span class="code-cm">/* one quantum */</span>', id: "step" },
    { html: 'ready.enqueue(run);', id: "yield" },
    { html: '<span class="code-cm">/* both in progress — not simultaneous */</span>', id: "note" }
  ];

  function initConc() {
    var slotsA = document.getElementById("conc-slots-a");
    var slotsB = document.getElementById("conc-slots-b");
    var runningEl = document.getElementById("conc-running");
    var status = document.getElementById("conc-status");
    var badge = document.getElementById("conc-badge");
    var stepEl = document.getElementById("conc-step");
    var codeRoot = document.getElementById("conc-code");
    var codeNote = document.getElementById("conc-code-note");
    if (!slotsA || !slotsB) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var step = 0;
    var busy = false;
    var lineEls = {};
    var filled = { A: [], B: [] };

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE_LINES.forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        row.innerHTML = line.html || "&nbsp;";
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        codeRoot.appendChild(row);
      });
    }

    function highlight(id) {
      Object.keys(lineEls).forEach(function (k) {
        lineEls[k].classList.remove("is-active");
      });
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function renderSlots() {
      function paint(el, task) {
        el.innerHTML = "";
        for (var i = 0; i < SLOTS; i++) {
          var slot = document.createElement("span");
          slot.className = "conc-slot";
          if (filled[task].indexOf(i) !== -1) {
            slot.classList.add("is-filled");
            slot.dataset.task = task;
          }
          if (step > 0 && SCHEDULE[step - 1] === task && filled[task].indexOf(step - 1) !== -1 && i === step - 1) {
            slot.classList.add("is-active");
          }
          el.appendChild(slot);
        }
      }
      paint(slotsA, "A");
      paint(slotsB, "B");
      if (stepEl) stepEl.textContent = String(step);
    }

    function sleep(ms) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, reduceMotion ? 0 : ms);
      });
    }

    function applyStep() {
      if (step >= SCHEDULE.length) {
        setBadge("done");
        if (runningEl) runningEl.textContent = "idle";
        highlight("note");
        setStatus("Both tasks finished via interleaving — never ran in the same tick.");
        setCodeNote("Contrast with parallelism: there, two cores work the same tick.");
        return false;
      }
      var who = SCHEDULE[step];
      filled[who].push(step);
      step++;
      if (runningEl) runningEl.textContent = "Task " + who;
      document.querySelectorAll(".conc-lane").forEach(function (lane) {
        lane.classList.toggle("is-running", lane.getAttribute("data-task") === who);
      });
      highlight("step");
      setBadge("Task " + who);
      setStatus("Tick " + step + ": CPU runs Task " + who + " (other waits).");
      setCodeNote("Context switch — only one task owns the core.");
      renderSlots();
      return true;
    }

    function stepOnce() {
      if (busy) return;
      try {
        if (step === 0) {
          highlight("ready");
          setBadge("ready");
        } else {
          highlight("switch");
        }
        applyStep();
      } catch (err) {
        console.error("[learn-concurrency] step failed", err);
      }
    }

    function runAll() {
      if (busy) return;
      busy = true;
      (async function () {
        try {
          resetState(false);
          highlight("ready");
          setBadge("running");
          await sleep(200);
          while (step < SCHEDULE.length) {
            highlight("switch");
            await sleep(120);
            applyStep();
            highlight("yield");
            await sleep(280);
          }
        } catch (err) {
          console.error("[learn-concurrency] run failed", err);
          setStatus("Demo error — see console.");
        } finally {
          busy = false;
          document.querySelectorAll(".conc-lane").forEach(function (lane) {
            lane.classList.remove("is-running");
          });
        }
      })();
    }

    function resetState(announce) {
      step = 0;
      filled = { A: [], B: [] };
      if (runningEl) runningEl.textContent = "idle";
      document.querySelectorAll(".conc-lane").forEach(function (lane) {
        lane.classList.remove("is-running");
      });
      highlight(null);
      setBadge("idle");
      renderSlots();
      if (announce !== false) {
        setCodeNote("Step or run — watch the CPU switch tasks.");
        setStatus("Both tasks are in progress over time, but only one runs per tick.");
      }
    }

    document.querySelectorAll("[data-conc-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-conc-action");
          if (action === "run") runAll();
          else if (action === "step") stepOnce();
          else if (action === "reset") {
            busy = false;
            resetState(true);
          }
        } catch (err) {
          console.error("[learn-concurrency] action failed", err);
        }
      });
    });

    renderCode();
    resetState(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initConc);
  } else {
    initConc();
  }
})();
