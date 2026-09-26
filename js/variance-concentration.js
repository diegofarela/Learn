/**
 * Sample-mean concentration + Chebyshev readout.
 */
(function () {
  function init() {
    var nEl = document.getElementById("var-n");
    var nVal = document.getElementById("var-n-val");
    var bars = document.getElementById("var-bars");
    var status = document.getElementById("var-status");
    var badge = document.getElementById("var-badge");
    var meta = document.getElementById("var-meta");
    var code = document.getElementById("var-code");
    var sampleBtn = document.getElementById("var-sample");
    var resetBtn = document.getElementById("var-reset");
    if (!nEl || !bars) return;

    var history = [];

    function meanOf(n) {
      var s = 0;
      for (var i = 0; i < n; i++) s += Math.random() < 0.5 ? 1 : 0;
      return s / n;
    }

    function render() {
      var n = Number(nEl.value);
      if (nVal) nVal.textContent = String(n);
      if (badge) badge.textContent = "n=" + n;
      var sigma = Math.sqrt(0.25 / n);
      if (meta) meta.textContent = sigma.toFixed(3);

      bars.innerHTML = "";
      history.slice(-12).forEach(function (m) {
        var row = document.createElement("div");
        row.className = "var-bar-row";
        var fill = document.createElement("div");
        fill.className = "var-bar-fill";
        fill.style.width = m * 100 + "%";
        var lab = document.createElement("span");
        lab.textContent = m.toFixed(3);
        row.appendChild(fill);
        row.appendChild(lab);
        bars.appendChild(row);
      });

      var t = 0.1;
      var cheb = Math.min(1, (0.25 / n) / (t * t));
      if (code) {
        code.textContent =
          "Var(X̄)=0.25/n = " + (0.25 / n).toFixed(4) + "\n" +
          "σ = " + sigma.toFixed(4) + "\n" +
          "Chebyshev P(|X̄−0.5|≥0.1) ≤ " + cheb.toFixed(3);
      }
      if (status) {
        status.textContent = history.length
          ? "Latest mean " + history[history.length - 1].toFixed(3) + " (true 0.5)."
          : "Sample batches of n fair coin flips.";
      }
    }

    if (sampleBtn) {
      sampleBtn.addEventListener("click", function () {
        history.push(meanOf(Number(nEl.value)));
        render();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        history = [];
        render();
      });
    }
    nEl.addEventListener("input", render);
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
