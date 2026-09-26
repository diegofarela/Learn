/**
 * Master theorem example picker.
 */
(function () {
  var EX = {
    mergesort: {
      label: "case 2",
      a: 2,
      b: 2,
      f: "Θ(n)",
      crit: "n^{log₂ 2} = n",
      bound: "T(n) = Θ(n log n)",
      why: "f(n) = Θ(n) matches n^{log_b a} → case 2.",
      levels: ["n", "n/2 + n/2", "n/4 ×4", "…", "1×n"]
    },
    binary: {
      label: "case 2",
      a: 1,
      b: 2,
      f: "Θ(1)",
      crit: "n^{log₂ 1} = 1",
      bound: "T(n) = Θ(log n)",
      why: "One subproblem, constant work → Θ(log n).",
      levels: ["n", "n/2", "n/4", "…", "1"]
    },
    strassen: {
      label: "case 1",
      a: 7,
      b: 2,
      f: "Θ(n²)",
      crit: "n^{log₂ 7} ≈ n^{2.81}",
      bound: "T(n) = Θ(n^{log₂ 7})",
      why: "f is polynomially smaller than n^{log_b a} → leaves win.",
      levels: ["n²", "7·(n/2)²", "7²·(n/4)²", "…"]
    },
    brute: {
      label: "case 3",
      a: 2,
      b: 2,
      f: "Θ(n²)",
      crit: "n^{log₂ 2} = n",
      bound: "T(n) = Θ(n²)",
      why: "Root work dominates (f larger + regularity) → case 3.",
      levels: ["n²", "2·(n/2)²", "4·(n/4)²", "…"]
    }
  };

  function init() {
    var tree = document.getElementById("rec-tree");
    var status = document.getElementById("rec-status");
    var badge = document.getElementById("rec-badge");
    var meta = document.getElementById("rec-meta");
    var code = document.getElementById("rec-code");
    if (!tree) return;

    function show(id) {
      var e = EX[id];
      tree.innerHTML = "";
      e.levels.forEach(function (L, i) {
        var row = document.createElement("div");
        row.className = "rec-level";
        row.style.setProperty("--i", String(i));
        row.textContent = L;
        tree.appendChild(row);
      });
      if (badge) badge.textContent = e.label;
      if (meta) meta.textContent = e.label.replace("case ", "");
      if (code) {
        code.textContent =
          "T(n) = " + e.a + " T(n/" + e.b + ") + " + e.f + "\n" +
          "n^{log_b a} = " + e.crit + "\n" +
          e.bound;
      }
      if (status) status.textContent = e.why;
    }

    document.querySelectorAll("[data-rec]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-rec]").forEach(function (b) {
          b.classList.toggle("is-selected", b === btn);
        });
        show(btn.getAttribute("data-rec"));
      });
    });
    show("mergesort");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
