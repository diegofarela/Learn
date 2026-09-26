/**
 * Side-by-side TCP handshake/delivery vs UDP datagram fire-and-forget.
 */
(function () {
  var STEPS = [
    {
      note: "Ready — press Step to begin the TCP handshake (UDP stays quiet).",
      phase: "idle",
      tcpNote: "connection closed",
      udpNote: "no session",
      tcp: [],
      udp: [],
      log: ["# waiting…"],
      highlight: null
    },
    {
      note: "TCP: A sends SYN to open a connection. UDP still idle.",
      phase: "SYN",
      tcpNote: "SYN →",
      udpNote: "no session",
      tcp: [{ label: "SYN", dir: "ab", active: true }],
      udp: [],
      log: ["TCP A → B: SYN"],
      highlight: "tcp"
    },
    {
      note: "TCP: B replies SYN-ACK. UDP still has no handshake.",
      phase: "SYN-ACK",
      tcpNote: "SYN-ACK ←",
      udpNote: "no session",
      tcp: [
        { label: "SYN", dir: "ab" },
        { label: "SYN-ACK", dir: "ba", active: true }
      ],
      udp: [],
      log: ["TCP A → B: SYN", "TCP B → A: SYN-ACK"],
      highlight: "tcp"
    },
    {
      note: "TCP: A sends ACK — connection established. UDP still quiet.",
      phase: "ACK",
      tcpNote: "established",
      udpNote: "no session",
      tcp: [
        { label: "SYN", dir: "ab" },
        { label: "SYN-ACK", dir: "ba" },
        { label: "ACK", dir: "ab", active: true }
      ],
      udp: [],
      log: ["TCP A → B: SYN", "TCP B → A: SYN-ACK", "TCP A → B: ACK  (connected)"],
      highlight: "tcp"
    },
    {
      note: "Data: TCP sends seq=1 then seq=2 (ordered). UDP blasts D1, D2 with no ACK.",
      phase: "data",
      tcpNote: "ordered delivery",
      udpNote: "fire-and-forget",
      tcp: [
        { label: "seq1", dir: "ab", active: true },
        { label: "seq2", dir: "ab" }
      ],
      udp: [
        { label: "D1", dir: "ab", active: true },
        { label: "D2", dir: "ab" }
      ],
      log: [
        "TCP A → B: DATA seq=1",
        "TCP A → B: DATA seq=2",
        "UDP A → B: datagram D1",
        "UDP A → B: datagram D2"
      ],
      highlight: "both"
    },
    {
      note: "TCP waits for ACKs; UDP may lose D2 with no retry.",
      phase: "ack-loss",
      tcpNote: "ACK seq1, seq2",
      udpNote: "D2 lost?",
      tcp: [
        { label: "ACK1", dir: "ba", active: true },
        { label: "ACK2", dir: "ba" }
      ],
      udp: [
        { label: "D1", dir: "ab" },
        { label: "D2", dir: "ab", lost: true, active: true }
      ],
      log: [
        "TCP B → A: ACK seq=1",
        "TCP B → A: ACK seq=2",
        "UDP: D1 arrives",
        "UDP: D2 … dropped (no retransmit)"
      ],
      highlight: "both"
    },
    {
      note: "Done — TCP delivered in order; UDP was best-effort only.",
      phase: "done",
      tcpNote: "reliable + ordered",
      udpNote: "best-effort",
      tcp: [{ label: "OK", dir: "ab", active: true }],
      udp: [{ label: "D1", dir: "ab" }],
      log: ["# TCP: ordered + ACKed", "# UDP: maybe delivered"],
      highlight: "both"
    }
  ];

  function initTu() {
    var status = document.getElementById("tu-status");
    var meta = document.getElementById("tu-meta");
    var phase = document.getElementById("tu-phase");
    var tcpPkts = document.getElementById("tu-tcp-pkts");
    var udpPkts = document.getElementById("tu-udp-pkts");
    var tcpNote = document.getElementById("tu-tcp-note");
    var udpNote = document.getElementById("tu-udp-note");
    var tcpCol = document.getElementById("tu-tcp");
    var udpCol = document.getElementById("tu-udp");
    var codeRoot = document.getElementById("tu-code");
    var codeNote = document.getElementById("tu-code-note");
    if (!tcpPkts || !udpPkts) return;

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

    function renderPkts(root, list) {
      root.innerHTML = "";
      list.forEach(function (p) {
        var el = document.createElement("span");
        el.className =
          "tu-pkt" +
          (p.dir === "ba" ? " is-ba" : " is-ab") +
          (p.active ? " is-active" : "") +
          (p.lost ? " is-lost" : "");
        el.textContent = p.label;
        root.appendChild(el);
      });
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
      if (tcpNote) tcpNote.textContent = info.tcpNote;
      if (udpNote) udpNote.textContent = info.udpNote;
      if (tcpCol) {
        tcpCol.classList.toggle(
          "is-active",
          info.highlight === "tcp" || info.highlight === "both"
        );
      }
      if (udpCol) {
        udpCol.classList.toggle(
          "is-active",
          info.highlight === "udp" || info.highlight === "both"
        );
      }
      renderPkts(tcpPkts, info.tcp);
      renderPkts(udpPkts, info.udp);
      renderCode(info.log);
      if (codeNote) {
        codeNote.innerHTML =
          step === 0
            ? "TCP pays for reliability; UDP pays almost nothing."
            : step <= 3
              ? "Three-way handshake: <strong>SYN → SYN-ACK → ACK</strong>."
              : "TCP ACKs; UDP may drop packets silently.";
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
        playTimer = setTimeout(tick, reduceMotion ? 0 : 750);
      }
      tick();
    }

    document.querySelectorAll("[data-tu-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-tu-action");
          clearPlay();
          if (action === "reset") go(0);
          else if (action === "step") stepOnce();
          else if (action === "play") play();
        } catch (err) {
          console.error("[learn-tu] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    initTu();
  } catch (err) {
    console.error("[learn-tu] Init failed", err);
  }
})();
