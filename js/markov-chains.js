/**
 * 3-state weather Markov chain.
 */
(function () {
  var NAMES = ["Sun", "Cloud", "Rain"];
  // rows sum to 1
  var P = [
    [0.6, 0.3, 0.1],
    [0.3, 0.4, 0.3],
    [0.2, 0.3, 0.5]
  ];

  function init() {
    var graph = document.getElementById("mc-graph");
    var bars = document.getElementById("mc-bars");
    var status = document.getElementById("mc-status");
    var badge = document.getElementById("mc-badge");
    var meta = document.getElementById("mc-meta");
    var code = document.getElementById("mc-code");
    var stepBtn = document.getElementById("mc-step");
    var runBtn = document.getElementById("mc-run");
    var resetBtn = document.getElementById("mc-reset");
    if (!graph) return;

    var mu = [1, 0, 0];
    var t = 0;

    function mul(v) {
      var out = [0, 0, 0];
      for (var j = 0; j < 3; j++) {
        for (var i = 0; i < 3; i++) out[j] += v[i] * P[i][j];
      }
      return out;
    }

    function render() {
      graph.innerHTML = "";
      NAMES.forEach(function (name, i) {
        var d = document.createElement("div");
        d.className = "mc-node";
        d.style.setProperty("--p", String(mu[i]));
        d.innerHTML = "<strong>" + name + "</strong><span>" + (mu[i] * 100).toFixed(1) + "%</span>";
        graph.appendChild(d);
      });
      if (bars) {
        bars.innerHTML = "";
        mu.forEach(function (p, i) {
          var b = document.createElement("div");
          b.className = "mc-bar";
          b.style.height = Math.max(4, p * 100) + "%";
          b.title = NAMES[i];
          bars.appendChild(b);
        });
      }
      var mode = 0;
      for (var i = 1; i < 3; i++) if (mu[i] > mu[mode]) mode = i;
      if (badge) badge.textContent = NAMES[mode];
      if (meta) meta.textContent = String(t);
      if (code) {
        code.textContent =
          "μ_{" + t + "} = [" + mu.map(function (x) { return x.toFixed(3); }).join(", ") + "]\n" +
          "μ ← μ P";
      }
      if (status) {
        status.textContent = "Mass flows each step; converges toward stationary π.";
      }
    }

    function step() {
      mu = mul(mu);
      t += 1;
      render();
    }

    if (stepBtn) stepBtn.addEventListener("click", step);
    if (runBtn) {
      runBtn.addEventListener("click", function () {
        for (var i = 0; i < 10; i++) step();
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        mu = [1, 0, 0];
        t = 0;
        render();
      });
    }
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
