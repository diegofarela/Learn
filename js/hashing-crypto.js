/**
 * Cryptographic hash demo: SHA-256 via Web Crypto, with toy fallback + avalanche.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-type">digest</span> <span class="code-fn">hash</span>(msg) {', id: "sig" },
    { html: '  bytes = encodeUTF8(msg);', id: "encode" },
    { html: '  digest = SHA256(bytes); <span class="code-cm">/* fixed 256 bits */</span>', id: "hash" },
    { html: '  <span class="code-kw">return</span> hex(digest);', id: "hex" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-cm">/* avalanche: flip 1 char → unrelated digest */</span>', id: "avalanche" }
  ];

  function toyHash(str) {
    var h1 = 0x811c9dc5;
    var h2 = 0x01000193;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      h1 ^= c;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
      h2 ^= h2 >>> 13;
    }
    var out = "";
    var a = h1;
    var b = h2;
    for (var n = 0; n < 8; n++) {
      a = Math.imul(a ^ b, 0x27d4eb2d) >>> 0;
      b = Math.imul(b + a, 0x165667b1) >>> 0;
      out += ("00000000" + (a ^ b).toString(16)).slice(-8);
    }
    return out;
  }

  function toHex(buffer) {
    var bytes = new Uint8Array(buffer);
    var hex = "";
    for (var i = 0; i < bytes.length; i++) {
      hex += ("0" + bytes[i].toString(16)).slice(-2);
    }
    return hex;
  }

  function diffHex(a, b) {
    if (!a || !b || a.length !== b.length) return null;
    var changed = 0;
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) changed++;
    }
    return Math.round((changed / a.length) * 100);
  }

  function initHashCrypto() {
    var input = document.getElementById("hcrypto-input");
    var digestEl = document.getElementById("hcrypto-digest");
    var prevEl = document.getElementById("hcrypto-prev");
    var compareEl = document.getElementById("hcrypto-compare");
    var diffEl = document.getElementById("hcrypto-diff");
    var status = document.getElementById("hcrypto-status");
    var badge = document.getElementById("hcrypto-badge");
    var algoLabel = document.getElementById("hash-algo-label");
    var codeRoot = document.getElementById("hcrypto-code");
    var codeNote = document.getElementById("hcrypto-code-note");
    if (!input || !digestEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var useWebCrypto =
      typeof window.crypto !== "undefined" &&
      window.crypto.subtle &&
      typeof TextEncoder !== "undefined";
    var prevDigest = null;
    var currentDigest = "";
    var busy = false;
    var lineEls = {};
    var stepTimers = [];

    if (algoLabel) algoLabel.textContent = useWebCrypto ? "SHA-256" : "demo hash";

    function clearTimers() {
      stepTimers.forEach(function (t) {
        window.clearTimeout(t);
      });
      stepTimers = [];
    }

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
        if (line.blank) {
          row.innerHTML = "&nbsp;";
        } else {
          row.innerHTML = line.html || "&nbsp;";
        }
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

    function showDigest(hex, flash) {
      digestEl.textContent = hex;
      digestEl.classList.toggle("is-flash", !!flash && !reduceMotion);
      if (flash && !reduceMotion) {
        window.setTimeout(function () {
          digestEl.classList.remove("is-flash");
        }, 500);
      }
    }

    function compute(msg) {
      if (useWebCrypto) {
        var enc = new TextEncoder().encode(msg);
        return window.crypto.subtle.digest("SHA-256", enc).then(toHex);
      }
      return Promise.resolve(toyHash(msg));
    }

    function runHash(showCompare) {
      if (busy) return;
      busy = true;
      clearTimers();
      var msg = input.value;
      var delay = reduceMotion ? 0 : 280;
      var steps = ["sig", "encode", "hash", "hex"];

      function afterDigest(hex) {
        if (showCompare && currentDigest) {
          prevDigest = currentDigest;
          if (prevEl) prevEl.textContent = prevDigest;
          if (compareEl) compareEl.hidden = false;
          var pct = diffHex(prevDigest, hex);
          if (diffEl) {
            diffEl.textContent =
              pct === null
                ? "Digests differ."
                : pct + "% of hex digits changed — avalanche.";
          }
          highlight("avalanche");
          setBadge("avalanche");
          setStatus("One-character change scrambled the digest.");
        } else {
          if (compareEl) compareEl.hidden = true;
          setBadge(useWebCrypto ? "SHA-256" : "demo");
          setStatus(
            "Digest ready (" +
              (useWebCrypto ? "SHA-256" : "toy demo hash") +
              "). Flip a character to see avalanche."
          );
        }
        currentDigest = hex;
        showDigest(hex, true);
        setCodeNote("Fixed-length hex digest of the message.");
        busy = false;
      }

      var i = 0;
      function tick() {
        if (i >= steps.length) {
          compute(msg)
            .then(afterDigest)
            .catch(function (err) {
              console.error("[learn-hashing-crypto] digest failed", err);
              afterDigest(toyHash(msg));
            });
          return;
        }
        highlight(steps[i]);
        var notes = {
          sig: "Enter <strong>hash</strong> with the message.",
          encode: "Encode the string as bytes.",
          hash: "Run the compression function (SHA-256 or demo).",
          hex: "Format the digest as hex."
        };
        setCodeNote(notes[steps[i]] || "");
        i++;
        if (reduceMotion) tick();
        else stepTimers.push(window.setTimeout(tick, delay));
      }
      tick();
    }

    function flipChar() {
      try {
        var s = input.value || "hello";
        if (!s.length) s = "hello";
        var idx = Math.floor(s.length / 2);
        var code = s.charCodeAt(idx);
        var next = String.fromCharCode(code === 122 ? 97 : code + 1);
        input.value = s.slice(0, idx) + next + s.slice(idx + 1);
        runHash(true);
      } catch (err) {
        console.error("[learn-hashing-crypto] flip failed", err);
      }
    }

    function reset() {
      try {
        clearTimers();
        busy = false;
        input.value = "hello";
        prevDigest = null;
        currentDigest = "";
        if (compareEl) compareEl.hidden = true;
        showDigest("—");
        highlight(null);
        setBadge("ready");
        setCodeNote("Hash or flip a character — the pipeline highlights.");
        setStatus("Hash “hello” — then flip one character and watch the digest scramble.");
      } catch (err) {
        console.error("[learn-hashing-crypto] reset failed", err);
      }
    }

    document.querySelectorAll("[data-hcrypto-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-hcrypto-action");
          if (action === "hash") runHash(false);
          else if (action === "flip") flipChar();
          else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-hashing-crypto] action failed", err);
        }
      });
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") runHash(false);
    });

    renderCode();
    reset();
    runHash(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHashCrypto);
  } else {
    initHashCrypto();
  }
})();
