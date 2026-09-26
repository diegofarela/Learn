/**
 * Type a character → Unicode code point + UTF-8 bytes.
 */
(function () {
  function initEnc() {
    var input = document.getElementById("enc-input");
    var status = document.getElementById("enc-status");
    var meta = document.getElementById("enc-meta");
    var glyph = document.getElementById("enc-glyph");
    var bytesEl = document.getElementById("enc-bytes");
    var codeRoot = document.getElementById("enc-code");
    var codeNote = document.getElementById("enc-code-note");
    var codeLang = document.getElementById("enc-code-lang");
    if (!input) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function firstGrapheme(s) {
      var str = String(s || "");
      if (!str) return "";
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        try {
          var seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
          var it = seg.segment(str)[Symbol.iterator]();
          var first = it.next();
          return first.done ? "" : first.value.segment;
        } catch (err) {
          console.error("[learn-enc] Segmenter failed", err);
        }
      }
      var cps = Array.from(str);
      return cps.length ? cps[0] : "";
    }

    function utf8Bytes(ch) {
      if (typeof TextEncoder !== "undefined") {
        return Array.from(new TextEncoder().encode(ch));
      }
      /* Fallback for rare environments without TextEncoder */
      var code = ch.codePointAt(0);
      if (code <= 0x7f) return [code];
      if (code <= 0x7ff) {
        return [0xc0 | (code >> 6), 0x80 | (code & 0x3f)];
      }
      if (code <= 0xffff) {
        return [
          0xe0 | (code >> 12),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f)
        ];
      }
      return [
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      ];
    }

    function hexByte(n) {
      var h = n.toString(16).toUpperCase();
      return h.length < 2 ? "0" + h : h;
    }

    function padBin8(n) {
      var s = (n & 255).toString(2);
      while (s.length < 8) s = "0" + s;
      return s;
    }

    function padHex(cp, width) {
      var h = cp.toString(16).toUpperCase();
      while (h.length < width) h = "0" + h;
      return h;
    }

    function flashBytes() {
      if (reduceMotion || !bytesEl) return;
      bytesEl.classList.remove("is-flash");
      void bytesEl.offsetWidth;
      bytesEl.classList.add("is-flash");
    }

    function paint(ch) {
      if (!ch) {
        if (glyph) glyph.textContent = "·";
        if (meta) meta.textContent = "—";
        if (bytesEl) bytesEl.innerHTML = "";
        if (codeRoot) codeRoot.innerHTML = "";
        if (codeLang) codeLang.textContent = "—";
        setStatus("Type a character to encode.");
        setCodeNote("Empty input — nothing to encode.");
        return;
      }

      var cp = ch.codePointAt(0);
      var bytes = utf8Bytes(ch);
      var uPlus = padHex(cp, cp > 0xffff ? 5 : 4);

      if (glyph) glyph.textContent = ch;
      if (meta) meta.textContent = uPlus;

      if (bytesEl) {
        bytesEl.innerHTML = "";
        bytes.forEach(function (b, i) {
          var cell = document.createElement("span");
          cell.className = "enc-byte";
          cell.innerHTML =
            '<span class="enc-byte-hex">' +
            hexByte(b) +
            '</span><span class="enc-byte-bin">' +
            padBin8(b) +
            "</span>";
          cell.style.animationDelay = reduceMotion ? "0ms" : i * 40 + "ms";
          bytesEl.appendChild(cell);
        });
        flashBytes();
      }

      if (codeRoot) {
        codeRoot.innerHTML = "";
        var lines = [
          "char      = '" + ch.replace(/'/g, "\\'") + "'",
          "codePoint = U+" + uPlus + "  (" + cp + ")",
          "utf8.len  = " + bytes.length + " byte" + (bytes.length === 1 ? "" : "s"),
          "utf8.hex  = " + bytes.map(hexByte).join(" ")
        ];
        lines.forEach(function (src, i) {
          var line = document.createElement("div");
          line.className = "code-line is-active";
          line.innerHTML =
            '<span class="code-ln">' +
            (i + 1) +
            '</span><span class="code-src">' +
            src.replace(/(\d+|U\+[0-9A-F]+)/g, '<span class="code-num">$1</span>') +
            "</span>";
          codeRoot.appendChild(line);
        });
      }

      if (codeLang) {
        codeLang.textContent =
          cp <= 0x7f ? "ASCII" : bytes.length === 1 ? "Unicode" : "UTF-8 ×" + bytes.length;
      }

      setStatus(
        "'" +
          ch +
          "' → U+" +
          uPlus +
          " → UTF-8: " +
          bytes.map(hexByte).join(" ")
      );
      setCodeNote(
        cp <= 0x7f
          ? "Fits in one byte — classic ASCII."
          : bytes.length === 2
            ? "Two-byte UTF-8 sequence."
            : bytes.length === 3
              ? "Three-byte UTF-8 (common for CJK)."
              : "Four-byte UTF-8 (emoji / supplementary plane)."
      );
    }

    function apply(raw) {
      var ch = firstGrapheme(raw);
      if (document.activeElement !== input) input.value = ch;
      else if (input.value !== ch && raw.length > ch.length) {
        /* keep caret friendly: trim to first grapheme after paint */
      }
      paint(ch);
      if (ch && input.value !== ch) {
        var pos = input.selectionStart;
        input.value = ch;
        try {
          input.setSelectionRange(pos, pos);
        } catch (err) {}
      }
    }

    input.addEventListener("input", function () {
      try {
        apply(input.value);
      } catch (err) {
        console.error("[learn-enc] Input failed", err);
      }
    });

    document.querySelectorAll("[data-enc-char]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var ch = btn.getAttribute("data-enc-char") || "";
          input.value = ch;
          apply(ch);
          input.focus();
        } catch (err) {
          console.error("[learn-enc] Preset failed", err);
        }
      });
    });

    document.querySelectorAll("[data-enc-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          if (btn.getAttribute("data-enc-action") === "clear") {
            input.value = "";
            apply("");
            input.focus();
          }
        } catch (err) {
          console.error("[learn-enc] Action failed", err);
        }
      });
    });

    apply(input.value || "A");
  }

  try {
    initEnc();
  } catch (err) {
    console.error("[learn-enc] Init failed", err);
  }
})();
