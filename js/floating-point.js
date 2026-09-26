/**
 * Floating point: IEEE-754 binary32 sign/exp/mantissa live decode.
 */
(function () {
  var BIAS = 127;

  function init() {
    var signRoot = document.getElementById("f754-sign");
    var expRoot = document.getElementById("f754-exp");
    var mantRoot = document.getElementById("f754-mant");
    var status = document.getElementById("f754-status");
    var phase = document.getElementById("f754-phase");
    var meta = document.getElementById("f754-meta");
    var decode = document.getElementById("f754-decode");
    var codeRoot = document.getElementById("f754-code");
    var codeNote = document.getElementById("f754-code-note");
    if (!signRoot || !expRoot || !mantRoot) return;

    /* default ≈ 0.1 */
    var bits = floatToBits(0.1);
    var bitEls = [];

    function floatToBits(f) {
      var buf = new ArrayBuffer(4);
      new Float32Array(buf)[0] = f;
      return new Uint32Array(buf)[0] >>> 0;
    }

    function bitsToFloat(u) {
      var buf = new ArrayBuffer(4);
      new Uint32Array(buf)[0] = u >>> 0;
      return new Float32Array(buf)[0];
    }

    function getBit(i) {
      /* i=0 MSB (sign) */
      return (bits >>> (31 - i)) & 1;
    }

    function setBit(i, v) {
      var mask = 1 << (31 - i);
      if (v) bits = (bits | mask) >>> 0;
      else bits = (bits & ~mask) >>> 0;
    }

    function hex32(u) {
      var h = (u >>> 0).toString(16).toUpperCase();
      while (h.length < 8) h = "0" + h;
      return "0x" + h;
    }

    function renderField(root, start, len, cls) {
      root.innerHTML = "";
      for (var i = 0; i < len; i++) {
        var idx = start + i;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "f754-bit" + (cls ? " " + cls : "");
        btn.setAttribute("aria-pressed", getBit(idx) ? "true" : "false");
        btn.dataset.idx = String(idx);
        btn.textContent = String(getBit(idx));
        if (getBit(idx)) btn.classList.add("is-on");
        btn.addEventListener("click", onFlip);
        root.appendChild(btn);
        bitEls[idx] = btn;
      }
    }

    function onFlip(ev) {
      try {
        var idx = Number(ev.currentTarget.dataset.idx);
        setBit(idx, getBit(idx) ? 0 : 1);
        paint();
      } catch (err) {
        console.error("[learn-f754] Flip failed", err);
      }
    }

    function paint() {
      renderField(signRoot, 0, 1, "is-sign");
      renderField(expRoot, 1, 8, "is-exp");
      renderField(mantRoot, 9, 23, "is-mant");

      var s = getBit(0);
      var e = (bits >>> 23) & 0xff;
      var m = bits & 0x7fffff;
      var val = bitsToFloat(bits);

      if (phase) phase.textContent = hex32(bits);
      if (meta) {
        meta.textContent = isFinite(val) ? String(val) : String(val);
      }

      var lines;
      var note;
      var msg;
      var formula;

      if (e === 0xff) {
        if (m === 0) {
          formula = (s ? "−" : "+") + "Infinity";
          lines = [
            "exp = 255, frac = 0 → infinity",
            "sign = " + s
          ];
          note = "All-ones exponent with zero fraction is ±∞.";
          msg = "Special: infinity.";
        } else {
          formula = "NaN";
          lines = [
            "exp = 255, frac ≠ 0 → NaN",
            "payload = " + m
          ];
          note = "Not-a-Number — invalid / indeterminate.";
          msg = "Special: NaN (not a number).";
        }
      } else if (e === 0) {
        if (m === 0) {
          formula = (s ? "−" : "+") + "0";
          lines = ["exp = 0, frac = 0 → signed zero", "sign = " + s];
          note = "Two zeros: +0 and −0.";
          msg = "Signed zero.";
        } else {
          var den = Math.pow(2, -126) * (m / Math.pow(2, 23));
          if (s) den = -den;
          formula = "subnormal ≈ " + den;
          lines = [
            "exp = 0 → subnormal (no leading 1)",
            "value = (−1)^" + s + " × 2^(−126) × (m/2^23)"
          ];
          note = "Subnormals fill the gap near zero.";
          msg = "Subnormal number.";
        }
      } else {
        var E = e - BIAS;
        var sig = 1 + m / Math.pow(2, 23);
        formula =
          (s ? "-" : "+") +
          " × 2^(" +
          E +
          ") × " +
          sig.toFixed(6) +
          " ≈ " +
          val;
        lines = [
          "sign = " + s,
          "E = exp − 127 = " + e + " − 127 = " + E,
          "significand = 1 + m/2^23 = " + sig.toFixed(8),
          "value ≈ " + val
        ];
        note = "Bias for binary32 exponent is 127.";
        msg =
          "Normal: (−1)^" +
          s +
          " × 2^" +
          E +
          " × significand.";
      }

      if (decode) decode.textContent = formula;
      if (status) status.textContent = msg;
      if (codeNote) codeNote.textContent = note;
      if (codeRoot) {
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
    }

    function applyPreset(name) {
      if (name === "1") bits = floatToBits(1);
      else if (name === "0.1") bits = floatToBits(0.1);
      else if (name === "neg") bits = floatToBits(-2.5);
      else if (name === "inf") bits = 0x7f800000;
      else if (name === "nan") bits = 0x7fc00000;
      paint();
    }

    document.querySelectorAll("[data-f754-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          applyPreset(btn.getAttribute("data-f754-preset"));
        } catch (err) {
          console.error("[learn-f754] Preset failed", err);
        }
      });
    });

    var resetBtn = document.querySelector("[data-f754-action='reset']");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        try {
          bits = floatToBits(0.1);
          paint();
        } catch (err) {
          console.error("[learn-f754] Reset failed", err);
        }
      });
    }

    paint();
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-f754] Init failed", err);
  }
})();
