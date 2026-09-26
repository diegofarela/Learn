/**
 * Proof technique walkthroughs.
 */
(function () {
  var MODES = {
    direct: {
      label: "direct",
      claim: "If n is even, then n² is even.",
      steps: [
        "Claim: n even ⇒ n² even.",
        "Assume n is even: n = 2k for some integer k.",
        "Then n² = (2k)² = 4k² = 2(2k²).",
        "So n² = 2·(integer) ⇒ n² even. □"
      ],
      template: "Assume hyp.\nUnfold definitions.\nAlgebra → conclusion."
    },
    contradiction: {
      label: "contradiction",
      claim: "√2 is irrational.",
      steps: [
        "Claim: √2 is irrational.",
        "Assume not: √2 = a/b in lowest terms.",
        "Then a² = 2b² ⇒ a even ⇒ a=2c ⇒ 4c²=2b² ⇒ b even.",
        "a and b both even contradicts lowest terms. □"
      ],
      template: "Assume ¬claim.\nDerive absurdity.\nTherefore claim."
    },
    contrapositive: {
      label: "contrapositive",
      claim: "If n² is even, then n is even.",
      steps: [
        "Want P⇒Q with P: n² even, Q: n even.",
        "Prove contrapositive ¬Q⇒¬P: n odd ⇒ n² odd.",
        "n=2k+1 ⇒ n²=4k(k+1)+1 odd.",
        "So ¬Q⇒¬P, hence P⇒Q. □"
      ],
      template: "To prove P⇒Q,\nprove ¬Q⇒¬P.\nSame truth table."
    },
    diagonal: {
      label: "diagonal",
      claim: "No list of all infinite binary sequences.",
      steps: [
        "Suppose we list sequences s₁, s₂, s₃, …",
        "Build d where d[i] = flip of sᵢ[i].",
        "Then d differs from every sᵢ at position i.",
        "So d is missing from the list — contradiction. □"
      ],
      template: "Enumerate candidates.\nFlip the diagonal.\nNew object ∉ list."
    }
  };

  function init() {
    var stepsEl = document.getElementById("pt-steps");
    var status = document.getElementById("pt-status");
    var badge = document.getElementById("pt-badge");
    var meta = document.getElementById("pt-meta");
    var code = document.getElementById("pt-code");
    var note = document.getElementById("pt-code-note");
    var stepBtn = document.getElementById("pt-step");
    var resetBtn = document.getElementById("pt-reset");
    if (!stepsEl) return;

    var mode = "direct";
    var idx = 0;

    function render() {
      var m = MODES[mode];
      stepsEl.innerHTML = "";
      m.steps.forEach(function (text, i) {
        var li = document.createElement("li");
        li.className = "pt-step" + (i < idx ? " is-done" : "") + (i === idx ? " is-active" : "");
        li.textContent = text;
        stepsEl.appendChild(li);
      });
      if (badge) badge.textContent = m.label;
      if (meta) meta.textContent = m.label;
      if (code) code.textContent = m.claim + "\n\n" + m.template;
      if (note) note.textContent = "Step " + Math.min(idx + 1, m.steps.length) + " / " + m.steps.length;
      if (status) {
        status.textContent =
          idx >= m.steps.length
            ? "Done — try another technique."
            : "Highlighting: " + m.steps[idx];
      }
    }

    document.querySelectorAll("[data-pt]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-pt]").forEach(function (b) {
          b.classList.toggle("is-selected", b === btn);
        });
        mode = btn.getAttribute("data-pt");
        idx = 0;
        render();
      });
    });

    if (stepBtn) {
      stepBtn.addEventListener("click", function () {
        var m = MODES[mode];
        if (idx < m.steps.length) idx += 1;
        render();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        idx = 0;
        render();
      });
    }
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
