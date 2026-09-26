/**
 * Expectation: linearity via die face indicators.
 */
(function () {
  function initExp() {
    var facesEl = document.getElementById("exp-faces");
    var sumEl = document.getElementById("exp-sum");
    var status = document.getElementById("exp-status");
    var badge = document.getElementById("exp-badge");
    var meta = document.getElementById("exp-meta");
    var codeRoot = document.getElementById("exp-code");
    var codeNote = document.getElementById("exp-code-note");
    var rollBtn = document.getElementById("exp-roll");
    var resetBtn = document.getElementById("exp-reset");
    if (!facesEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var roll = null;
    var E = 3.5;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function refresh() {
      if (meta) meta.textContent = String(E);
      if (badge) badge.textContent = roll ? "X=" + roll : "E[X]=3.5";

      facesEl.innerHTML = "";
      for (var k = 1; k <= 6; k++) {
        var card = document.createElement("div");
        card.className = "exp-face";
        var on = roll === k;
        if (on) {
          card.classList.add("is-on");
          if (!reduceMotion) card.classList.add("is-pulse");
        }
        card.innerHTML =
          "<span class=\"exp-face-k\">I<sub>" +
          k +
          "</sub></span>" +
          "<span class=\"exp-face-val\">" +
          (on ? "1" : roll === null ? "E=1/6" : "0") +
          "</span>" +
          "<span class=\"exp-face-contrib\">" +
          k +
          "·I<sub>" +
          k +
          "</sub></span>";
        facesEl.appendChild(card);
      }

      if (sumEl) {
        if (roll === null) {
          sumEl.innerHTML =
            "E[X] = Σ<sub>k=1..6</sub> k · (1/6) = <strong>3.5</strong>";
        } else {
          sumEl.innerHTML =
            "X = " +
            roll +
            "·1 + others·0 = <strong>" +
            roll +
            "</strong>";
        }
      }

      if (codeRoot) {
        var lines = [
          "X = Σ_{k=1}^{6} k · I_k",
          "I_k = 1[face = k],  E[I_k]=1/6",
          "E[X] = Σ k·E[I_k] = 3.5",
          "I_k dependent, linearity OK"
        ];
        codeRoot.innerHTML = "";
        lines.forEach(function (text, i) {
          var row = document.createElement("div");
          row.className = "code-line" + (i === 2 ? " is-active" : "");
          var ln = document.createElement("span");
          ln.className = "code-ln";
          ln.textContent = String(i + 1);
          var src = document.createElement("span");
          src.className = "code-src";
          src.textContent = text;
          row.appendChild(ln);
          row.appendChild(src);
          codeRoot.appendChild(row);
        });
      }

      if (codeNote) {
        codeNote.innerHTML = roll
          ? "<strong>Sample</strong> — only I<sub>" +
            roll +
            "</sub> is 1; X equals that face."
          : "<strong>Linearity</strong> — take E inside the sum even though indicators are dependent.";
      }

      setStatus(
        roll
          ? "Rolled " +
              roll +
              ". One indicator is 1; E[X] is still 3.5 over many rolls."
          : "X = 1·I₁ + … + 6·I₆. E[X] = Σ k·(1/6) = 3.5 by linearity."
      );
    }

    if (rollBtn) {
      rollBtn.addEventListener("click", function () {
        try {
          roll = 1 + Math.floor(Math.random() * 6);
          refresh();
        } catch (err) {
          console.error("[learn-exp] Roll failed", err);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        try {
          roll = null;
          refresh();
        } catch (err) {
          console.error("[learn-exp] Reset failed", err);
        }
      });
    }

    refresh();
  }

  try {
    initExp();
  } catch (err) {
    console.error("[learn-exp] Init failed", err);
  }
})();
