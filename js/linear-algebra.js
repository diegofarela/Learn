/**
 * 2D vector add / scale / matrix transform canvas.
 */
(function () {
  function initLa() {
    var canvas = document.getElementById("la-canvas");
    var opEl = document.getElementById("la-op");
    var status = document.getElementById("la-status");
    var meta = document.getElementById("la-meta");
    var codeRoot = document.getElementById("la-code");
    var codeNote = document.getElementById("la-code-note");
    var scaleEl = document.getElementById("la-scale");
    var rotEl = document.getElementById("la-rot");
    var sliders = document.getElementById("la-sliders");
    if (!canvas || !opEl) return;

    var ctx = canvas.getContext("2d");
    var origin = { x: canvas.width / 2, y: canvas.height / 2 };
    var scale = 40; // px per unit
    var u = { x: 2, y: 1 };
    var v = { x: 1, y: 2 };
    var drag = null;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function toScreen(p) {
      return { x: origin.x + p.x * scale, y: origin.y - p.y * scale };
    }

    function toWorld(sx, sy) {
      return {
        x: (sx - origin.x) / scale,
        y: (origin.y - sy) / scale
      };
    }

    function mag(p) {
      return Math.sqrt(p.x * p.x + p.y * p.y);
    }

    function result() {
      var op = opEl.value;
      if (op === "add") {
        return { x: u.x + v.x, y: u.y + v.y };
      }
      if (op === "scale") {
        var k = scaleEl ? Number(scaleEl.value) : 1;
        return { x: v.x * k, y: v.y * k };
      }
      var deg = rotEl ? Number(rotEl.value) : 0;
      var rad = (deg * Math.PI) / 180;
      var c = Math.cos(rad);
      var s = Math.sin(rad);
      return { x: c * v.x - s * v.y, y: s * v.x + c * v.y };
    }

    function drawArrow(from, to, color, width) {
      var a = toScreen(from);
      var b = toScreen(to);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width || 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      var ang = Math.atan2(a.y - b.y, b.x - a.x);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(
        b.x - 10 * Math.cos(ang - 0.4),
        b.y + 10 * Math.sin(ang - 0.4)
      );
      ctx.lineTo(
        b.x - 10 * Math.cos(ang + 0.4),
        b.y + 10 * Math.sin(ang + 0.4)
      );
      ctx.closePath();
      ctx.fill();
    }

    function draw() {
      var w = canvas.width;
      var h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // grid
      ctx.strokeStyle = "rgba(232,240,244,0.08)";
      ctx.lineWidth = 1;
      for (var gx = origin.x % scale; gx < w; gx += scale) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (var gy = origin.y % scale; gy < h; gy += scale) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(232,240,244,0.25)";
      ctx.beginPath();
      ctx.moveTo(0, origin.y);
      ctx.lineTo(w, origin.y);
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, h);
      ctx.stroke();

      var op = opEl.value;
      var r = result();
      var zero = { x: 0, y: 0 };

      if (op === "add") {
        drawArrow(zero, u, "#3ecfc4", 2);
        drawArrow(u, { x: u.x + v.x, y: u.y + v.y }, "#ffd27a", 2);
        drawArrow(zero, v, "rgba(255,210,122,0.35)", 1);
        drawArrow(zero, r, "#e8f0f4", 3);
      } else if (op === "scale") {
        drawArrow(zero, v, "rgba(255,210,122,0.4)", 1);
        drawArrow(zero, r, "#3ecfc4", 3);
      } else {
        drawArrow(zero, v, "rgba(255,210,122,0.4)", 1);
        drawArrow(zero, r, "#7ec8ff", 3);
      }

      // handles
      [[u, "#3ecfc4", "u"], [v, "#ffd27a", "v"]].forEach(function (pair) {
        if (op !== "add" && pair[2] === "u") return;
        var s = toScreen(pair[0]);
        ctx.fillStyle = pair[1];
        ctx.beginPath();
        ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
        ctx.fill();
      });

      if (meta) meta.textContent = mag(r).toFixed(2);
      if (sliders) {
        sliders.classList.toggle("is-scale", op === "scale");
        sliders.classList.toggle("is-matrix", op === "matrix");
        sliders.classList.toggle("is-add", op === "add");
      }

      if (codeRoot) {
        codeRoot.innerHTML = "";
        function line(t) {
          var row = document.createElement("div");
          row.className = "code-line";
          row.textContent = t;
          codeRoot.appendChild(row);
        }
        line("u = [" + u.x.toFixed(2) + ", " + u.y.toFixed(2) + "]");
        line("v = [" + v.x.toFixed(2) + ", " + v.y.toFixed(2) + "]");
        if (op === "add") {
          line("u+v = [" + r.x.toFixed(2) + ", " + r.y.toFixed(2) + "]");
        } else if (op === "scale") {
          var k = scaleEl ? Number(scaleEl.value) : 1;
          line("k = " + k.toFixed(1));
          line("k·v = [" + r.x.toFixed(2) + ", " + r.y.toFixed(2) + "]");
        } else {
          var deg = rotEl ? Number(rotEl.value) : 0;
          line("R(" + deg + "°) · v");
          line("= [" + r.x.toFixed(2) + ", " + r.y.toFixed(2) + "]");
        }
      }
    }

    function hit(sx, sy) {
      var op = opEl.value;
      var targets = op === "add" ? [u, v] : [v];
      for (var i = 0; i < targets.length; i++) {
        var s = toScreen(targets[i]);
        var dx = s.x - sx;
        var dy = s.y - sy;
        if (dx * dx + dy * dy < 14 * 14) return targets[i];
      }
      return null;
    }

    canvas.addEventListener("pointerdown", function (e) {
      var rect = canvas.getBoundingClientRect();
      var sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      var sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
      drag = hit(sx, sy);
      if (drag) canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var rect = canvas.getBoundingClientRect();
      var sx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      var sy = ((e.clientY - rect.top) / rect.height) * canvas.height;
      var wpt = toWorld(sx, sy);
      drag.x = Math.max(-5, Math.min(5, wpt.x));
      drag.y = Math.max(-3.2, Math.min(3.2, wpt.y));
      draw();
    });
    canvas.addEventListener("pointerup", function () {
      drag = null;
    });

    opEl.addEventListener("change", function () {
      setStatus(
        opEl.value === "add"
          ? "Drag the tips of u (teal) and v (amber). Result in white."
          : opEl.value === "scale"
            ? "Scale v with the slider — amber is original, teal is k·v."
            : "Rotate v with the slider — matrix R(θ) applied to v."
      );
      if (codeNote) {
        codeNote.textContent =
          opEl.value === "matrix"
            ? "Rotation matrix columns are where e₁ and e₂ land."
            : "Matrix columns say where basis vectors go.";
      }
      draw();
    });
    if (scaleEl) scaleEl.addEventListener("input", draw);
    if (rotEl) rotEl.addEventListener("input", draw);

    document.querySelectorAll("[data-la-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        u = { x: 2, y: 1 };
        v = { x: 1, y: 2 };
        if (scaleEl) scaleEl.value = "1.5";
        if (rotEl) rotEl.value = "30";
        draw();
        setStatus("Vectors reset.");
      });
    });

    draw();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLa);
  } else {
    initLa();
  }
})();
