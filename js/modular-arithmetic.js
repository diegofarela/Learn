/**
 * Modular arithmetic: interactive clock face mod n.
 */
(function () {
  var NS = "http://www.w3.org/2000/svg";

  function initMod() {
    var aSlider = document.getElementById("mod-a");
    var nSlider = document.getElementById("mod-n");
    var aVal = document.getElementById("mod-a-val");
    var nVal = document.getElementById("mod-n-val");
    var clock = document.getElementById("mod-clock");
    var status = document.getElementById("mod-status");
    var badge = document.getElementById("mod-badge");
    var metaA = document.getElementById("mod-meta-a");
    var metaR = document.getElementById("mod-meta-r");
    var metaN = document.getElementById("mod-meta-n");
    var codeRoot = document.getElementById("mod-code");
    var codeNote = document.getElementById("mod-code-note");
    var addBtn = document.getElementById("mod-add");
    var subBtn = document.getElementById("mod-sub");
    if (!aSlider || !nSlider || !clock) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    function draw(a, n, r) {
      clock.innerHTML = "";
      var cx = 140;
      var cy = 140;
      var rad = 110;
      clock.appendChild(
        svgEl("circle", {
          cx: String(cx),
          cy: String(cy),
          r: String(rad),
          class: "mod-face"
        })
      );

      for (var i = 0; i < n; i++) {
        var ang = (i / n) * Math.PI * 2 - Math.PI / 2;
        var x = cx + Math.cos(ang) * (rad - 8);
        var y = cy + Math.sin(ang) * (rad - 8);
        var tx = cx + Math.cos(ang) * (rad - 28);
        var ty = cy + Math.sin(ang) * (rad - 28);
        clock.appendChild(
          svgEl("line", {
            x1: String(cx + Math.cos(ang) * (rad - 2)),
            y1: String(cy + Math.sin(ang) * (rad - 2)),
            x2: String(x),
            y2: String(y),
            class: i === r ? "mod-tick is-active" : "mod-tick"
          })
        );
        var t = svgEl("text", {
          x: String(tx),
          y: String(ty + 4),
          "text-anchor": "middle",
          class: i === r ? "mod-num is-active" : "mod-num"
        });
        t.textContent = String(i);
        clock.appendChild(t);
      }

      var handAng = (r / n) * Math.PI * 2 - Math.PI / 2;
      var hx = cx + Math.cos(handAng) * (rad - 45);
      var hy = cy + Math.sin(handAng) * (rad - 45);
      var hand = svgEl("line", {
        x1: String(cx),
        y1: String(cy),
        x2: String(hx),
        y2: String(hy),
        class: "mod-hand" + (reduceMotion ? "" : " is-spin")
      });
      clock.appendChild(hand);
      clock.appendChild(
        svgEl("circle", {
          cx: String(cx),
          cy: String(cy),
          r: "6",
          class: "mod-hub"
        })
      );
      var center = svgEl("text", {
        x: String(cx),
        y: String(cy + 40),
        "text-anchor": "middle",
        class: "mod-center"
      });
      center.textContent = "mod " + n;
      clock.appendChild(center);
    }

    function refresh() {
      var a = Number(aSlider.value) || 0;
      var n = Number(nSlider.value) || 2;
      var r = ((a % n) + n) % n;
      var q = Math.floor(a / n);

      if (aVal) aVal.textContent = String(a);
      if (nVal) nVal.textContent = String(n);
      aSlider.setAttribute("aria-valuenow", String(a));
      nSlider.setAttribute("aria-valuenow", String(n));
      if (metaA) metaA.textContent = String(a);
      if (metaR) metaR.textContent = String(r);
      if (metaN) metaN.textContent = String(n);
      if (badge) badge.textContent = a + " ≡ " + r + " (mod " + n + ")";

      draw(a, n, r);

      if (codeRoot) {
        var lines = [
          a + " = " + q + "·" + n + " + " + r,
          a + " ≡ " + r + " (mod " + n + ")",
          "int r = a % n;  // → " + r,
          (a + n) + " ≡ " + r + "  (adding n)"
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
          "<strong>Remainder " +
          r +
          "</strong> — hand points at residue class of " +
          a +
          ".";
      }

      setStatus(
        a +
          " = " +
          q +
          "·" +
          n +
          " + " +
          r +
          ", so " +
          a +
          " ≡ " +
          r +
          " (mod " +
          n +
          "). Same tick as " +
          r +
          "."
      );
    }

    aSlider.addEventListener("input", function () {
      try {
        refresh();
      } catch (err) {
        console.error("[learn-mod] a slider failed", err);
      }
    });
    nSlider.addEventListener("input", function () {
      try {
        refresh();
      } catch (err) {
        console.error("[learn-mod] n slider failed", err);
      }
    });

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        try {
          var a = Number(aSlider.value) || 0;
          var n = Number(nSlider.value) || 2;
          aSlider.value = String(Math.min(48, a + n));
          refresh();
        } catch (err) {
          console.error("[learn-mod] add failed", err);
        }
      });
    }
    if (subBtn) {
      subBtn.addEventListener("click", function () {
        try {
          var a = Number(aSlider.value) || 0;
          var n = Number(nSlider.value) || 2;
          aSlider.value = String(Math.max(0, a - n));
          refresh();
        } catch (err) {
          console.error("[learn-mod] sub failed", err);
        }
      });
    }

    refresh();
  }

  try {
    initMod();
  } catch (err) {
    console.error("[learn-mod] Init failed", err);
  }
})();
