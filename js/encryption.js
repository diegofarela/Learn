/**
 * Toy Caesar cipher encrypt/decrypt with lock metaphor.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-type">char</span> <span class="code-fn">shift</span>(char c, int k) {', id: "sig" },
    { html: '  <span class="code-kw">if</span> (!isalpha(c)) <span class="code-kw">return</span> c;', id: "guard" },
    { html: '  base = isupper(c) ? <span class="code-str">\'A\'</span> : <span class="code-str">\'a\'</span>;', id: "base" },
    { html: '  <span class="code-kw">return</span> base + (c - base + k + 26) % 26;', id: "mod" },
    { html: '}' },
    { blank: true },
    { html: 'encrypt(msg, k) → shift each letter +k', id: "enc" },
    { html: 'decrypt(msg, k) → shift each letter −k', id: "dec" }
  ];

  function caesar(text, shift) {
    var out = "";
    var k = ((shift % 26) + 26) % 26;
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c >= 65 && c <= 90) {
        out += String.fromCharCode(65 + ((c - 65 + k) % 26));
      } else if (c >= 97 && c <= 122) {
        out += String.fromCharCode(97 + ((c - 97 + k) % 26));
      } else {
        out += text.charAt(i);
      }
    }
    return out;
  }

  function initCipher() {
    var plain = document.getElementById("cipher-plain");
    var keyInput = document.getElementById("cipher-key");
    var outEl = document.getElementById("cipher-out");
    var status = document.getElementById("cipher-status");
    var badge = document.getElementById("cipher-badge");
    var shiftLabel = document.getElementById("cipher-shift-label");
    var lockBody = document.getElementById("cipher-lock-body");
    var lockLabel = document.getElementById("cipher-lock-label");
    var codeRoot = document.getElementById("cipher-code");
    var codeNote = document.getElementById("cipher-code-note");
    if (!plain || !outEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mode = "plain";
    var lastCipher = "";
    var lineEls = {};
    var stepTimers = [];

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

    function keyVal() {
      var k = parseInt(keyInput.value, 10);
      if (isNaN(k)) k = 3;
      k = Math.max(0, Math.min(25, k));
      keyInput.value = String(k);
      if (shiftLabel) shiftLabel.textContent = String(k);
      return k;
    }

    function setLock(locked) {
      if (lockBody) lockBody.classList.toggle("is-locked", locked);
      if (lockLabel) lockLabel.textContent = locked ? "locked" : "open";
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE_LINES.forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        if (line.blank) row.innerHTML = "&nbsp;";
        else row.innerHTML = line.html || "&nbsp;";
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

    function animateOp(isEncrypt) {
      clearTimers();
      var k = keyVal();
      var delay = reduceMotion ? 0 : 300;
      var steps = isEncrypt
        ? [
            { id: "sig", note: "Shift each letter by key <strong>" + k + "</strong>." },
            { id: "guard", note: "Non-letters (spaces) pass through unchanged." },
            { id: "base", note: "Preserve case — A–Z and a–z separately." },
            { id: "mod", note: "Wrap with modulo 26." },
            { id: "enc", note: "Ciphertext produced — toy only, not secure.", visual: "lock" }
          ]
        : [
            { id: "sig", note: "Decrypt: shift by <strong>−" + k + "</strong>." },
            { id: "mod", note: "Same formula with negative key." },
            { id: "dec", note: "Plaintext recovered with the shared key.", visual: "unlock" }
          ];

      var i = 0;
      function tick() {
        if (i >= steps.length) return;
        var step = steps[i];
        highlight(step.id);
        setCodeNote(step.note);
        if (step.visual === "lock") {
          var ct = caesar(plain.value, k);
          lastCipher = ct;
          outEl.textContent = ct;
          outEl.classList.add("is-cipher");
          setLock(true);
          mode = "cipher";
          setBadge("ciphertext");
          setStatus("Encrypted with shift " + k + ". Real systems use AES/RSA — not Caesar.");
        } else if (step.visual === "unlock") {
          var src = lastCipher || outEl.textContent || plain.value;
          var pt = caesar(src, -k);
          plain.value = pt;
          outEl.textContent = pt;
          outEl.classList.remove("is-cipher");
          setLock(false);
          mode = "plain";
          setBadge("plaintext");
          setStatus("Decrypted with the same key. Confidentiality requires a secret key.");
        }
        i++;
        if (reduceMotion) tick();
        else stepTimers.push(window.setTimeout(tick, delay));
      }
      tick();
    }

    function reset() {
      try {
        clearTimers();
        plain.value = "ATTACK AT DAWN";
        keyInput.value = "3";
        keyVal();
        lastCipher = "";
        outEl.textContent = "—";
        outEl.classList.remove("is-cipher");
        setLock(false);
        mode = "plain";
        highlight(null);
        setBadge("plaintext");
        setCodeNote("Encrypt or decrypt — each letter shift highlights.");
        setStatus("Toy Caesar only — production crypto uses AES/RSA with strong keys.");
      } catch (err) {
        console.error("[learn-encryption] reset failed", err);
      }
    }

    document.querySelectorAll("[data-cipher-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-cipher-action");
          if (action === "encrypt") animateOp(true);
          else if (action === "decrypt") {
            if (mode !== "cipher" && outEl.textContent === "—") {
              animateOp(true);
              window.setTimeout(function () {
                animateOp(false);
              }, reduceMotion ? 0 : 1600);
            } else animateOp(false);
          } else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-encryption] action failed", err);
        }
      });
    });

    keyInput.addEventListener("change", keyVal);
    renderCode();
    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCipher);
  } else {
    initCipher();
  }
})();
