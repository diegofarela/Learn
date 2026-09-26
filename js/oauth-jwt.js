/**
 * OAuth authorization-code flow + toy JWT part decode.
 */
(function () {
  var HEADER = { alg: "HS256", typ: "JWT" };
  var PAYLOAD = {
    sub: "alice",
    iss: "https://idp.example",
    aud: "api.example",
    exp: 9999999999,
    scope: "read:profile"
  };
  var SIG = "toy_signature_not_real";

  var STEPS = [
    {
      note: "Ready — press Step to start the authorization-code flow.",
      badge: "idle",
      log: ["# OAuth 2 authorization code (simplified)"]
    },
    {
      note: "App redirects the browser to the identity provider (IdP).",
      badge: "redirect",
      active: 0,
      log: [
        "→ GET /authorize?client_id=app&redirect_uri=…&response_type=code"
      ]
    },
    {
      note: "User authenticates at the IdP and consents to scopes.",
      badge: "consent",
      active: 1,
      log: ["IdP: user alice consents scope=read:profile"]
    },
    {
      note: "IdP redirects back with a short-lived authorization code.",
      badge: "code",
      active: 2,
      log: ["← redirect?code=SplxlOBeZQQYbYS6WxSbIA"]
    },
    {
      note: "App exchanges the code (server-side) for access / ID tokens.",
      badge: "token",
      active: 3,
      showJwt: true,
      log: [
        "→ POST /token  code=…&client_secret=…",
        "← { access_token: <JWT>, token_type: Bearer }"
      ]
    },
    {
      note: "App calls the API with Authorization: Bearer <JWT>.",
      badge: "API",
      active: 4,
      showJwt: true,
      log: ["→ GET /me  Authorization: Bearer eyJ…", "← 200 { name: \"alice\" }"]
    }
  ];

  function b64url(obj) {
    try {
      var json = JSON.stringify(obj);
      var b64 = btoa(unescape(encodeURIComponent(json)));
      return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    } catch (e) {
      return "error";
    }
  }

  function initOj() {
    var status = document.getElementById("oj-status");
    var meta = document.getElementById("oj-meta");
    var badge = document.getElementById("oj-badge");
    var flow = document.getElementById("oj-flow");
    var jwtEl = document.getElementById("oj-jwt");
    var decodeEl = document.getElementById("oj-decode");
    var codeRoot = document.getElementById("oj-code");
    var codeNote = document.getElementById("oj-code-note");
    if (!flow) return;

    var step = 0;
    var playTimer = null;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var parts = {
      header: b64url(HEADER),
      payload: b64url(PAYLOAD),
      sig: b64url({ v: SIG })
    };

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function showPart(name) {
      if (!decodeEl) return;
      jwtEl.querySelectorAll(".oj-part").forEach(function (btn) {
        btn.classList.toggle(
          "is-active",
          btn.getAttribute("data-oj-part") === name
        );
      });
      if (name === "header") {
        decodeEl.textContent =
          "header (decoded):\n" + JSON.stringify(HEADER, null, 2);
      } else if (name === "payload") {
        decodeEl.textContent =
          "payload (decoded):\n" + JSON.stringify(PAYLOAD, null, 2);
      } else {
        decodeEl.textContent =
          "signature (toy):\n" +
          SIG +
          "\n\n# Real systems verify HMAC/RSA over header.payload";
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
      if (meta) meta.textContent = String(step) + "/" + String(STEPS.length - 1);
      if (badge) badge.textContent = s.badge || "idle";
      flow.querySelectorAll("[data-oj-step]").forEach(function (li) {
        var n = Number(li.getAttribute("data-oj-step"));
        li.classList.toggle("is-active", s.active === n);
        li.classList.toggle(
          "is-done",
          typeof s.active === "number" && n < s.active
        );
      });
      if (jwtEl) {
        jwtEl.classList.toggle("is-visible", !!s.showJwt);
        if (s.showJwt) {
          jwtEl.querySelector('[data-oj-part="header"]').textContent = parts.header.slice(0, 12) + "…";
          jwtEl.querySelector('[data-oj-part="payload"]').textContent = parts.payload.slice(0, 12) + "…";
          jwtEl.querySelector('[data-oj-part="sig"]').textContent = parts.sig.slice(0, 10) + "…";
          showPart("payload");
        } else if (decodeEl) {
          decodeEl.textContent = "";
          jwtEl.querySelectorAll(".oj-part").forEach(function (b) {
            b.classList.remove("is-active");
          });
        }
      }
      renderCode(s);
      if (codeNote) {
        codeNote.textContent = s.showJwt
          ? "Click a JWT segment to decode (toy — not verified)."
          : "Toy decode only — not a real signature check.";
      }
    }

    function go(n) {
      step = Math.max(0, Math.min(n, STEPS.length - 1));
      apply(STEPS[step]);
    }

    function onStep() {
      if (step >= STEPS.length - 1) {
        clearPlay();
        return;
      }
      go(step + 1);
    }

    document.querySelectorAll("[data-oj-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-oj-action");
        if (a === "step") {
          clearPlay();
          onStep();
        } else if (a === "play") {
          clearPlay();
          if (step >= STEPS.length - 1) go(0);
          function tick() {
            if (step >= STEPS.length - 1) {
              clearPlay();
              return;
            }
            onStep();
            playTimer = window.setTimeout(tick, reduceMotion ? 0 : 850);
          }
          tick();
        } else if (a === "reset") {
          clearPlay();
          go(0);
        }
      });
    });

    jwtEl.querySelectorAll("[data-oj-part]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showPart(btn.getAttribute("data-oj-part"));
      });
    });

    go(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOj);
  } else {
    initOj();
  }
})();
