/**
 * Live decimal / binary / hex converter with optional 8-bit two's complement.
 */
(function () {
  function initNs() {
    var decInput = document.getElementById("ns-dec");
    var binInput = document.getElementById("ns-bin");
    var hexInput = document.getElementById("ns-hex");
    var twos = document.getElementById("ns-twos");
    var status = document.getElementById("ns-status");
    var meta = document.getElementById("ns-meta");
    var codeRoot = document.getElementById("ns-code");
    var codeNote = document.getElementById("ns-code-note");
    var codeLang = document.getElementById("ns-code-lang");
    var byteRow = document.getElementById("ns-byte");
    if (!decInput || !binInput || !hexInput) return;

    var WIDTH = 8;
    var value = 42; /* signed decimal shown to the user */
    var syncing = false;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function isTwos() {
      return !!(twos && twos.checked);
    }

    function clamp(n) {
      var x = Math.trunc(Number(n));
      if (!isFinite(x)) return 0;
      if (isTwos()) return Math.max(-128, Math.min(127, x));
      return Math.max(0, Math.min(255, x));
    }

    function toByte(n) {
      if (isTwos()) return ((n % 256) + 256) % 256;
      return clamp(n) & 255;
    }

    function fromByte(b) {
      b = b & 255;
      if (isTwos() && b >= 128) return b - 256;
      return b;
    }

    function padBin(b) {
      var s = (b & 255).toString(2);
      while (s.length < WIDTH) s = "0" + s;
      return s;
    }

    function hexOf(b) {
      var h = (b & 255).toString(16).toUpperCase();
      return h.length < 2 ? "0" + h : h;
    }

    function setStatus(html) {
      if (status) status.innerHTML = html;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function flash() {
      if (reduceMotion || !byteRow) return;
      byteRow.classList.remove("is-flash");
      void byteRow.offsetWidth;
      byteRow.classList.add("is-flash");
    }

    function renderCode(byte) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      var terms = [];
      var sum = 0;
      for (var i = 0; i < WIDTH; i++) {
        var place = WIDTH - 1 - i;
        var on = (byte >> place) & 1;
        var weight = 1 << place;
        var signedWeight =
          isTwos() && place === WIDTH - 1 ? -weight : weight;
        if (on) {
          terms.push(String(signedWeight));
          sum += signedWeight;
        }

        var line = document.createElement("div");
        line.className = "code-line" + (on ? " is-active" : " is-dim");
        line.innerHTML =
          '<span class="code-ln">' +
          (i + 1) +
          '</span><span class="code-src">bit[' +
          place +
          '] = <span class="code-num">' +
          on +
          '</span>  <span class="code-cm">/* × ' +
          signedWeight +
          " */</span></span>";
        codeRoot.appendChild(line);
      }

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

    function renderByte(byte) {
      if (!byteRow) return;
      byteRow.innerHTML = "";
      for (var i = 0; i < WIDTH; i++) {
        var place = WIDTH - 1 - i;
        var on = (byte >> place) & 1;
        var cell = document.createElement("span");
        cell.className =
          "ns-bit" +
          (on ? " is-on" : "") +
          (isTwos() && place === WIDTH - 1 ? " is-sign" : "");
        cell.textContent = on ? "1" : "0";
        cell.title =
          isTwos() && place === WIDTH - 1
            ? "sign bit (−128 when set)"
            : "place " + (1 << place);
        byteRow.appendChild(cell);
      }
    }

    function paint(reason) {
      var byte = toByte(value);
      syncing = true;
      try {
        if (document.activeElement !== decInput) decInput.value = String(value);
        if (document.activeElement !== binInput) binInput.value = padBin(byte);
        if (document.activeElement !== hexInput) hexInput.value = hexOf(byte);
      } finally {
        syncing = false;
      }

      if (meta) meta.textContent = String(value);
      if (codeLang) codeLang.textContent = isTwos() ? "two's complement" : "unsigned";
      renderByte(byte);
      renderCode(byte);
      setStatus(
        value +
          "<sub>10</sub> = " +
          padBin(byte) +
          "<sub>2</sub> = 0x" +
          hexOf(byte) +
          (reason ? " · " + reason : "")
      );
      setCodeNote(
        isTwos()
          ? "MSB is the sign bit (−128). Other places add positive weights."
          : "Unsigned places sum to <strong>" + value + "</strong>."
      );
    }

    function setValue(n, reason) {
      value = clamp(n);
      flash();
      paint(reason || "");
    }

    function parseDec(raw) {
      var s = String(raw || "").trim();
      if (!s || !/^-?\d+$/.test(s)) return null;
      return clamp(parseInt(s, 10));
    }

    function parseBin(raw) {
      var s = String(raw || "").trim().replace(/\s+/g, "");
      if (!s || !/^[01]+$/.test(s)) return null;
      if (s.length > WIDTH) s = s.slice(-WIDTH);
      var byte = parseInt(s, 2);
      if (!isFinite(byte)) return null;
      return fromByte(byte);
    }

    function parseHex(raw) {
      var s = String(raw || "").trim().replace(/^0x/i, "");
      if (!s || !/^[0-9a-fA-F]+$/.test(s)) return null;
      if (s.length > 2) s = s.slice(-2);
      var byte = parseInt(s, 16);
      if (!isFinite(byte)) return null;
      return fromByte(byte);
    }

    function bindInput(el, parser, label) {
      if (!el) return;
      el.addEventListener("input", function () {
        if (syncing) return;
        try {
          var next = parser(el.value);
          if (next === null) {
            setStatus("Invalid " + label + " — keep typing…");
            return;
          }
          setValue(next, "from " + label);
        } catch (err) {
          console.error("[learn-ns] Parse failed", { label: label, err: err });
        }
      });
    }

    bindInput(decInput, parseDec, "decimal");
    bindInput(binInput, parseBin, "binary");
    bindInput(hexInput, parseHex, "hex");

    if (twos) {
      twos.addEventListener("change", function () {
        try {
          setValue(fromByte(toByte(value)), isTwos() ? "two's on" : "unsigned");
        } catch (err) {
          console.error("[learn-ns] Toggle failed", err);
        }
      });
    }

    document.querySelectorAll("[data-ns-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-ns-action");
          if (action === "reset") setValue(42, "reset");
          else if (action === "neg1") {
            if (!isTwos() && twos) twos.checked = true;
            setValue(-1, "all bits set");
          } else if (action === "max") {
            setValue(isTwos() ? 127 : 255, "max for mode");
          } else if (action === "random") {
            var lo = isTwos() ? -128 : 0;
            var hi = isTwos() ? 127 : 255;
            setValue(lo + Math.floor(Math.random() * (hi - lo + 1)), "random");
          }
        } catch (err) {
          console.error("[learn-ns] Action failed", err);
        }
      });
    });

    paint("");
  }

  try {
    initNs();
  } catch (err) {
    console.error("[learn-ns] Init failed", err);
  }
})();
