/**
 * 1D gradient descent ball-on-curve animation.
 */
(function () {
  // f(x) = 0.15*(x-0.2)^4 - 0.8*(x-0.2)^2 + 0.1*x + 2.2  (two wells-ish)
  function f(x) {
    var t = x - 0.3;
    return 0.12 * t * t * t * t - 0.9 * t * t + 0.15 * x + 2.4;
  }

  function fp(x) {
    var t = x - 0.3;
    return 0.48 * t * t * t - 1.8 * t + 0.15;
  }

  function initGd() {
    var canvas = document.getElementById("gd-canvas");
    var status = document.getElementById("gd-status");
    var meta = document.getElementById("gd-meta");
    var phase = document.getElementById("gd-phase");
    var etaEl = document.getElementById("gd-eta");
    var etaLabel = document.getElementById("gd-eta-label");
    var codeRoot = document.getElementById("gd-code");
    var codeNote = document.getElementById("gd-code-note");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    var xMin = -2.2;
    var xMax = 2.8;
    var x = -1.6;
    var path = [];
    var playTimer = null;
    var dragging = false;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
      if (phase) phase.textContent = "idle";
    }

    function mapX(xv) {
      var pad = 24;
      return pad + ((xv - xMin) / (xMax - xMin)) * (canvas.width - 2 * pad);
    }

    function mapY(yv) {
      var pad = 20;
      var yLo = 0.5;
      var yHi = 4.5;
      return canvas.height - pad - ((yv - yLo) / (yHi - yLo)) * (canvas.height - 2 * pad);
    }

    function unmapX(sx) {
      var pad = 24;
      return xMin + ((sx - pad) / (canvas.width - 2 * pad)) * (xMax - xMin);
    }

    function draw() {
      var w = canvas.width;
      var h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "#3ecfc4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i <= 120; i++) {
        var xv = xMin + (i / 120) * (xMax - xMin);
        var yv = f(xv);
        var sx = mapX(xv);
        var sy = mapY(yv);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      if (path.length > 1) {
        ctx.strokeStyle = "rgba(255,210,122,0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        path.forEach(function (px, i) {
          var sx = mapX(px);
          var sy = mapY(f(px));
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.stroke();
      }

      var bx = mapX(x);
      var by = mapY(f(x));
      ctx.fillStyle = "#ffd27a";
      ctx.beginPath();
      ctx.arc(bx, by, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#12202a";
      ctx.lineWidth = 2;
      ctx.stroke();

      // gradient tick
      var g = fp(x);
      ctx.strokeStyle = "rgba(255,138,122,0.85)";
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + (g > 0 ? -18 : 18), by);
      ctx.stroke();

      if (meta) meta.textContent = x.toFixed(2);
      if (etaLabel && etaEl) etaLabel.textContent = Number(etaEl.value).toFixed(2);

      if (codeRoot) {
        codeRoot.innerHTML = "";
        [
          "f(x) = loss",
          "g = f'(x) = " + g.toFixed(3),
          "η = " + (etaEl ? Number(etaEl.value).toFixed(2) : "?"),
          "x ← x − η·g  →  " + x.toFixed(3)
        ].forEach(function (line) {
          var row = document.createElement("div");
          row.className = "code-line";
          row.textContent = line;
          codeRoot.appendChild(row);
        });
      }
    }

    function stepOnce() {
      var eta = etaEl ? Number(etaEl.value) : 0.15;
      var g = fp(x);
      x = x - eta * g;
      x = Math.max(xMin + 0.05, Math.min(xMax - 0.05, x));
      path.push(x);
      if (path.length > 40) path.shift();
      draw();
      setStatus("Stepped: x ← x − η·f′(x) = " + x.toFixed(3) + " (f′=" + g.toFixed(3) + ")");
      if (codeNote) {
        codeNote.textContent =
          Math.abs(g) < 0.05
            ? "Near a flat region / local minimum."
            : "Follow the negative gradient.";
      }
    }

    function reset() {
      clearPlay();
      x = -1.6;
      path = [x];
      draw();
      setStatus("Ready — step downhill: x ← x − η · f′(x).");
    }

    canvas.addEventListener("pointerdown", function (e) {
      clearPlay();
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      var rect = canvas.getBoundingClientRect();
      var sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      x = Math.max(xMin + 0.05, Math.min(xMax - 0.05, unmapX(sx)));
      path = [x];
      draw();
      setStatus("Start at x = " + x.toFixed(2));
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var rect = canvas.getBoundingClientRect();
      var sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      x = Math.max(xMin + 0.05, Math.min(xMax - 0.05, unmapX(sx)));
      path = [x];
      draw();
    });
    canvas.addEventListener("pointerup", function () {
      dragging = false;
    });

    if (etaEl) etaEl.addEventListener("input", draw);

    document.querySelectorAll("[data-gd-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-gd-action");
        if (a === "step") {
          clearPlay();
          stepOnce();
        } else if (a === "play") {
          clearPlay();
          if (phase) phase.textContent = "descending";
          function tick() {
            stepOnce();
            if (Math.abs(fp(x)) < 0.02) {
              clearPlay();
              setStatus("Stopped near a critical point (small gradient).");
              return;
            }
            playTimer = window.setTimeout(tick, reduceMotion ? 40 : 280);
          }
          tick();
        } else if (a === "reset") reset();
      });
    });

    path = [x];
    draw();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGd);
  } else {
    initGd();
  }
})();
