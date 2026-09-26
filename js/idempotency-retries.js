/**
 * Idempotency & retries: duplicate charge with/without idempotency key.
 */
(function () {
  function init() {
    var walletEl = document.getElementById("idem-wallet");
    var chargesEl = document.getElementById("idem-charges");
    var storeEl = document.getElementById("idem-store");
    var status = document.getElementById("idem-status");
    var phase = document.getElementById("idem-phase");
    var meta = document.getElementById("idem-meta");
    var codeRoot = document.getElementById("idem-code");
    var codeNote = document.getElementById("idem-code-note");
    if (!walletEl) return;

    var useKey = false;
    var wallet = 100;
    var charges = 0;
    var store = {}; /* key -> response */
    var lastKey = "pay-1";
    var reqCount = 0;

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lines.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className = "code-line" + (i === lines.length - 1 ? " is-active" : "");
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
      if (walletEl) walletEl.textContent = "$" + wallet;
      if (chargesEl) chargesEl.textContent = String(charges);
      if (meta) meta.textContent = String(charges);
      if (phase) phase.textContent = useKey ? "KEYS ON" : "KEYS OFF";

      document.querySelectorAll("[data-idem-mode]").forEach(function (btn) {
        btn.classList.toggle(
          "is-selected",
          (btn.getAttribute("data-idem-mode") === "on") === useKey
        );
      });

      if (storeEl) {
        var keys = Object.keys(store);
        storeEl.innerHTML =
          keys.length === 0
            ? '<span class="idem-store-empty">idempotency store empty</span>'
            : keys
                .map(function (k) {
                  return (
                    '<div class="idem-store-row"><code>' +
                    k +
                    "</code> → " +
                    store[k] +
                    "</div>"
                  );
                })
                .join("");
      }
    }

    function charge(isRetry) {
      reqCount += 1;
      var key = lastKey;
      if (!isRetry) {
        lastKey = "pay-" + reqCount;
        key = lastKey;
      }

      if (useKey) {
        if (store[key]) {
          if (status) {
            status.textContent =
              "Duplicate key " + key + " — replayed prior result, no new charge.";
          }
          renderCode([
            "Idempotency-Key: " + key,
            "store hit → return cached OK",
            "wallet unchanged ($" + wallet + ")"
          ]);
          if (codeNote) {
            codeNote.textContent = "Same key ⇒ same side effect (once).";
          }
          paint();
          return;
        }
        wallet -= 10;
        charges += 1;
        store[key] = "OK charged $10";
        if (status) {
          status.textContent =
            "First time seeing " + key + " — charged once and stored.";
        }
        renderCode([
          "Idempotency-Key: " + key,
          "store miss → apply charge",
          "store[" + key + "] = OK",
          "wallet = $" + wallet
        ]);
        if (codeNote) {
          codeNote.textContent = "Store responses by key; replay on duplicate.";
        }
      } else {
        wallet -= 10;
        charges += 1;
        if (status) {
          status.textContent = isRetry
            ? "Retry without a key double-charged the wallet."
            : "Charged $10 (no dedupe).";
        }
        renderCode([
          "POST /charge amount=10",
          "no Idempotency-Key",
          "apply charge #" + charges,
          "wallet = $" + wallet
        ]);
        if (codeNote) {
          codeNote.textContent = "Without a key, retries are new requests.";
        }
      }
      paint();
    }

    function reset() {
      wallet = 100;
      charges = 0;
      store = {};
      lastKey = "pay-1";
      reqCount = 0;
      if (status) {
        status.textContent = useKey
          ? "Keys on: retries with the same key will not double-charge."
          : "Without a key, every retry is a new charge.";
      }
      renderCode([
        "wallet = $100",
        "charges = 0",
        useKey ? "Idempotency-Key required" : "no key"
      ]);
      if (codeNote) {
        codeNote.textContent = "Store responses by key; replay on duplicate.";
      }
      paint();
    }

    document.querySelectorAll("[data-idem-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          useKey = btn.getAttribute("data-idem-mode") === "on";
          reset();
        } catch (err) {
          console.error("[learn-idem] Mode failed", err);
        }
      });
    });

    document.querySelectorAll("[data-idem-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var a = btn.getAttribute("data-idem-action");
          if (a === "send") charge(false);
          else if (a === "retry") charge(true);
          else if (a === "reset") reset();
        } catch (err) {
          console.error("[learn-idem] Action failed", err);
        }
      });
    });

    reset();
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-idem] Init failed", err);
  }
})();
