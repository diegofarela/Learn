/**
 * Threads sharing memory vs separate processes visualization.
 */
(function () {
  var CODE = {
    threads: [
      { html: '<span class="code-cm">/* one process, many threads */</span>', id: "title" },
      { html: 'Process P {', id: "proc" },
      { html: '  shared heap, globals;', id: "shared" },
      { html: '  Thread T1 { stack1; PC1; }', id: "t1" },
      { html: '  Thread T2 { stack2; PC2; }', id: "t2" },
      { html: '}' }
    ],
    processes: [
      { html: '<span class="code-cm">/* isolated address spaces */</span>', id: "title" },
      { html: 'Process P1 { memory1; Thread main; }', id: "p1" },
      { html: 'Process P2 { memory2; Thread main; }', id: "p2" },
      { html: '<span class="code-cm">/* talk via IPC / pipes / sockets */</span>', id: "ipc" }
    ]
  };

  function initTp() {
    var stage = document.getElementById("tp-stage");
    var status = document.getElementById("tp-status");
    var badge = document.getElementById("tp-badge");
    var viewLabel = document.getElementById("tp-view-label");
    var codeRoot = document.getElementById("tp-code");
    var codeNote = document.getElementById("tp-code-note");
    if (!stage) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mode = "threads";
    var lineEls = {};
    var pulseTimer = null;

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
      CODE[mode].forEach(function (line, i) {
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

    function render() {
      stage.innerHTML = "";
      stage.dataset.mode = mode;
      if (mode === "threads") {
        var proc = document.createElement("div");
        proc.className = "tp-process";
        proc.innerHTML = '<span class="tp-process-label">Process P</span>';

        var mem = document.createElement("div");
        mem.className = "tp-shared";
        mem.innerHTML =
          '<span class="tp-shared-label">shared memory</span>' +
          '<span class="tp-cell">heap</span><span class="tp-cell">globals</span>';
        proc.appendChild(mem);

        var threads = document.createElement("div");
        threads.className = "tp-threads";
        ["T1", "T2"].forEach(function (name, i) {
          var th = document.createElement("div");
          th.className = "tp-thread";
          th.dataset.tone = String(i);
          th.innerHTML =
            "<strong>" +
            name +
            '</strong><span class="tp-stack">stack</span><span class="tp-pc">PC</span>';
          threads.appendChild(th);
        });
        proc.appendChild(threads);
        stage.appendChild(proc);
      } else {
        ["P1", "P2"].forEach(function (name, i) {
          var proc = document.createElement("div");
          proc.className = "tp-process tp-process-solo";
          proc.dataset.tone = String(i);
          proc.innerHTML =
            '<span class="tp-process-label">Process ' +
            name +
            "</span>" +
            '<div class="tp-shared tp-private"><span class="tp-shared-label">private memory</span>' +
            '<span class="tp-cell">heap</span><span class="tp-cell">stack</span></div>' +
            '<div class="tp-thread is-alone"><strong>main</strong><span class="tp-pc">PC</span></div>';
          stage.appendChild(proc);
        });
        var ipc = document.createElement("div");
        ipc.className = "tp-ipc";
        ipc.textContent = "IPC";
        stage.appendChild(ipc);
      }
    }

    function setMode(next) {
      try {
        mode = next;
        if (viewLabel) viewLabel.textContent = mode;
        setBadge(mode);
        renderCode();
        render();
        if (mode === "threads") {
          highlight("shared");
          setCodeNote("Threads share the process heap and globals.");
          setStatus("One process, two threads sharing memory — each has its own stack.");
        } else {
          highlight("ipc");
          setCodeNote("Processes isolate memory; they communicate via IPC.");
          setStatus("Two processes — separate address spaces. Communication needs IPC.");
        }
      } catch (err) {
        console.error("[learn-threads-processes] setMode failed", next, err);
      }
    }

    function pulse() {
      try {
        var nodes = stage.querySelectorAll(".tp-thread");
        if (!nodes.length) return;
        highlight(mode === "threads" ? "t1" : "p1");
        var i = 0;
        if (pulseTimer) window.clearInterval(pulseTimer);
        nodes.forEach(function (n) {
          n.classList.remove("is-running");
        });
        if (reduceMotion) {
          nodes[0].classList.add("is-running");
          return;
        }
        pulseTimer = window.setInterval(function () {
          nodes.forEach(function (n) {
            n.classList.remove("is-running");
          });
          nodes[i % nodes.length].classList.add("is-running");
          highlight(mode === "threads" ? (i % 2 === 0 ? "t1" : "t2") : i % 2 === 0 ? "p1" : "p2");
          i++;
          if (i >= 6) {
            window.clearInterval(pulseTimer);
            pulseTimer = null;
          }
        }, 450);
      } catch (err) {
        console.error("[learn-threads-processes] pulse failed", err);
      }
    }

    document.querySelectorAll("[data-tp-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-tp-action");
          if (action === "threads") setMode("threads");
          else if (action === "processes") setMode("processes");
          else if (action === "pulse") pulse();
          else if (action === "reset") setMode(mode);
        } catch (err) {
          console.error("[learn-threads-processes] action failed", err);
        }
      });
    });

    setMode("threads");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTp);
  } else {
    initTp();
  }
})();
