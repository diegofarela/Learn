/**
 * Interactive 8-bit row: flip, shift, set value; live decimal/hex + place sum.
 */
(function () {
  function initBits() {
    var row = document.getElementById("bits-row");
    var status = document.getElementById("bits-status");
    var decEl = document.getElementById("bits-dec");
    var hexEl = document.getElementById("bits-hex");
    var binEl = document.getElementById("bits-bin");
    var valueInput = document.getElementById("bits-value");
    var codeRoot = document.getElementById("bits-code");
    var codeNote = document.getElementById("bits-code-note");
    if (!row) return;

    var WIDTH = 8;
    var value = 42;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var bitEls = [];

    function clampByte(n) {
      var x = Number(n);
      if (!isFinite(x)) return 0;
      return Math.max(0, Math.min(255, Math.floor(x)));
    }

    function bitAt(i) {
      /* i = 0 is MSB (place 7) */
      return (value >> (WIDTH - 1 - i)) & 1;
    }

    function setStatus(msg) {
      if (status) status.innerHTML = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function padBin(n) {
      var s = n.toString(2);
      while (s.length < WIDTH) s = "0" + s;
      return s;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      var terms = [];
      var sum = 0;
      for (var i = 0; i < WIDTH; i++) {
        var place = WIDTH - 1 - i;
        var on = bitAt(i) === 1;
        var weight = 1 << place;
        if (on) {
          terms.push(String(weight));
          sum += weight;
        }

        var line = document.createElement("div");
        line.className = "code-line" + (on ? " is-active" : " is-dim");
        line.dataset.line = String(i + 1);

        var ln = document.createElement("span");
        ln.className = "code-ln";
        ln.textContent = String(i + 1);

        var src = document.createElement("span");
        src.className = "code-src";
        src.innerHTML =
          'bit[' +
          place +
          '] = <span class="code-num">' +
          bitAt(i) +
          '</span>  <span class="code-cm">/* × ' +
          weight +
          " */</span>";

        line.appendChild(ln);
        line.appendChild(src);
        codeRoot.appendChild(line);
      }

      var blank = document.createElement("div");
      blank.className = "code-line";
      blank.dataset.blank = "1";
      blank.innerHTML = '<span class="code-ln"></span><span class="code-src"></span>';
      codeRoot.appendChild(blank);

      var total = document.createElement("div");
      total.className = "code-line is-active";
      total.innerHTML =
        '<span class="code-ln">Σ</span><span class="code-src">' +
        (terms.length
          ? terms.join(" + ") + ' = <span class="code-num">' + sum + "</span>"
          : '<span class="code-num">0</span>') +
        "</span>";
      codeRoot.appendChild(total);
    }

    function paint() {
      bitEls.forEach(function (btn, i) {
        var on = bitAt(i) === 1;
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.querySelector(".bits-bit-val").textContent = on ? "1" : "0";
      });

      var bin = padBin(value);
      var hexDigits = value.toString(16).toUpperCase();
      if (hexDigits.length < 2) hexDigits = "0" + hexDigits;
      var hex = "0x" + hexDigits;
      if (decEl) decEl.textContent = String(value);
      if (hexEl) hexEl.textContent = hex;
      if (binEl) {
        binEl.innerHTML = bin + "<sub>2</sub>";
      }
      if (valueInput && document.activeElement !== valueInput) {
        valueInput.value = String(value);
      }
      renderCode();
    }

    function flashBit(i) {
      if (reduceMotion || !bitEls[i]) return;
      bitEls[i].classList.remove("is-flash");
      void bitEls[i].offsetWidth;
      bitEls[i].classList.add("is-flash");
    }

    function hexOf(n) {
      var h = n.toString(16).toUpperCase();
      return h.length < 2 ? "0" + h : h;
    }

    function setValue(next, reason) {
      value = clampByte(next);
      paint();
      var bin = padBin(value);
      setStatus(
        value +
          "<sub>10</sub> = " +
          bin +
          "<sub>2</sub> = 0x" +
          hexOf(value) +
          (reason ? " · " + reason : "")
      );
      setCodeNote(
        value === 0
          ? "All bits clear — decimal <strong>0</strong>."
          : "Lit places sum to <strong>" + value + "</strong>."
      );
    }

    function toggleBit(i) {
      var place = WIDTH - 1 - i;
      var mask = 1 << place;
      var next = value ^ mask;
      flashBit(i);
      setValue(next, "flipped bit " + place + " (×" + mask + ")");
    }

    function buildRow() {
      row.innerHTML = "";
      bitEls = [];
      for (var i = 0; i < WIDTH; i++) {
        var place = WIDTH - 1 - i;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bits-bit";
        btn.setAttribute("aria-label", "Toggle bit " + place + ", place value " + (1 << place));
        btn.innerHTML =
          '<span class="bits-bit-val">0</span><span class="bits-bit-idx" aria-hidden="true">' +
          place +
          "</span>";
        btn.addEventListener(
          "click",
          (function (idx) {
            return function () {
              try {
                toggleBit(idx);
              } catch (err) {
                console.error("[learn-bits] Toggle failed", { idx: idx, err: err });
              }
            };
          })(i)
        );
        row.appendChild(btn);
        bitEls.push(btn);
      }
    }

    document.querySelectorAll("[data-bits-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-bits-action");
          if (action === "clear") {
            setValue(0, "cleared");
          } else if (action === "random") {
            setValue(Math.floor(Math.random() * 256), "random byte");
          } else if (action === "set") {
            var raw = valueInput ? valueInput.value : value;
            setValue(raw, "set from input");
          } else if (action === "shl") {
            var left = (value << 1) & 255;
            setValue(left, "shift left (×2, drop overflow)");
          } else if (action === "shr") {
            var right = value >>> 1;
            setValue(right, "shift right (÷2, unsigned)");
          }
        } catch (err) {
          console.error("[learn-bits] Action failed", err);
        }
      });
    });

    if (valueInput) {
      valueInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          setValue(valueInput.value, "set from input");
        }
      });
    }

    buildRow();
    setValue(42, "");
    setStatus("42<sub>10</sub> = 00101010<sub>2</sub> = 0x2A. Flip any bit.");
    setCodeNote("Each lit bit adds its place value. The sum is the decimal number.");
  }

  try {
    initBits();
  } catch (err) {
    console.error("[learn-bits] Init failed", err);
  }
})();
