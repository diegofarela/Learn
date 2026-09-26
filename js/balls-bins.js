/**
 * Balls & bins: throw into bins + birthday collision curve.
 */
(function () {
  var NS = "http://www.w3.org/2000/svg";

  function collisionProb(n, m) {
    if (m <= 1) return 0;
    if (m > n) return 1;
    var pNone = 1;
    for (var i = 1; i < m; i++) {
      pNone *= (n - i) / n;
    }
    return 1 - pNone;
  }

  function initBb() {
    var nSlider = document.getElementById("bb-n");
    var nVal = document.getElementById("bb-n-val");
    var binsEl = document.getElementById("bb-bins");
    var chart = document.getElementById("bb-chart");
    var status = document.getElementById("bb-status");
    var badge = document.getElementById("bb-badge");
    var meta = document.getElementById("bb-meta");
    var codeRoot = document.getElementById("bb-code");
    var codeNote = document.getElementById("bb-code-note");
    var throwBtn = document.getElementById("bb-throw");
    var throw5Btn = document.getElementById("bb-throw5");
    var resetBtn = document.getElementById("bb-reset");
    if (!nSlider || !binsEl || !chart) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var loads = [];
    var m = 0;
    var lastBin = -1;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function svgEl(name, attrs) {
      var el = document.createElementNS(NS, name);
      if (attrs) {
        Object.keys(attrs).forEach(function (k) {
          el.setAttribute(k, attrs[k]);
        });
      }
      return el;
    }

    function ensureBins(n) {
      if (loads.length !== n) {
        loads = new Array(n).fill(0);
        m = 0;
        lastBin = -1;
      }
    }

    function hasCollision() {
      return loads.some(function (c) {
        return c >= 2;
      });
    }

    function drawChart(n, mCur) {
      chart.innerHTML = "";
      var W = 420;
      var H = 160;
      var pad = { l: 36, r: 12, t: 12, b: 28 };
      var maxM = Math.min(n + 2, Math.max(n, 40));
      var innerW = W - pad.l - pad.r;
      var innerH = H - pad.t - pad.b;

      chart.appendChild(
        svgEl("line", {
          x1: String(pad.l),
          y1: String(pad.t),
          x2: String(pad.l),
          y2: String(H - pad.b),
          class: "bb-axis"
        })
      );
      chart.appendChild(
        svgEl("line", {
          x1: String(pad.l),
          y1: String(H - pad.b),
          x2: String(W - pad.r),
          y2: String(H - pad.b),
          class: "bb-axis"
        })
      );

      var pts = [];
      for (var mi = 0; mi <= maxM; mi++) {
        var p = collisionProb(n, mi);
        var x = pad.l + (mi / maxM) * innerW;
        var y = pad.t + (1 - p) * innerH;
        pts.push(x + "," + y);
      }
      chart.appendChild(
        svgEl("polyline", {
          points: pts.join(" "),
          class: "bb-curve",
          fill: "none"
        })
      );

      // 0.5 guide
      var y50 = pad.t + 0.5 * innerH;
      chart.appendChild(
        svgEl("line", {
          x1: String(pad.l),
          y1: String(y50),
          x2: String(W - pad.r),
          y2: String(y50),
          class: "bb-guide"
        })
      );
      var t50 = svgEl("text", {
        x: String(pad.l - 4),
        y: String(y50 + 4),
        "text-anchor": "end",
        class: "bb-axis-label"
      });
      t50.textContent = "0.5";
      chart.appendChild(t50);

      var xm = pad.l + (Math.min(mCur, maxM) / maxM) * innerW;
      var ym = pad.t + (1 - collisionProb(n, mCur)) * innerH;
      chart.appendChild(
        svgEl("circle", {
          cx: String(xm),
          cy: String(ym),
          r: "5",
          class: "bb-dot" + (reduceMotion ? "" : " is-pulse")
        })
      );

      var xl = svgEl("text", {
        x: String(W / 2),
        y: String(H - 6),
        "text-anchor": "middle",
        class: "bb-axis-label"
      });
      xl.textContent = "m balls →";
      chart.appendChild(xl);
    }

    function refresh() {
      var n = Number(nSlider.value) || 24;
      ensureBins(n);
      if (nVal) nVal.textContent = String(n);
      nSlider.setAttribute("aria-valuenow", String(n));
      if (meta) meta.textContent = String(m);
      if (badge) badge.textContent = "m=" + m + " n=" + n;

      binsEl.innerHTML = "";
      loads.forEach(function (count, i) {
        var bin = document.createElement("div");
        bin.className = "bb-bin";
        if (count >= 2) bin.classList.add("is-collision");
        if (i === lastBin) {
          bin.classList.add("is-hit");
          if (!reduceMotion) bin.classList.add("is-pulse");
        }
        var stack = document.createElement("div");
        stack.className = "bb-stack";
        for (var b = 0; b < Math.min(count, 8); b++) {
          var ball = document.createElement("span");
          ball.className = "bb-ball";
          stack.appendChild(ball);
        }
        if (count > 8) {
          var more = document.createElement("span");
          more.className = "bb-more";
          more.textContent = "+" + (count - 8);
          stack.appendChild(more);
        }
        var label = document.createElement("span");
        label.className = "bb-bin-label";
        label.textContent = String(count);
        bin.appendChild(stack);
        bin.appendChild(label);
        binsEl.appendChild(bin);
      });

      var p = collisionProb(n, m);
      drawChart(n, m);

      if (codeRoot) {
        var lines = [
          "m=" + m + ", n=" + n,
          "P(collision) ≈ " + p.toFixed(4),
          "empirical collision: " + (hasCollision() ? "YES" : "no"),
          "E[load/bin] = m/n = " + (m / n).toFixed(3)
        ];
        codeRoot.innerHTML = "";
        lines.forEach(function (text, i) {
          var row = document.createElement("div");
          row.className = "code-line" + (i === 1 ? " is-active" : "");
          var ln = document.createElement("span");
          ln.className = "code-ln";
          ln.textContent = String(i + 1);
          var src = document.createElement("span");
          src.className = "code-src";
          src.textContent = text;
          row.appendChild(ln);
          row.appendChild(src);
          codeRoot.appendChild(row);
        });
      }

      if (codeNote) {
        codeNote.innerHTML =
          "<strong>P≈" +
          (p * 100).toFixed(1) +
          "%</strong> — theoretical ≥1 collision with m balls, n bins.";
      }

      setStatus(
        m === 0
          ? "Empty bins. P(≥1 collision) rises fast with m — birthday style."
          : "m=" +
              m +
              " balls in n=" +
              n +
              ". P(collision)≈" +
              (p * 100).toFixed(1) +
              "%" +
              (hasCollision() ? " · collision seen" : "") +
              "."
      );
    }

    function throwBalls(count) {
      var n = loads.length;
      for (var i = 0; i < count; i++) {
        var bin = Math.floor(Math.random() * n);
        loads[bin] += 1;
        lastBin = bin;
        m += 1;
      }
      refresh();
    }

    nSlider.addEventListener("input", function () {
      try {
        var n = Number(nSlider.value) || 24;
        loads = new Array(n).fill(0);
        m = 0;
        lastBin = -1;
        refresh();
      } catch (err) {
        console.error("[learn-bb] n slider failed", err);
      }
    });

    if (throwBtn) {
      throwBtn.addEventListener("click", function () {
        try {
          throwBalls(1);
        } catch (err) {
          console.error("[learn-bb] Throw failed", err);
        }
      });
    }
    if (throw5Btn) {
      throw5Btn.addEventListener("click", function () {
        try {
          throwBalls(5);
        } catch (err) {
          console.error("[learn-bb] Throw5 failed", err);
        }
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        try {
          loads = loads.map(function () {
            return 0;
          });
          m = 0;
          lastBin = -1;
          refresh();
        } catch (err) {
          console.error("[learn-bb] Reset failed", err);
        }
      });
    }

    refresh();
  }

  try {
    initBb();
  } catch (err) {
    console.error("[learn-bb] Init failed", err);
  }
})();
