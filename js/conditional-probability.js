/**
 * Bayes disease-test population demo.
 */
(function () {
  function init() {
    var prev = document.getElementById("bayes-prev");
    var fpr = document.getElementById("bayes-fpr");
    var prevVal = document.getElementById("bayes-prev-val");
    var fprVal = document.getElementById("bayes-fpr-val");
    var pop = document.getElementById("bayes-pop");
    var status = document.getElementById("bayes-status");
    var badge = document.getElementById("bayes-badge");
    var meta = document.getElementById("bayes-meta");
    var code = document.getElementById("bayes-code");
    if (!prev || !pop) return;

    var SENS = 0.99;
    var N = 1000;

    function render() {
      var pD = Number(prev.value) / 100;
      var fp = Number(fpr.value) / 100;
      if (prevVal) prevVal.textContent = Math.round(pD * 100) + "%";
      if (fprVal) fprVal.textContent = Math.round(fp * 100) + "%";

      var diseased = Math.round(N * pD);
      var healthy = N - diseased;
      var tp = Math.round(diseased * SENS);
      var fn = diseased - tp;
      var fpCount = Math.round(healthy * fp);
      var tn = healthy - fpCount;
      var pos = tp + fpCount;
      var posterior = pos ? tp / pos : 0;

      pop.innerHTML = "";
      function add(count, cls, title) {
        var maxShow = Math.min(count, 120);
        for (var i = 0; i < maxShow; i++) {
          var d = document.createElement("span");
          d.className = "bayes-dot " + cls;
          d.title = title;
          pop.appendChild(d);
        }
      }
      add(tp, "is-tp", "True positive");
      add(fpCount, "is-fp", "False positive");
      add(fn, "is-fn", "False negative");
      add(Math.min(tn, 40), "is-tn", "True negative (sample)");

      if (badge) badge.textContent = N + " people";
      if (meta) meta.textContent = (posterior * 100).toFixed(1) + "%";
      if (code) {
        code.textContent =
          "P(D)=" + pD.toFixed(2) + "  sens=" + SENS + "  FPR=" + fp.toFixed(2) + "\n" +
          "TP=" + tp + " FP=" + fpCount + "  positives=" + pos + "\n" +
          "P(D|+) = TP/(TP+FP) = " + posterior.toFixed(3);
      }
      if (status) {
        status.textContent =
          "Among positives, only " +
          (posterior * 100).toFixed(1) +
          "% truly have D — base rate bites.";
      }
    }

    prev.addEventListener("input", render);
    fpr.addEventListener("input", render);
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
