/**
 * Endianness & alignment: int32 bytes LE/BE + struct padding holes.
 */
(function () {
  var VALUES = [0x12345678, 0xaabbccdd, 0x00000001, 0xdeadbeef];

  function init() {
    var bytesEl = document.getElementById("endia-bytes");
    var structEl = document.getElementById("endia-struct");
    var status = document.getElementById("endia-status");
    var phase = document.getElementById("endia-phase");
    var meta = document.getElementById("endia-meta");
    var valEl = document.getElementById("endia-val");
    var codeRoot = document.getElementById("endia-code");
    var codeNote = document.getElementById("endia-code-note");
    if (!bytesEl || !structEl) return;

    var endian = "le";
    var vi = 0;

    function hexByte(b) {
      var h = (b & 0xff).toString(16).toUpperCase();
      return h.length < 2 ? "0" + h : h;
    }

    function hexWord(u) {
      var h = (u >>> 0).toString(16).toUpperCase();
      while (h.length < 8) h = "0" + h;
      return "0x" + h;
    }

    function wordBytes(u, le) {
      var b0 = (u >>> 24) & 0xff;
      var b1 = (u >>> 16) & 0xff;
      var b2 = (u >>> 8) & 0xff;
      var b3 = u & 0xff;
      return le ? [b3, b2, b1, b0] : [b0, b1, b2, b3];
    }

    function paint() {
      var u = VALUES[vi];
      var bytes = wordBytes(u, endian === "le");
      if (valEl) valEl.textContent = hexWord(u);
      if (meta) meta.textContent = endian === "le" ? "LE" : "BE";
      if (phase) {
        phase.textContent =
          endian === "le" ? "LITTLE-ENDIAN" : "BIG-ENDIAN";
      }

      bytesEl.innerHTML = "";
      bytes.forEach(function (b, i) {
        var cell = document.createElement("div");
        cell.className = "endia-byte";
        cell.innerHTML =
          '<span class="endia-byte-a">+' +
          i +
          '</span><span class="endia-byte-v">' +
          hexByte(b) +
          "</span>";
        bytesEl.appendChild(cell);
      });

      /* struct { char a; int b; char c; } → a, pad×3, b×4, c, pad×3 = 12 */
      var layout = [
        { t: "a", cls: "is-field" },
        { t: "pad", cls: "is-pad" },
        { t: "pad", cls: "is-pad" },
        { t: "pad", cls: "is-pad" },
        { t: "b0", cls: "is-field is-int" },
        { t: "b1", cls: "is-field is-int" },
        { t: "b2", cls: "is-field is-int" },
        { t: "b3", cls: "is-field is-int" },
        { t: "c", cls: "is-field" },
        { t: "pad", cls: "is-pad" },
        { t: "pad", cls: "is-pad" },
        { t: "pad", cls: "is-pad" }
      ];
      structEl.innerHTML = "";
      layout.forEach(function (slot, i) {
        var cell = document.createElement("div");
        cell.className = "endia-slot " + slot.cls;
        cell.innerHTML =
          '<span class="endia-slot-a">' +
          i +
          '</span><span class="endia-slot-t">' +
          slot.t +
          "</span>";
        structEl.appendChild(cell);
      });

      document.querySelectorAll("[data-endia-endian]").forEach(function (btn) {
        btn.classList.toggle(
          "is-selected",
          btn.getAttribute("data-endia-endian") === endian
        );
      });

      if (codeRoot) {
        var order =
          endian === "le"
            ? "LSB … MSB  →  " + bytes.map(hexByte).join(" ")
            : "MSB … LSB  →  " + bytes.map(hexByte).join(" ");
        var lines = [
          "uint32_t x = " + hexWord(u) + ";",
          "memory[@0..3] = " + order,
          "struct size ≈ 12 (3 + 3 pad bytes)",
          "offset(b) = 4  /* aligned */"
        ];
        codeRoot.innerHTML = "";
        lines.forEach(function (src, i) {
          var el = document.createElement("div");
          el.className = "code-line" + (i === 1 ? " is-active" : "");
          el.innerHTML =
            '<span class="code-ln">' +
            (i + 1) +
            '</span><span class="code-src">' +
            src +
            "</span>";
          codeRoot.appendChild(el);
        });
      }

      if (status) {
        status.textContent =
          endian === "le"
            ? "Little-endian: least-significant byte at the lowest address."
            : "Big-endian: most-significant byte at the lowest address (network order).";
      }
      if (codeNote) {
        codeNote.innerHTML =
          "Padding keeps <code>int b</code> 4-byte aligned after <code>char a</code>.";
      }
    }

    document.querySelectorAll("[data-endia-endian]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          endian = btn.getAttribute("data-endia-endian") || "le";
          paint();
        } catch (err) {
          console.error("[learn-endia] Endian failed", err);
        }
      });
    });

    document.querySelectorAll("[data-endia-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var a = btn.getAttribute("data-endia-action");
          if (a === "next") {
            vi = (vi + 1) % VALUES.length;
            paint();
          } else if (a === "reset") {
            endian = "le";
            vi = 0;
            paint();
          }
        } catch (err) {
          console.error("[learn-endia] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-endia] Init failed", err);
  }
})();
