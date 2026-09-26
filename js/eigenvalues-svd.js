/**
 * Diagonal SVD stretch on unit circle.
 */
(function () {
  function init() {
    var s1 = document.getElementById("eig-s1");
    var s2 = document.getElementById("eig-s2");
    var s1v = document.getElementById("eig-s1-val");
    var s2v = document.getElementById("eig-s2-val");
    var canvas = document.getElementById("eig-canvas");
    var status = document.getElementById("eig-status");
    var badge = document.getElementById("eig-badge");
    var meta = document.getElementById("eig-meta");
    var code = document.getElementById("eig-code");
    if (!canvas || !s1) return;
    var ctx = canvas.getContext("2d");

    function draw() {
      var a = Number(s1.value) / 10;
      var b = Number(s2.value) / 10;
      if (s1v) s1v.textContent = a.toFixed(1);
      if (s2v) s2v.textContent = b.toFixed(1);
      var w = canvas.width;
      var h = canvas.height;
      var cx = w / 2;
      var cy = h / 2;
      var scale = 48;
      ctx.clearRect(0, 0, w, h);
      // axes
      ctx.strokeStyle = "rgba(127,140,160,0.45)";
      ctx.beginPath();
      ctx.moveTo(20, cy);
      ctx.lineTo(w - 20, cy);
      ctx.moveTo(cx, 20);
      ctx.lineTo(cx, h - 20);
      ctx.stroke();
      // unit circle
      ctx.strokeStyle = "rgba(127,140,160,0.7)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, scale, scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      // ellipse
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#5b9fd4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, scale * a, scale * b, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
      if (badge) badge.textContent = "σ₁=" + a.toFixed(1) + " σ₂=" + b.toFixed(1);
      if (meta) meta.textContent = a.toFixed(1) + ", " + b.toFixed(1);
      if (code) {
        code.textContent =
          "Σ = diag(" + a.toFixed(1) + ", " + b.toFixed(1) + ")\n" +
          "unit circle → ellipse axes σ\n" +
          "condition number ≈ " + (Math.max(a, b) / Math.max(1e-6, Math.min(a, b))).toFixed(2);
      }
      if (status) {
        status.textContent = "Singular values = axis stretch lengths of the unit circle.";
      }
    }

    s1.addEventListener("input", draw);
    s2.addEventListener("input", draw);
    draw();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
