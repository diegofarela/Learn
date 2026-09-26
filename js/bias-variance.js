/**
 * Bias–variance: polynomial degree slider on noisy sample points.
 */
(function () {
  function truth(x) {
    return Math.sin(x * Math.PI);
  }

  function seededNoise(i, seed) {
    var n = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  function makePoints(seed) {
    var pts = [];
    for (var i = 0; i < 12; i++) {
      var x = -1 + (i / 11) * 2;
      var y = truth(x) + (seededNoise(i, seed) - 0.5) * 0.55;
      pts.push({ x: x, y: y });
    }
    return pts;
  }

  /** Least-squares polynomial fit via normal equations (degree d). */
  function fitPoly(pts, degree) {
    var n = pts.length;
    var m = degree + 1;
    var A = [];
    var b = [];
    for (var r = 0; r < m; r++) {
      A[r] = [];
      for (var c = 0; c < m; c++) {
        var sum = 0;
        for (var i = 0; i < n; i++) {
          sum += Math.pow(pts[i].x, r + c);
        }
        A[r][c] = sum;
      }
      var sb = 0;
      for (var j = 0; j < n; j++) {
        sb += pts[j].y * Math.pow(pts[j].x, r);
      }
      b[r] = sb;
    }
    return solve(A, b);
  }

  function solve(A, b) {
    var n = b.length;
    var M = A.map(function (row, i) {
      return row.concat([b[i]]);
    });
    for (var col = 0; col < n; col++) {
      var pivot = col;
      for (var r = col + 1; r < n; r++) {
        if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
      }
      var tmp = M[col];
      M[col] = M[pivot];
      M[pivot] = tmp;
      var div = M[col][col] || 1e-12;
      for (var c = col; c <= n; c++) M[col][c] /= div;
      for (var r2 = 0; r2 < n; r2++) {
        if (r2 === col) continue;
        var f = M[r2][col];
        for (var c2 = col; c2 <= n; c2++) M[r2][c2] -= f * M[col][c2];
      }
    }
    return M.map(function (row) {
      return row[n];
    });
  }

  function evalPoly(coef, x) {
    var y = 0;
    for (var i = 0; i < coef.length; i++) {
      y += coef[i] * Math.pow(x, i);
    }
    return y;
  }

  function initBv() {
    var canvas = document.getElementById("bv-canvas");
    var degreeEl = document.getElementById("bv-degree");
    var status = document.getElementById("bv-status");
    var meta = document.getElementById("bv-meta");
    var phase = document.getElementById("bv-phase");
    var codeRoot = document.getElementById("bv-code");
    var codeNote = document.getElementById("bv-code-note");
    if (!canvas || !degreeEl) return;

    var ctx = canvas.getContext("2d");
    var seed = 1;
    var points = makePoints(seed);

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function mse(coef) {
      var s = 0;
      points.forEach(function (p) {
        var e = evalPoly(coef, p.x) - p.y;
        s += e * e;
      });
      return s / points.length;
    }

    function draw() {
      var deg = Number(degreeEl.value);
      var coef = fitPoly(points, deg);
      var train = mse(coef);

      var w = canvas.width;
      var h = canvas.height;
      var pad = 28;
      ctx.clearRect(0, 0, w, h);

      function mx(x) {
        return pad + ((x + 1) / 2) * (w - 2 * pad);
      }
      function my(y) {
        return h / 2 - y * ((h - 2 * pad) / 2.6);
      }

      // axes
      ctx.strokeStyle = "rgba(232,240,244,0.2)";
      ctx.beginPath();
      ctx.moveTo(pad, h / 2);
      ctx.lineTo(w - pad, h / 2);
      ctx.stroke();

      // truth
      ctx.strokeStyle = "rgba(126,200,255,0.45)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (var i = 0; i <= 100; i++) {
        var x = -1 + i / 50;
        var sx = mx(x);
        var sy = my(truth(x));
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // fit
      ctx.strokeStyle = "#3ecfc4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var j = 0; j <= 100; j++) {
        var x2 = -1 + j / 50;
        var y2 = evalPoly(coef, x2);
        y2 = Math.max(-2, Math.min(2, y2));
        var sx2 = mx(x2);
        var sy2 = my(y2);
        if (j === 0) ctx.moveTo(sx2, sy2);
        else ctx.lineTo(sx2, sy2);
      }
      ctx.stroke();
      ctx.lineWidth = 1;

      points.forEach(function (p) {
        ctx.fillStyle = "#ffd27a";
        ctx.beginPath();
        ctx.arc(mx(p.x), my(p.y), 5, 0, Math.PI * 2);
        ctx.fill();
      });

      if (meta) meta.textContent = String(deg);
      var label;
      var note;
      if (deg <= 1) {
        label = "underfit";
        note = "Low degree — high bias, underfits the sine trend.";
      } else if (deg <= 3) {
        label = "sweet spot";
        note = "Moderate degree — tracks the trend without chasing every point.";
      } else {
        label = "overfit";
        note = "High degree — low training error, high variance (fits noise).";
      }
      if (phase) phase.textContent = label;
      setStatus(note);

      if (codeRoot) {
        codeRoot.innerHTML = "";
        [
          "degree = " + deg,
          "train MSE ≈ " + train.toFixed(3),
          "regime: " + label,
          "truth: sin(πx) (dashed)"
        ].forEach(function (line) {
          var row = document.createElement("div");
          row.className = "code-line";
          row.textContent = line;
          codeRoot.appendChild(row);
        });
      }
      if (codeNote) {
        codeNote.textContent =
          label === "sweet spot"
            ? "Generalization beats memorizing the sample."
            : "Aim for the sweet spot, not zero training error.";
      }
    }

    degreeEl.addEventListener("input", draw);
    document.querySelectorAll("[data-bv-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        seed += 1;
        points = makePoints(seed);
        draw();
      });
    });

    draw();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBv);
  } else {
    initBv();
  }
})();
