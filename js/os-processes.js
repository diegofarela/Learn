/**
 * Interactive process state machine: new/ready/running/waiting/terminated.
 */
(function () {
  var STATES = ["new", "ready", "running", "waiting", "terminated"];

  var TRANSITIONS = {
    admit: { from: "new", to: "ready", line: "admit", note: "Admit: move from <strong>new</strong> to the <strong>ready</strong> queue." },
    dispatch: { from: "ready", to: "running", line: "dispatch", note: "Dispatch: scheduler gives the CPU — now <strong>running</strong>." },
    io: { from: "running", to: "waiting", line: "block", note: "Block on I/O — leave CPU, enter <strong>waiting</strong>." },
    "io-done": { from: "waiting", to: "ready", line: "wakeup", note: "I/O complete — wake up into <strong>ready</strong>." },
    preempt: { from: "running", to: "ready", line: "preempt", note: "Timer interrupt — back to <strong>ready</strong> (preemption)." },
    exit: { from: "running", to: "terminated", line: "exit", note: "Exit: process <strong>terminated</strong>; PCB can be cleaned up." }
  };

  var CODE_LINES = [
    { html: '<span class="code-cm">/* process state transitions */</span>' },
    { html: '<span class="code-fn">admit</span>(p):     new → ready', id: "admit" },
    { html: '<span class="code-fn">dispatch</span>(p):  ready → running', id: "dispatch" },
    { html: '<span class="code-fn">block</span>(p):     running → waiting', id: "block" },
    { html: '<span class="code-fn">wakeup</span>(p):    waiting → ready', id: "wakeup" },
    { html: '<span class="code-fn">preempt</span>(p):   running → ready', id: "preempt" },
    { html: '<span class="code-fn">exit</span>(p):      running → terminated', id: "exit" }
  ];

  function initProc() {
    var diagram = document.getElementById("proc-diagram");
    var status = document.getElementById("proc-status");
    var badge = document.getElementById("proc-badge");
    var stateLabel = document.getElementById("proc-state-label");
    var codeRoot = document.getElementById("proc-code");
    var codeNote = document.getElementById("proc-code-note");
    if (!diagram) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var state = "new";
    var lastEdge = null;
    var lineEls = {};

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
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        row.innerHTML = line.html || "&nbsp;";
        codeRoot.appendChild(row);
      });
    }

    function highlight(id) {
      Object.keys(lineEls).forEach(function (k) {
        lineEls[k].classList.remove("is-active");
      });
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function updateButtons() {
      document.querySelectorAll("[data-proc-action]").forEach(function (btn) {
        var action = btn.getAttribute("data-proc-action");
        if (action === "reset") {
          btn.disabled = false;
          return;
        }
        var t = TRANSITIONS[action];
        btn.disabled = !t || t.from !== state;
      });
    }

    function render() {
      diagram.innerHTML = "";
      var row1 = document.createElement("div");
      row1.className = "proc-row";
      ["new", "ready", "running"].forEach(function (s) {
        row1.appendChild(makeNode(s));
      });
      diagram.appendChild(row1);

      var row2 = document.createElement("div");
      row2.className = "proc-row proc-row-lower";
      ["waiting", "terminated"].forEach(function (s) {
        row2.appendChild(makeNode(s));
      });
      diagram.appendChild(row2);

      var edges = document.createElement("p");
      edges.className = "proc-edge-hint";
      edges.textContent = lastEdge
        ? "Last: " + lastEdge.from + " → " + lastEdge.to
        : "Edges: admit · dispatch · I/O · interrupt · exit";
      diagram.appendChild(edges);

      if (stateLabel) stateLabel.textContent = state;
      setBadge("P1 · " + state);
      updateButtons();
    }

    function makeNode(s) {
      var node = document.createElement("div");
      node.className = "proc-node";
      node.dataset.state = s;
      node.textContent = s;
      if (s === state) node.classList.add("is-active");
      if (lastEdge && lastEdge.to === s) node.classList.add("is-arrived");
      return node;
    }

    function apply(action) {
      try {
        var t = TRANSITIONS[action];
        if (!t) return;
        if (t.from !== state) {
          setStatus("Illegal from " + state + " — need to be in " + t.from + ".");
          return;
        }
        state = t.to;
        lastEdge = { from: t.from, to: t.to };
        highlight(t.line);
        setCodeNote(t.note);
        setStatus(t.note.replace(/<\/?strong>/g, ""));
        render();
        if (!reduceMotion) {
          window.setTimeout(function () {
            diagram.querySelectorAll(".is-arrived").forEach(function (el) {
              el.classList.remove("is-arrived");
            });
          }, 600);
        }
      } catch (err) {
        console.error("[learn-os-processes] transition failed", action, err);
      }
    }

    function reset() {
      try {
        state = "new";
        lastEdge = null;
        highlight(null);
        setCodeNote("Press a transition — the matching kernel path highlights.");
        setStatus("Process created (new). Admit it to the ready queue.");
        render();
      } catch (err) {
        console.error("[learn-os-processes] reset failed", err);
      }
    }

    document.querySelectorAll("[data-proc-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-proc-action");
        if (action === "reset") reset();
        else apply(action);
      });
    });

    renderCode();
    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProc);
  } else {
    initProc();
  }
})();
