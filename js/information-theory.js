/**
 * Binary entropy curve.
 */
(function () {
  var NS = "http://www.w3.org/2000/svg";

  function H(p) {
    if (p <= 0 || p >= 1) return 0;
    return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
  }

  function init() {
    var pEl = document.getElementById("ent-p");
    var pVal = document.getElementById("ent-p-val");
    var chart = document.getElementById("ent-chart");
    var status = document.getElementById("ent-status");
    var badge = document.getElementById("ent-badge");
    var meta = document.getElementById("ent-meta");
    var code = document.getElementById("ent-code");
    if (!pEl || !chart) return;

    function svgEl(name, attrs) {
      var el = document.createElementNS(NS, name);
      Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
      return el;
    }

    function render() {
      var p = Number(pEl.value) / 100;
      if (pVal) pVal.textContent = p.toFixed(2);
      var h = H(p);
      if (badge) badge.textContent = "p=" + p.toFixed(2);
      if (meta) meta.textContent = h.toFixed(3);

      chart.innerHTML = "";
      var W = 420, Ht = 160;
      var pad = { l: 36, r: 12, t: 12, b: 28 };
      var pts = [];
      for (var i = 0; i <= 100; i++) {
        var pp = i / 100;
        var x = pad.l + pp * (W - pad.l - pad.r);
        var y = pad.t + (1 - H(pp)) * (Ht - pad.t - pad.b);
        pts.push(x + "," + y);
      }
      chart.appendChild(svgEl("polyline", { points: pts.join(" "), class: "ent-curve", fill: "none" }));
      var mx = pad.l + p * (W - pad.l - pad.r);
      var my = pad.t + (1 - h) * (Ht - pad.t - pad.b);
      chart.appendChild(svgEl("circle", { cx: String(mx), cy: String(my), r: "5", class: "ent-dot" }));

      if (code) {
        code.textContent =
          "H(p) = −p log₂ p − (1−p) log₂(1−p)\n" +
          "H(" + p.toFixed(2) + ") = " + h.toFixed(4) + " bits";
      }
      if (status) {
        status.textContent =
          p === 0.5
            ? "Fair coin: maximum uncertainty (1 bit)."
            : "More biased ⇒ more predictable ⇒ lower entropy.";
      }
    }

    pEl.addEventListener("input", render);
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
