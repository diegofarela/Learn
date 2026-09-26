/**
 * Step-through HTTP request/response exchange animation.
 */
(function () {
  var SCENARIOS = {
    ok: {
      method: "GET",
      path: "/index.html",
      status: 200,
      reason: "OK",
      body: "<!doctype html>…"
    },
    notfound: {
      method: "GET",
      path: "/missing",
      status: 404,
      reason: "Not Found",
      body: "404 page"
    },
    post: {
      method: "POST",
      path: "/api/items",
      status: 201,
      reason: "Created",
      body: '{"id":42}'
    }
  };

  var STEPS = [
    {
      id: "idle",
      note: "Ready — press Step to open a connection.",
      packet: "hidden",
      highlight: null
    },
    {
      id: "compose",
      note: "Client composes the request line and headers.",
      packet: "hidden",
      highlight: "client",
      side: "req"
    },
    {
      id: "send",
      note: "Request travels toward the origin server.",
      packet: "to-server",
      highlight: "wire",
      side: "req"
    },
    {
      id: "handle",
      note: "Server handles the method + path and builds a response.",
      packet: "at-server",
      highlight: "server",
      side: "res"
    },
    {
      id: "reply",
      note: "Response returns with a status code and body.",
      packet: "to-client",
      highlight: "wire",
      side: "res"
    },
    {
      id: "done",
      note: "Client receives the response — exchange complete.",
      packet: "at-client",
      highlight: "client",
      side: "res"
    }
  ];

  function initHttp() {
    var scenarioEl = document.getElementById("http-scenario");
    var status = document.getElementById("http-status");
    var meta = document.getElementById("http-meta");
    var packet = document.getElementById("http-packet");
    var reqBody = document.getElementById("http-req-body");
    var resBody = document.getElementById("http-res-body");
    var reqFrame = document.getElementById("http-req");
    var resFrame = document.getElementById("http-res");
    var client = document.getElementById("http-client");
    var server = document.getElementById("http-server");
    var codeRoot = document.getElementById("http-code");
    var codeNote = document.getElementById("http-code-note");
    if (!scenarioEl || !packet) return;

    var step = 0;
    var playTimer = null;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function scenario() {
      return SCENARIOS[scenarioEl.value] || SCENARIOS.ok;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function renderCode(sc, s) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      var lines = [
        sc.method + " " + sc.path + " HTTP/1.1",
        "Host: example.com",
        "",
        s >= 3
          ? "HTTP/1.1 " + sc.status + " " + sc.reason
          : "# waiting for response…",
        s >= 4 ? "Content-Type: text/plain" : null,
        s >= 5 ? "" : null,
        s >= 5 ? sc.body : null
      ].filter(function (x) {
        return x !== null;
      });
      lines.forEach(function (src, i) {
        var line = document.createElement("div");
        var active =
          (s <= 2 && i < 2) ||
          (s >= 3 && i >= 3) ||
          src.indexOf("#") === 0;
        line.className =
          "code-line" + (src === "" ? " is-dim" : active ? " is-active" : "");
        line.innerHTML =
          '<span class="code-ln">' +
          (src ? i + 1 : "") +
          '</span><span class="code-src">' +
          (src || "") +
          "</span>";
        codeRoot.appendChild(line);
      });
    }

    function paint() {
      var sc = scenario();
      var s = step;
      var info = STEPS[s] || STEPS[0];
      if (meta) meta.textContent = String(s);

      if (reqBody) {
        reqBody.textContent =
          sc.method + " " + sc.path + " HTTP/1.1\nHost: example.com";
      }
      if (resBody) {
        resBody.textContent =
          s >= 3
            ? "HTTP/1.1 " + sc.status + " " + sc.reason + "\n\n" + sc.body
            : "—";
      }

      if (reqFrame) {
        reqFrame.classList.toggle("is-active", info.side === "req" || s >= 1);
      }
      if (resFrame) {
        resFrame.classList.toggle("is-active", info.side === "res" || s >= 3);
      }

      if (client) client.classList.toggle("is-active", info.highlight === "client");
      if (server) server.classList.toggle("is-active", info.highlight === "server");

      packet.className = "http-packet";
      if (info.packet && info.packet !== "hidden") {
        packet.classList.add("is-visible", "is-" + info.packet);
        packet.textContent =
          info.side === "res" ? String(sc.status) : sc.method;
      } else {
        packet.classList.add("is-hidden");
        packet.textContent = "";
      }

      if (!reduceMotion && info.packet && info.packet !== "hidden") {
        packet.classList.remove("is-pulse");
        void packet.offsetWidth;
        packet.classList.add("is-pulse");
      }

      renderCode(sc, s);
      setStatus(info.note);
      setCodeNote(
        s === 0
          ? "Methods name the intent; status codes name the outcome."
          : "<strong>" +
              sc.method +
              "</strong> " +
              sc.path +
              (s >= 3 ? " → <strong>" + sc.status + "</strong>" : "")
      );
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

    scenarioEl.addEventListener("change", function () {
      try {
        clearPlay();
        go(0);
      } catch (err) {
        console.error("[learn-http] Scenario failed", err);
      }
    });

    document.querySelectorAll("[data-http-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-http-action");
          clearPlay();
          if (action === "reset") go(0);
          else if (action === "step") stepOnce();
          else if (action === "play") play();
        } catch (err) {
          console.error("[learn-http] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    initHttp();
  } catch (err) {
    console.error("[learn-http] Init failed", err);
  }
})();
