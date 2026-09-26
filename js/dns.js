/**
 * Step-through recursive DNS lookup: stub → resolver → TLD → auth.
 */
(function () {
  var STEPS = [
    {
      active: null,
      note: "Ready — press Step to ask the stub resolver.",
      log: ["# waiting for query…"],
      answer: "— waiting —"
    },
    {
      active: "stub",
      note: "Stub resolver on your OS asks: what is the address for this name?",
      log: ["stub → resolver: A? HOST"],
      answer: "querying…"
    },
    {
      active: "resolver",
      note: "Recursive resolver checks cache, then asks the root / TLD.",
      log: ["stub → resolver: A? HOST", "resolver → root: where is TLD?"],
      answer: "walking hierarchy…"
    },
    {
      active: "tld",
      note: "TLD server refers the resolver to the zone's authoritative NS.",
      log: [
        "stub → resolver: A? HOST",
        "resolver → root: where is TLD?",
        "TLD → resolver: NS = auth for ZONE"
      ],
      answer: "referral to authoritative"
    },
    {
      active: "auth",
      note: "Authoritative server answers with the address record.",
      log: [
        "stub → resolver: A? HOST",
        "resolver → root: where is TLD?",
        "TLD → resolver: NS = auth for ZONE",
        "auth → resolver: HOST A ADDR"
      ],
      answer: "ADDR"
    },
    {
      active: "stub",
      note: "Resolver returns the answer to the stub — name resolved.",
      log: [
        "stub → resolver: A? HOST",
        "resolver → root: where is TLD?",
        "TLD → resolver: NS = auth for ZONE",
        "auth → resolver: HOST A ADDR",
        "resolver → stub: HOST A ADDR"
      ],
      answer: "ADDR"
    }
  ];

  function initDns() {
    var hostInput = document.getElementById("dns-host");
    var status = document.getElementById("dns-status");
    var meta = document.getElementById("dns-meta");
    var answerEl = document.getElementById("dns-answer");
    var codeRoot = document.getElementById("dns-code");
    var codeNote = document.getElementById("dns-code-note");
    var chain = document.getElementById("dns-chain");
    if (!hostInput || !chain) return;

    var step = 0;
    var playTimer = null;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function host() {
      var h = String(hostInput.value || "www.example.com").trim().toLowerCase();
      return h || "www.example.com";
    }

    function zoneOf(h) {
      var parts = h.split(".").filter(Boolean);
      if (parts.length >= 2) return parts.slice(-2).join(".");
      return h;
    }

    function tldOf(h) {
      var parts = h.split(".").filter(Boolean);
      return parts.length ? "." + parts[parts.length - 1] : ".com";
    }

    /* Deterministic fake A from hostname for demo */
    function fakeAddr(h) {
      var hash = 0;
      for (var i = 0; i < h.length; i++) hash = (hash * 31 + h.charCodeAt(i)) >>> 0;
      return (
        "93." +
        ((hash >> 16) & 255) +
        "." +
        ((hash >> 8) & 255) +
        "." +
        (hash & 255)
      );
    }

    function expand(template) {
      var h = host();
      return template
        .replace(/HOST/g, h)
        .replace(/ZONE/g, zoneOf(h))
        .replace(/TLD/g, tldOf(h))
        .replace(/ADDR/g, fakeAddr(h));
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

    function paint() {
      var info = STEPS[step] || STEPS[0];
      var h = host();
      var addr = fakeAddr(h);
      if (meta) meta.textContent = String(step);

      chain.querySelectorAll("[data-dns-node]").forEach(function (node) {
        var id = node.getAttribute("data-dns-node");
        node.classList.toggle("is-active", id === info.active);
        if (id === "tld") {
          var name = node.querySelector(".dns-node-name");
          if (name) name.textContent = tldOf(h);
        }
        if (id === "auth") {
          var an = node.querySelector(".dns-node-name");
          if (an) an.textContent = zoneOf(h);
        }
      });

      if (answerEl) {
        answerEl.textContent = expand(info.answer);
        answerEl.classList.toggle("is-ready", step >= 4);
      }

      if (codeRoot) {
        codeRoot.innerHTML = "";
        info.log.forEach(function (raw, i) {
          var src = expand(raw);
          var line = document.createElement("div");
          line.className =
            "code-line" +
            (i === info.log.length - 1 ? " is-active" : src.charAt(0) === "#" ? " is-dim" : "");
          line.innerHTML =
            '<span class="code-ln">' +
            (i + 1) +
            '</span><span class="code-src">' +
            src +
            "</span>";
          codeRoot.appendChild(line);
        });
      }

      if (!reduceMotion && info.active) {
        var active = chain.querySelector('[data-dns-node="' + info.active + '"]');
        if (active) {
          active.classList.remove("is-flash");
          void active.offsetWidth;
          active.classList.add("is-flash");
        }
      }

      setStatus(expand(info.note));
      setCodeNote(
        step === 0
          ? "Each referral narrows the zone until an address is returned."
          : step >= 4
            ? "<strong>" + h + "</strong> → <strong>" + addr + "</strong>"
            : "Following referrals for <strong>" + h + "</strong>…"
      );
    }

    function go(n) {
      step = Math.max(0, Math.min(STEPS.length - 1, n));
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
        playTimer = setTimeout(tick, reduceMotion ? 0 : 650);
      }
      tick();
    }

    hostInput.addEventListener("change", function () {
      try {
        clearPlay();
        go(0);
      } catch (err) {
        console.error("[learn-dns] Host change failed", err);
      }
    });

    document.querySelectorAll("[data-dns-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-dns-action");
          clearPlay();
          if (action === "reset") go(0);
          else if (action === "step") stepOnce();
          else if (action === "play") play();
        } catch (err) {
          console.error("[learn-dns] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    initDns();
  } catch (err) {
    console.error("[learn-dns] Init failed", err);
  }
})();
