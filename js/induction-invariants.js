/**
 * Induction walkthrough: base → hypothesis → step for sum 1..n.
 */
(function () {
  var CODE = [
    { html: '<span class="code-cm">/* P(n): 1+…+n = n(n+1)/2 */</span>' },
    { html: '<span class="code-kw">Base</span>: P(1)  ⇒  1 = 1·2/2', id: "base" },
    { html: '<span class="code-kw">Assume</span> P(k)  (IH)', id: "ih" },
    { html: '1+…+k = k(k+1)/2', id: "ih-body" },
    { html: '<span class="code-kw">Step</span>: add (k+1)', id: "step" },
    { html: '1+…+(k+1) = (k+1)(k+2)/2', id: "step-body" },
    { html: '∴ P(n) for all n ≥ 1', id: "qed" }
  ];

  function sumTo(n) {
    return (n * (n + 1)) / 2;
  }

  function initInduction() {
    var slider = document.getElementById("ind-n");
    var nLabel = document.getElementById("ind-n-label");
    var stepsEl = document.getElementById("ind-steps");
    var eqEl = document.getElementById("ind-eq");
    var status = document.getElementById("ind-status");
    var badge = document.getElementById("ind-badge");
    var nextBtn = document.getElementById("ind-next");
    var resetBtn = document.getElementById("ind-reset");
    var invCheck = document.getElementById("ind-inv-check");
    var codeRoot = document.getElementById("ind-code");
    var codeNote = document.getElementById("ind-code-note");
    if (!slider || !stepsEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var phase = 0; // 0 base, 1 ih, 2 step, 3 done
    var n = Number(slider.value) || 5;
    var lineEls = {};

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function renderCode(activeIds) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE.forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        var ln = document.createElement("span");
        ln.className = "code-ln";
        ln.textContent = String(i + 1);
        var src = document.createElement("span");
        src.className = "code-src";
        src.innerHTML = line.html || "";
        row.appendChild(ln);
        row.appendChild(src);
        codeRoot.appendChild(row);
      });
      (activeIds || []).forEach(function (id) {
        if (lineEls[id]) lineEls[id].classList.add("is-active");
      });
    }

    function buildSteps() {
      stepsEl.innerHTML = "";
      var labels = ["Base P(1)", "Assume P(k)", "Prove P(k+1)", "Done"];
      labels.forEach(function (label, i) {
        var el = document.createElement("div");
        el.className = "ind-step";
        el.setAttribute("role", "listitem");
        if (i < phase) el.classList.add("is-done");
        if (i === phase) el.classList.add("is-active");
        if (!reduceMotion && i === phase) el.classList.add("is-pulse");
        el.textContent = label;
        stepsEl.appendChild(el);
      });
    }

    function refresh() {
      n = Number(slider.value) || 5;
      if (nLabel) nLabel.textContent = String(n);
      slider.setAttribute("aria-valuenow", String(n));
      buildSteps();

      var badges = ["base", "hypothesis", "step", "qed"];
      if (badge) badge.textContent = badges[phase] || "base";

      var left = [];
      for (var i = 1; i <= Math.min(n, phase >= 2 ? n : phase === 0 ? 1 : Math.min(n, 3)); i++) {
        left.push(String(i));
      }
      if (phase === 0) {
        if (eqEl) {
          eqEl.innerHTML =
            "<strong>P(1)</strong>: 1 = " + sumTo(1) + " ✓";
        }
        renderCode(["base"]);
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Base</strong> — verify the formula at the smallest n.";
        }
        setStatus("Base case: 1 = 1·2/2. Check the invariant box when you believe it.");
      } else if (phase === 1) {
        var k = Math.max(1, n - 1);
        if (eqEl) {
          eqEl.innerHTML =
            "<strong>IH</strong>: 1+…+" +
            k +
            " = " +
            sumTo(k) +
            "  (assume)";
        }
        renderCode(["ih", "ih-body"]);
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Induction hypothesis</strong> — assume P(k) for some k ≥ 1.";
        }
        setStatus("Assume P(k) for k = " + k + ". The invariant claims the partial sum matches.");
      } else if (phase === 2) {
        var kk = Math.max(1, n - 1);
        if (eqEl) {
          eqEl.innerHTML =
            sumTo(kk) +
            " + (" +
            (kk + 1) +
            ") = " +
            sumTo(kk + 1) +
            "  ⇒ P(" +
            (kk + 1) +
            ")";
        }
        renderCode(["step", "step-body"]);
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Inductive step</strong> — add (k+1) and simplify to P(k+1).";
        }
        setStatus(
          "From P(" +
            kk +
            ") add " +
            (kk + 1) +
            " → P(" +
            (kk + 1) +
            "). Chain reaches n = " +
            n +
            "."
        );
      } else {
        if (eqEl) {
          eqEl.innerHTML =
            "<strong>∴</strong> 1+…+" + n + " = " + sumTo(n);
        }
        renderCode(["qed"]);
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Q.E.D.</strong> — base + step ⇒ P(n) for all n ≥ 1.";
        }
        setStatus(
          "Done: formula holds for every n up through " +
            n +
            ". Invariant stayed true each step."
        );
      }

      if (invCheck && !invCheck.checked && phase > 0) {
        setStatus(
          (status.textContent || "") +
            " Tip: check the invariant when the partial sum matches k(k+1)/2."
        );
      }
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        try {
          if (phase < 3) phase += 1;
          else phase = 0;
          refresh();
        } catch (err) {
          console.error("[learn-induction] Next step failed", err);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        try {
          phase = 0;
          if (invCheck) invCheck.checked = false;
          refresh();
        } catch (err) {
          console.error("[learn-induction] Reset failed", err);
        }
      });
    }

    slider.addEventListener("input", function () {
      try {
        refresh();
      } catch (err) {
        console.error("[learn-induction] Slider update failed", err);
      }
    });

    if (invCheck) {
      invCheck.addEventListener("change", function () {
        try {
          if (invCheck.checked) {
            setStatus(
              "Invariant confirmed: after k terms, sum = k(k+1)/2. Continue the proof."
            );
          } else {
            refresh();
          }
        } catch (err) {
          console.error("[learn-induction] Invariant toggle failed", err);
        }
      });
    }

    refresh();
  }

  try {
    initInduction();
  } catch (err) {
    console.error("[learn-induction] Init failed", err);
  }
})();
