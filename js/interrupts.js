/**
 * Interrupt demo: device IRQ pauses CPU → ISR → return.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-cm">/* CPU executing user work */</span>', id: "run" },
    { html: '<span class="code-cm">/* device asserts IRQ line */</span>', id: "irq" },
    { html: '<span class="code-fn">save_state</span>(PC, regs);', id: "save" },
    { html: '<span class="code-fn">ISR</span>(vector) {', id: "isr" },
    { html: '  ack_device(); handle_event();', id: "handle" },
    { html: '}' },
    { html: '<span class="code-fn">iret</span>(); <span class="code-cm">/* resume */</span>', id: "ret" }
  ];

  function initIrq() {
    var layout = document.getElementById("irq-layout");
    var status = document.getElementById("irq-status");
    var badge = document.getElementById("irq-badge");
    var phaseLabel = document.getElementById("irq-phase-label");
    var codeRoot = document.getElementById("irq-code");
    var codeNote = document.getElementById("irq-code-note");
    if (!layout) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var timers = [];
    var lineEls = {};

    function clearTimers() {
      timers.forEach(function (t) {
        window.clearTimeout(t);
      });
      timers = [];
    }

    function after(ms, fn) {
      if (reduceMotion) {
        fn();
        return;
      }
      timers.push(window.setTimeout(fn, ms));
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setPhase(p) {
      if (phaseLabel) phaseLabel.textContent = p;
    }

    function setNote(html) {
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

    function paint(state) {
      layout.innerHTML = "";

      var device = document.createElement("div");
      device.className = "irq-card" + (state.device ? " is-" + state.device : "");
      device.innerHTML =
        '<span class="irq-card-title">Device</span><span class="irq-card-body">disk / NIC / timer</span>';
      layout.appendChild(device);

      var wire = document.createElement("div");
      wire.className = "irq-wire" + (state.wire ? " is-" + state.wire : "");
      wire.setAttribute("aria-hidden", "true");
      wire.innerHTML = '<span class="irq-wire-label">IRQ</span>';
      layout.appendChild(wire);

      var cpu = document.createElement("div");
      cpu.className = "irq-card irq-cpu" + (state.cpu ? " is-" + state.cpu : "");
      cpu.innerHTML =
        '<span class="irq-card-title">CPU</span><span class="irq-card-body">' +
        (state.cpuText || "running") +
        "</span>";
      layout.appendChild(cpu);

      var isr = document.createElement("div");
      isr.className = "irq-card" + (state.isr ? " is-" + state.isr : "");
      isr.innerHTML =
        '<span class="irq-card-title">ISR</span><span class="irq-card-body">interrupt handler</span>';
      layout.appendChild(isr);
    }

    function setFireEnabled(on) {
      document.querySelectorAll("[data-irq-action]").forEach(function (btn) {
        if (btn.getAttribute("data-irq-action") === "fire") btn.disabled = !on;
      });
    }

    function reset() {
      clearTimers();
      busy = false;
      setFireEnabled(true);
      setPhase("idle");
      setBadge("CPU running");
      setStatus("CPU is running user work. Fire an IRQ from a device.");
      setNote("Fire IRQ — save state, handle device, return.");
      paint({ device: "idle", wire: "", cpu: "active", cpuText: "user work", isr: "idle" });
      renderCode();
      highlight("run");
    }

    function fire() {
      if (busy) return;
      busy = true;
      clearTimers();
      setFireEnabled(false);

      paint({ device: "signal", wire: "pulse", cpu: "active", cpuText: "user work", isr: "idle" });
      setPhase("IRQ");
      setBadge("IRQ raised");
      setStatus("Device asserts IRQ — request to pause the CPU.");
      setNote("<strong>IRQ</strong>: hardware asks for attention.");
      highlight("irq");

      after(reduceMotion ? 0 : 500, function () {
        paint({ device: "signal", wire: "active", cpu: "paused", cpuText: "paused · saved", isr: "idle" });
        setPhase("pause");
        setBadge("CPU paused");
        setStatus("CPU saves PC and registers, then vectors to the ISR.");
        setNote("<strong>Save state</strong> so we can resume later.");
        highlight("save");
      });

      after(reduceMotion ? 0 : 1000, function () {
        paint({ device: "done", wire: "active", cpu: "paused", cpuText: "in ISR", isr: "active" });
        setPhase("ISR");
        setBadge("ISR running");
        setStatus("ISR acknowledges the device and handles the event.");
        setNote("<strong>ISR</strong>: short, privileged device handler.");
        highlight("isr");
      });

      after(reduceMotion ? 0 : 1500, function () {
        highlight("handle");
        setStatus("Ack device, queue softirq / wake waiters if needed.");
      });

      after(reduceMotion ? 0 : 2000, function () {
        paint({ device: "idle", wire: "", cpu: "active", cpuText: "resumed", isr: "done" });
        setPhase("return");
        setBadge("returned");
        setStatus("iret restores state — interrupted code continues.");
        setNote("<strong>Return</strong>: resume exactly where we left off.");
        highlight("ret");
      });

      after(reduceMotion ? 0 : 2500, function () {
        setPhase("idle");
        setBadge("CPU running");
        setStatus("Back to user work. Fire another IRQ anytime.");
        setNote("Interrupt complete. Fire again or reset.");
        paint({ device: "idle", wire: "", cpu: "active", cpuText: "user work", isr: "idle" });
        highlight("run");
        busy = false;
        setFireEnabled(true);
      });
    }

    document.querySelectorAll("[data-irq-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-irq-action");
        if (action === "reset") reset();
        else if (action === "fire") fire();
      });
    });

    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initIrq);
  } else {
    initIrq();
  }
})();
