/**
 * Polynomial fit degree slider — train vs test feel.
 */
(function () {
  function init() {
    var degEl = document.getElementById("sl-deg");
    var degVal = document.getElementById("sl-deg-val");
    var canvas = document.getElementById("sl-canvas");
    var status = document.getElementById("sl-status");
    var badge = document.getElementById("sl-badge");
    var meta = document.getElementById("sl-meta");
    var code = document.getElementById("sl-code");
    var noiseBtn = document.getElementById("sl-noise");
    if (!canvas || !degEl) return;
    var ctx = canvas.getContext("2d");

    var train = [];
    var test = [];

    function truth(x) {
      return Math.sin(x * 1.6) * 0.55 + 0.1 * x;
    }

    function resample() {
      train = [];
      test = [];
      for (var i = 0; i < 12; i++) {
        var x = -1 + (2 * i) / 11;
        train.push({ x: x, y: truth(x) + (Math.random() - 0.5) * 0.35 });
      }
      for (var j = 0; j < 8; j++) {
        var xt = -1 + (2 * j) / 7;
        test.push({ x: xt, y: truth(xt) + (Math.random() - 0.5) * 0.35 });
      }
      draw();
    }

    function vandermonde(pts, deg) {
      var A = pts.map(function (p) {
        var row = [];
        for (var k = 0; k <= deg; k++) row.push(Math.pow(p.x, k));
        return row;
      });
      var y = pts.map(function (p) { return p.y; });
      return solveNormal(A, y);
    }

    function solveNormal(A, y) {
      var n = A[0].length;
      var ATA = [];
      var ATy = [];
      for (var i = 0; i < n; i++) {
        ATA[i] = [];
        ATy[i] = 0;
        for (var j = 0; j < n; j++) {
          var s = 0;
          for (var r = 0; r < A.length; r++) s += A[r][i] * A[r][j];
          ATA[i][j] = s + (i === j ? 1e-9 : 0);
        }
        for (var r2 = 0; r2 < A.length; r2++) ATy[i] += A[r2][i] * y[r2];
      }
      return gauss(ATA, ATy);
    }

    function gauss(M, b) {
      var n = b.length;
      var A = M.map(function (row, i) { return row.concat([b[i]]); });
      for (var col = 0; col < n; col++) {
        var piv = col;
        for (var r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
        var tmp = A[col]; A[col] = A[piv]; A[piv] = tmp;
        var div = A[col][col] || 1e-12;
        for (var c = col; c <= n; c++) A[col][c] /= div;
        for (var r2 = 0; r2 < n; r2++) {
          if (r2 === col) continue;
          var f = A[r2][col];
          for (var c2 = col; c2 <= n; c2++) A[r2][c2] -= f * A[col][c2];
        }
      }
      return A.map(function (row) { return row[n]; });
    }

    function predict(coef, x) {
      var s = 0;
      for (var k = 0; k < coef.length; k++) s += coef[k] * Math.pow(x, k);
      return s;
    }

    function mse(pts, coef) {
      var s = 0;
      pts.forEach(function (p) {
        var e = predict(coef, p.x) - p.y;
        s += e * e;
      });
      return s / pts.length;
    }

    function draw() {
      var deg = Number(degEl.value);
      if (degVal) degVal.textContent = String(deg);
      if (meta) meta.textContent = String(deg);
      if (badge) badge.textContent = "deg " + deg;
      var coef = vandermonde(train, deg);
      var tr = mse(train, coef);
      var te = mse(test, coef);

      var w = canvas.width;
      var h = canvas.height;
      var pad = 24;
      ctx.clearRect(0, 0, w, h);
      function X(x) { return pad + ((x + 1) / 2) * (w - 2 * pad); }
      function Y(y) { return h / 2 - y * 90; }

      ctx.strokeStyle = "rgba(127,140,160,0.4)";
      ctx.beginPath();
      ctx.moveTo(pad, h / 2);
      ctx.lineTo(w - pad, h / 2);
      ctx.stroke();

      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#5b9fd4";
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var x = -1 + (2 * i) / 60;
        var y = predict(coef, x);
        var px = X(x);
        var py = Y(y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      train.forEach(function (p) {
        ctx.fillStyle = "#7ec8a3";
        ctx.beginPath();
        ctx.arc(X(p.x), Y(p.y), 4, 0, Math.PI * 2);
        ctx.fill();
      });
      test.forEach(function (p) {
        ctx.fillStyle = "#d4a27f";
        ctx.beginPath();
        ctx.arc(X(p.x), Y(p.y), 4, 0, Math.PI * 2);
        ctx.fill();
      });

      if (code) {
        code.textContent =
          "min_w Σ (ŷ(x)−y)²   deg=" + deg + "\n" +
          "train MSE=" + tr.toFixed(3) + "  test MSE=" + te.toFixed(3);
      }
      if (status) {
        status.textContent =
          te > tr * 1.6 && deg >= 6
            ? "Test error rising — classic overfit."
            : "Green=train, orange=test. High degree hugs train noise.";
      }
    }

    degEl.addEventListener("input", draw);
    if (noiseBtn) noiseBtn.addEventListener("click", resample);
    resample();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
