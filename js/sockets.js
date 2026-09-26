/**
 * Client/server socket endpoints: listen, connect, send/receive.
 */
(function () {
  var STEPS = [
    {
      note: "Ready — press Step for the server to bind and listen.",
      phase: "idle",
      clientFd: "fd ?",
      serverFd: "listen ?",
      clientBuf: "—",
      serverBuf: "—",
      msg: "",
      msgDir: null,
      active: null,
      connected: false,
      log: ["# sockets closed"]
    },
    {
      note: "Server creates a socket, binds :8080, and listens.",
      phase: "listen",
      clientFd: "fd ?",
      serverFd: "listen :8080",
      clientBuf: "—",
      serverBuf: "waiting",
      msg: "",
      msgDir: null,
      active: "server",
      connected: false,
      log: ["server: socket()", "server: bind(:8080)", "server: listen()"]
    },
    {
      note: "Client connects; server accept() yields a connected socket.",
      phase: "connect",
      clientFd: "fd 3 → :8080",
      serverFd: "conn fd 7",
      clientBuf: "connected",
      serverBuf: "accepted",
      msg: "",
      msgDir: null,
      active: "both",
      connected: true,
      log: [
        "server: socket()",
        "server: bind(:8080)",
        "server: listen()",
        "client: connect(server:8080)",
        "server: accept() → fd 7"
      ]
    },
    {
      note: "Client send() — bytes travel toward the server.",
      phase: "send",
      clientFd: "fd 3 → :8080",
      serverFd: "conn fd 7",
      clientBuf: "sent “ping”",
      serverBuf: "…",
      msg: "ping",
      msgDir: "to-server",
      active: "client",
      connected: true,
      log: [
        "client: connect(server:8080)",
        "server: accept() → fd 7",
        'client: send("ping")'
      ]
    },
    {
      note: "Server recv() then replies with “pong”.",
      phase: "recv",
      clientFd: "fd 3 → :8080",
      serverFd: "conn fd 7",
      clientBuf: "…",
      serverBuf: "got “ping”",
      msg: "pong",
      msgDir: "to-client",
      active: "server",
      connected: true,
      log: [
        'client: send("ping")',
        'server: recv() → "ping"',
        'server: send("pong")'
      ]
    },
    {
      note: "Client receives “pong” — exchange complete; sockets can close.",
      phase: "done",
      clientFd: "fd 3 → :8080",
      serverFd: "conn fd 7",
      clientBuf: "got “pong”",
      serverBuf: "idle",
      msg: "pong",
      msgDir: "at-client",
      active: "client",
      connected: true,
      log: [
        'client: send("ping")',
        'server: recv() → "ping"',
        'server: send("pong")',
        'client: recv() → "pong"',
        "both: close()"
      ]
    }
  ];

  function initSock() {
    var status = document.getElementById("sock-status");
    var meta = document.getElementById("sock-meta");
    var phase = document.getElementById("sock-phase");
    var client = document.getElementById("sock-client");
    var server = document.getElementById("sock-server");
    var clientFd = document.getElementById("sock-client-fd");
    var serverFd = document.getElementById("sock-server-fd");
    var clientBuf = document.getElementById("sock-client-buf");
    var serverBuf = document.getElementById("sock-server-buf");
    var wire = document.getElementById("sock-wire");
    var msg = document.getElementById("sock-msg");
    var codeRoot = document.getElementById("sock-code");
    var codeNote = document.getElementById("sock-code-note");
    if (!client || !server) return;

    var step = 0;
    var playTimer = null;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lines.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className =
          "code-line" +
          (src.indexOf("#") === 0 ? " is-dim" : i === lines.length - 1 ? " is-active" : "");
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
      var info = STEPS[step] || STEPS[0];
      if (meta) meta.textContent = String(step);
      if (phase) phase.textContent = info.phase;
      if (status) status.textContent = info.note;
      if (clientFd) clientFd.textContent = info.clientFd;
      if (serverFd) serverFd.textContent = info.serverFd;
      if (clientBuf) clientBuf.textContent = info.clientBuf;
      if (serverBuf) serverBuf.textContent = info.serverBuf;

      client.classList.toggle(
        "is-active",
        info.active === "client" || info.active === "both"
      );
      server.classList.toggle(
        "is-active",
        info.active === "server" || info.active === "both"
      );
      if (wire) wire.classList.toggle("is-on", !!info.connected);

      if (msg) {
        msg.className = "sock-msg";
        if (info.msg && info.msgDir) {
          msg.textContent = info.msg;
          msg.classList.add("is-visible", "is-" + info.msgDir);
          if (!reduceMotion) {
            void msg.offsetWidth;
            msg.classList.add("is-pulse");
          }
        } else {
          msg.textContent = "";
          msg.classList.add("is-hidden");
        }
      }

      renderCode(info.log);
      if (codeNote) {
        codeNote.innerHTML =
          step === 0
            ? "Same file-descriptor style API on most OSes."
            : step <= 2
              ? "Listen/accept creates the <strong>connected</strong> pair."
              : "After connect, both ends <strong>send</strong> and <strong>recv</strong>.";
      }
    }

    function go(next) {
      step = Math.max(0, Math.min(STEPS.length - 1, next));
      paint();
    }

    function stepOnce() {
      if (step >= STEPS.length - 1) {
        go(0);
        go(1);
        return;
      }
      go(step + 1);
    }

    function play() {
      clearPlay();
      if (step >= STEPS.length - 1) go(0);
      function tick() {
        if (step >= STEPS.length - 1) {
          clearPlay();
          return;
        }
        stepOnce();
        playTimer = setTimeout(tick, reduceMotion ? 0 : 700);
      }
      tick();
    }

    document.querySelectorAll("[data-sock-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-sock-action");
          clearPlay();
          if (action === "reset") go(0);
          else if (action === "step") stepOnce();
          else if (action === "play") play();
        } catch (err) {
          console.error("[learn-sock] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    initSock();
  } catch (err) {
    console.error("[learn-sock] Init failed", err);
  }
})();
