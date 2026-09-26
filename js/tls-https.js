/**
 * TLS handshake step-through with HTTP vs HTTPS contrast.
 */
(function () {
  var HTTPS_STEPS = [
    {
      note: "Ready — press Step to begin the TLS handshake.",
      packet: "hidden",
      lock: "open",
      lockLabel: "open",
      log: ["# idle — no session yet"]
    },
    {
      note: "ClientHello: supported versions, ciphers, and a key share.",
      packet: "to-server",
      lock: "open",
      lockLabel: "negotiating",
      highlight: "client",
      activeStep: 0,
      log: ["→ ClientHello", "  versions: TLS 1.3", "  key_share: x25519"]
    },
    {
      note: "ServerHello + certificate: server picks parameters and proves identity.",
      packet: "to-client",
      lock: "open",
      lockLabel: "checking cert",
      highlight: "server",
      activeStep: 1,
      log: [
        "← ServerHello",
        "← Certificate: CN=example.com",
        "← CertificateVerify"
      ]
    },
    {
      note: "Key exchange: both sides derive shared secrets (no password on the wire).",
      packet: "to-server",
      lock: "half",
      lockLabel: "deriving keys",
      highlight: "wire",
      activeStep: 2,
      log: ["→ Finished (client)", "  traffic_secret derived"]
    },
    {
      note: "Finished: handshake complete — application data can be encrypted.",
      packet: "to-client",
      lock: "locked",
      lockLabel: "locked",
      highlight: "wire",
      activeStep: 3,
      log: ["← Finished (server)", "  AEAD keys ready"]
    },
    {
      note: "Encrypted HTTP rides the tunnel — same GET, private on the wire.",
      packet: "to-server",
      lock: "locked",
      lockLabel: "HTTPS",
      highlight: "client",
      activeStep: 4,
      log: [
        "→ GET / HTTP/1.1  [encrypted]",
        "← 200 OK          [encrypted]"
      ]
    }
  ];

  var HTTP_STEPS = [
    {
      note: "Ready — plain HTTP has no handshake; Step sends a clear request.",
      packet: "hidden",
      lock: "open",
      lockLabel: "no TLS",
      log: ["# HTTP — no encryption"]
    },
    {
      note: "Request travels in the clear — method, path, and headers are readable.",
      packet: "to-server",
      lock: "open",
      lockLabel: "plaintext",
      highlight: "wire",
      activeStep: 0,
      log: ["→ GET /index.html HTTP/1.1", "  Host: example.com  ← readable"]
    },
    {
      note: "Server replies in the clear — anyone on the path can sniff the body.",
      packet: "to-client",
      lock: "open",
      lockLabel: "plaintext",
      highlight: "server",
      activeStep: 4,
      log: ["← 200 OK", "  <html>…</html>  ← readable"]
    }
  ];

  function initTls() {
    var modeEl = document.getElementById("tls-mode");
    var status = document.getElementById("tls-status");
    var meta = document.getElementById("tls-meta");
    var packet = document.getElementById("tls-packet");
    var lock = document.getElementById("tls-lock");
    var lockIcon = document.getElementById("tls-lock-icon");
    var lockLabel = document.getElementById("tls-lock-label");
    var client = document.getElementById("tls-client");
    var server = document.getElementById("tls-server");
    var stepsEl = document.getElementById("tls-steps");
    var codeRoot = document.getElementById("tls-code");
    var codeNote = document.getElementById("tls-code-note");
    var codeLang = document.getElementById("tls-code-lang");
    if (!modeEl || !packet) return;

    var step = 0;
    var playTimer = null;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function steps() {
      return modeEl.value === "http" ? HTTP_STEPS : HTTPS_STEPS;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function renderCode(s) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      (s.log || []).forEach(function (line) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.textContent = line;
        codeRoot.appendChild(row);
      });
    }

    function apply(s) {
      setStatus(s.note);
      if (meta) meta.textContent = String(step) + "/" + String(steps().length - 1);
      if (codeLang) codeLang.textContent = modeEl.value === "http" ? "HTTP/1.1" : "TLS 1.3";
      if (codeNote) {
        codeNote.textContent =
          modeEl.value === "http"
            ? "Plain HTTP: eavesdroppers see everything."
            : "HTTPS = HTTP inside an encrypted TLS tunnel.";
      }

      packet.className = "tls-packet";
      if (s.packet === "hidden") packet.classList.add("is-hidden");
      else if (s.packet === "to-server") packet.classList.add("is-to-server");
      else if (s.packet === "to-client") packet.classList.add("is-to-client");

      if (lock) {
        lock.className = "tls-lock";
        if (s.lock === "locked") lock.classList.add("is-locked");
        else if (s.lock === "half") lock.classList.add("is-half");
        else lock.classList.add("is-open");
      }
      if (lockIcon) {
        lockIcon.textContent =
          s.lock === "locked" ? "locked" : s.lock === "half" ? "…" : "open";
      }
      if (lockLabel) lockLabel.textContent = s.lockLabel || "";

      if (client) client.classList.toggle("is-active", s.highlight === "client");
      if (server) server.classList.toggle("is-active", s.highlight === "server");
      var wire = packet.parentElement;
      if (wire) wire.classList.toggle("is-active", s.highlight === "wire");

      if (stepsEl) {
        stepsEl.querySelectorAll("[data-tls-step]").forEach(function (li) {
          var n = Number(li.getAttribute("data-tls-step"));
          li.classList.toggle("is-active", s.activeStep === n);
          li.classList.toggle("is-done", typeof s.activeStep === "number" && n < s.activeStep);
          li.hidden = modeEl.value === "http" && n > 0 && n < 4;
        });
      }

      renderCode(s);
    }

    function go(n) {
      var list = steps();
      step = Math.max(0, Math.min(n, list.length - 1));
      apply(list[step]);
    }

    function onStep() {
      var list = steps();
      if (step >= list.length - 1) {
        clearPlay();
        return;
      }
      go(step + 1);
    }

    function onPlay() {
      clearPlay();
      if (step >= steps().length - 1) go(0);
      function tick() {
        if (step >= steps().length - 1) {
          clearPlay();
          return;
        }
        onStep();
        playTimer = window.setTimeout(tick, reduceMotion ? 0 : 900);
      }
      tick();
    }

    function onReset() {
      clearPlay();
      go(0);
    }

    document.querySelectorAll("[data-tls-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-tls-action");
        if (a === "step") {
          clearPlay();
          onStep();
        } else if (a === "play") onPlay();
        else if (a === "reset") onReset();
      });
    });

    modeEl.addEventListener("change", function () {
      clearPlay();
      go(0);
    });

    go(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTls);
  } else {
    initTls();
  }
})();
