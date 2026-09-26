/**
 * Interactive Boolean gate: AND/OR/NOT/XOR with toggles + truth table.
 */
(function () {
  var GATES = {
    AND: {
      arity: 2,
      fn: function (a, b) {
        return a & b;
      },
      rows: [
        [0, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
        [1, 1, 1]
      ]
    },
    OR: {
      arity: 2,
      fn: function (a, b) {
        return a | b;
      },
      rows: [
        [0, 0, 0],
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 1]
      ]
    },
    NOT: {
      arity: 1,
      fn: function (a) {
        return a ? 0 : 1;
      },
      rows: [
        [0, 1],
        [1, 0]
      ]
    },
    XOR: {
      arity: 2,
      fn: function (a, b) {
        return a ^ b;
      },
      rows: [
        [0, 0, 0],
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 0]
      ]
    }
  };

  function initBool() {
    var diagram = document.getElementById("bool-diagram");
    var status = document.getElementById("bool-status");
    var outMeta = document.getElementById("bool-out");
    var gateSelect = document.getElementById("bool-gate");
    var tbody = document.getElementById("bool-tbody");
    var codeNote = document.getElementById("bool-code-note");
    var codeLang = document.getElementById("bool-code-lang");
    var gateLabel = document.getElementById("bool-gate-label");
    var aVal = document.getElementById("bool-a-val");
    var bVal = document.getElementById("bool-b-val");
    var yVal = document.getElementById("bool-y-val");
    var pinA = document.getElementById("bool-pin-a");
    var pinB = document.getElementById("bool-pin-b");
    var outPin = document.getElementById("bool-out-pin");
    var toggleB = document.getElementById("bool-toggle-b");
    var thB = document.getElementById("bool-th-b");
    var wireA = document.getElementById("bool-wire-a");
    var wireB = document.getElementById("bool-wire-b");
    var wireY = document.getElementById("bool-wire-y");
    if (!diagram || !tbody) return;

    var gate = "AND";
    var A = 1;
    var B = 0;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function output() {
      var g = GATES[gate];
      if (!g) return 0;
      return g.arity === 1 ? g.fn(A) : g.fn(A, B);
    }

    function paintWires(y) {
      if (wireA) {
        wireA.classList.toggle("is-hot", A === 1);
        wireA.setAttribute("d", gate === "NOT" ? "M70 80 H130" : "M70 40 H130");
      }
      if (wireB) {
        wireB.classList.toggle("is-hot", gate !== "NOT" && B === 1);
      }
      if (wireY) wireY.classList.toggle("is-hot", y === 1);
    }

    function renderTable() {
      var g = GATES[gate];
      tbody.innerHTML = "";
      if (!g) return;

      var unary = g.arity === 1;
      if (thB) thB.hidden = unary;

      g.rows.forEach(function (row) {
        var tr = document.createElement("tr");
        var match = unary ? row[0] === A : row[0] === A && row[1] === B;
        if (match) tr.className = "is-active";

        if (unary) {
          tr.innerHTML =
            "<td>" + row[0] + '</td><td class="bool-y">' + row[1] + "</td>";
        } else {
          tr.innerHTML =
            "<td>" +
            row[0] +
            "</td><td>" +
            row[1] +
            '</td><td class="bool-y">' +
            row[2] +
            "</td>";
        }
        tbody.appendChild(tr);
      });
    }

    function paint() {
      var y = output();
      var unary = gate === "NOT";

      if (aVal) aVal.textContent = String(A);
      if (bVal) bVal.textContent = String(B);
      if (yVal) yVal.textContent = String(y);
      if (outMeta) outMeta.textContent = String(y);
      if (gateLabel) gateLabel.textContent = gate;
      if (codeLang) codeLang.textContent = gate;

      if (pinA) {
        pinA.classList.toggle("is-on", A === 1);
        pinA.setAttribute("aria-pressed", A === 1 ? "true" : "false");
      }
      if (pinB) {
        pinB.hidden = unary;
        pinB.classList.toggle("is-on", B === 1);
        pinB.setAttribute("aria-pressed", B === 1 ? "true" : "false");
      }
      if (toggleB) toggleB.hidden = unary;
      if (outPin) {
        outPin.classList.toggle("is-on", y === 1);
        if (!reduceMotion) {
          outPin.classList.remove("is-pulse");
          void outPin.offsetWidth;
          outPin.classList.add("is-pulse");
        }
      }

      diagram.classList.toggle("is-unary", unary);
      paintWires(y);
      renderTable();

      if (unary) {
        setStatus("NOT(" + A + ") → " + y + ".");
        setCodeNote("NOT flips <strong>A</strong>. Output is <strong>" + y + "</strong>.");
      } else {
        setStatus(gate + "(" + A + ", " + B + ") → " + y + ".");
        setCodeNote(
          "Current inputs <strong>A=" +
            A +
            "</strong>, <strong>B=" +
            B +
            "</strong> → <strong>Y=" +
            y +
            "</strong>."
        );
      }
    }

    function toggle(name) {
      if (name === "A") A = A ? 0 : 1;
      else if (name === "B" && gate !== "NOT") B = B ? 0 : 1;
      paint();
    }

    document.querySelectorAll("[data-bool-input]").forEach(function (el) {
      el.addEventListener("click", function () {
        try {
          toggle(el.getAttribute("data-bool-input"));
        } catch (err) {
          console.error("[learn-bool] Toggle failed", err);
        }
      });
    });

    document.querySelectorAll("[data-bool-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          if (btn.getAttribute("data-bool-action") === "reset") {
            A = 1;
            B = 0;
            gate = "AND";
            if (gateSelect) gateSelect.value = "AND";
            paint();
          }
        } catch (err) {
          console.error("[learn-bool] Reset failed", err);
        }
      });
    });

    if (gateSelect) {
      gateSelect.addEventListener("change", function () {
        try {
          var next = gateSelect.value;
          if (GATES[next]) {
            gate = next;
            paint();
          }
        } catch (err) {
          console.error("[learn-bool] Gate change failed", err);
        }
      });
    }

    paint();
  }

  try {
    initBool();
  } catch (err) {
    console.error("[learn-bool] Init failed", err);
  }
})();
