/**
 * Two operands + bitwise op; live bit rows for A, B, and result.
 */
(function () {
  function initBm() {
    var aInput = document.getElementById("bm-a");
    var bInput = document.getElementById("bm-b");
    var bWrap = document.getElementById("bm-b-wrap");
    var opSelect = document.getElementById("bm-op");
    var rowsEl = document.getElementById("bm-rows");
    var status = document.getElementById("bm-status");
    var meta = document.getElementById("bm-meta");
    var codeRoot = document.getElementById("bm-code");
    var codeNote = document.getElementById("bm-code-note");
    var codeLang = document.getElementById("bm-code-lang");
    if (!aInput || !rowsEl || !opSelect) return;

    var WIDTH = 8;
    var A = 42;
    var B = 15;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function clamp(n) {
      var x = Number(n);
      if (!isFinite(x)) return 0;
      return Math.max(0, Math.min(255, Math.floor(x)));
    }

    function padBin(n) {
      var s = (n & 255).toString(2);
      while (s.length < WIDTH) s = "0" + s;
      return s;
    }

    function hexOf(n) {
      var h = (n & 255).toString(16).toUpperCase();
      return h.length < 2 ? "0" + h : h;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function compute(op) {
      switch (op) {
        case "AND":
          return A & B;
        case "OR":
          return A | B;
        case "XOR":
          return A ^ B;
        case "NOT":
          return (~A) & 255;
        case "SHL":
          return (A << 1) & 255;
        case "SHR":
          return A >>> 1;
        default:
          return A;
      }
    }

    function opSymbol(op) {
      return (
        {
          AND: "&",
          OR: "|",
          XOR: "^",
          NOT: "~",
          SHL: "<<",
          SHR: ">>"
        }[op] || op
      );
    }

    function needsB(op) {
      return op === "AND" || op === "OR" || op === "XOR";
    }

    function makeRow(label, value, kind) {
      var row = document.createElement("div");
      row.className = "bm-row bm-row--" + kind;
      var lab = document.createElement("span");
      lab.className = "bm-row-label";
      lab.textContent = label;
      row.appendChild(lab);
      var bits = document.createElement("div");
      bits.className = "bm-row-bits";
      var bin = padBin(value);
      for (var i = 0; i < WIDTH; i++) {
        var bit = document.createElement("span");
        bit.className = "bm-bit" + (bin[i] === "1" ? " is-on" : "");
        bit.textContent = bin[i];
        bits.appendChild(bit);
      }
      row.appendChild(bits);
      var hex = document.createElement("span");
      hex.className = "bm-row-hex";
      hex.textContent = "0x" + hexOf(value);
      row.appendChild(hex);
      return row;
    }

    function paint() {
      var op = opSelect.value || "AND";
      var result = compute(op);
      if (bWrap) bWrap.hidden = !needsB(op);
      if (aInput && document.activeElement !== aInput) aInput.value = String(A);
      if (bInput && document.activeElement !== bInput) bInput.value = String(B);

      rowsEl.innerHTML = "";
      rowsEl.appendChild(makeRow("A", A, "a"));
      if (needsB(op)) rowsEl.appendChild(makeRow("B", B, "b"));
      rowsEl.appendChild(makeRow("=", result, "res"));

      if (!reduceMotion) {
        rowsEl.classList.remove("is-flash");
        void rowsEl.offsetWidth;
        rowsEl.classList.add("is-flash");
      }

      if (meta) meta.textContent = "0x" + hexOf(result);
      if (codeLang) codeLang.textContent = op;

      if (codeRoot) {
        codeRoot.innerHTML = "";
        var expr =
          op === "NOT"
            ? "~" + A + " & 0xFF"
            : op === "SHL"
              ? "(" + A + " << 1) & 0xFF"
              : op === "SHR"
                ? A + " >>> 1"
                : A + " " + opSymbol(op) + " " + B;
        var lines = [
          "op     = " + op,
          "A      = " + padBin(A) + "  (" + A + ")",
          needsB(op) ? "B      = " + padBin(B) + "  (" + B + ")" : null,
          "result = " + padBin(result) + "  (" + result + ", 0x" + hexOf(result) + ")",
          "expr   = " + expr
        ].filter(Boolean);
        lines.forEach(function (src, i) {
          var line = document.createElement("div");
          line.className = "code-line is-active";
          line.innerHTML =
            '<span class="code-ln">' +
            (i + 1) +
            '</span><span class="code-src">' +
            src.replace(/(\d+|0x[0-9A-F]+)/g, '<span class="code-num">$1</span>') +
            "</span>";
          codeRoot.appendChild(line);
        });
      }

      var msg;
      if (op === "NOT") msg = "~" + A + " = " + result + " (0x" + hexOf(result) + ")";
      else if (op === "SHL") msg = A + " << 1 = " + result + " (0x" + hexOf(result) + ")";
      else if (op === "SHR") msg = A + " >> 1 = " + result + " (0x" + hexOf(result) + ")";
      else
        msg =
          A +
          " " +
          opSymbol(op) +
          " " +
          B +
          " = " +
          result +
          " (0x" +
          hexOf(result) +
          ")";
      setStatus(msg);
      setCodeNote(
        "Each column is one bit; <strong>" +
          op +
          "</strong> runs independently per position."
      );
    }

    function readInputs() {
      A = clamp(aInput.value);
      B = clamp(bInput ? bInput.value : B);
    }

    [aInput, bInput].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", function () {
        try {
          readInputs();
          paint();
        } catch (err) {
          console.error("[learn-bm] Input failed", err);
        }
      });
    });

    opSelect.addEventListener("change", function () {
      try {
        paint();
      } catch (err) {
        console.error("[learn-bm] Op change failed", err);
      }
    });

    document.querySelectorAll("[data-bm-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-bm-action");
          if (action === "reset") {
            A = 42;
            B = 15;
            opSelect.value = "AND";
          } else if (action === "random") {
            A = Math.floor(Math.random() * 256);
            B = Math.floor(Math.random() * 256);
          } else if (action === "apply") {
            readInputs();
          }
          paint();
        } catch (err) {
          console.error("[learn-bm] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    initBm();
  } catch (err) {
    console.error("[learn-bm] Init failed", err);
  }
})();
