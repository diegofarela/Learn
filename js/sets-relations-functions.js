/**
 * Sets / relations / functions: Venn + arrow diagram lab.
 */
(function () {
  var DOMAIN = ["a", "b", "c"];
  var CODOMAIN = ["1", "2", "3"];
  var NS = "http://www.w3.org/2000/svg";

  var DEFAULT_PAIRS = [
    ["a", "1"],
    ["a", "2"],
    ["b", "2"],
    ["c", "3"]
  ];

  function initSrf() {
    var svg = document.getElementById("srf-svg");
    var status = document.getElementById("srf-status");
    var badge = document.getElementById("srf-badge");
    var modeLabel = document.getElementById("srf-mode-label");
    var codeRoot = document.getElementById("srf-code");
    var codeNote = document.getElementById("srf-code-note");
    var resetBtn = document.getElementById("srf-reset");
    var toggle = document.querySelector(".srf-toggle");
    if (!svg) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mode = "relation";
    var pairs = DEFAULT_PAIRS.map(function (p) {
      return p.slice();
    });

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function hasPair(x, y) {
      return pairs.some(function (p) {
        return p[0] === x && p[1] === y;
      });
    }

    function togglePair(x, y) {
      var idx = -1;
      for (var i = 0; i < pairs.length; i++) {
        if (pairs[i][0] === x && pairs[i][1] === y) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) pairs.splice(idx, 1);
      else pairs.push([x, y]);
    }

    function imagesOf(x) {
      return pairs
        .filter(function (p) {
          return p[0] === x;
        })
        .map(function (p) {
          return p[1];
        });
    }

    function isFunction() {
      return DOMAIN.every(function (x) {
        return imagesOf(x).length === 1;
      });
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

    function leftPos(i) {
      return { x: 70, y: 55 + i * 70 };
    }

    function rightPos(i) {
      return { x: 370, y: 55 + i * 70 };
    }

    function drawArrows() {
      svg.innerHTML = "";
      var defs = svgEl("defs");
      var marker = svgEl("marker", {
        id: "srf-arrow",
        markerWidth: "8",
        markerHeight: "8",
        refX: "6",
        refY: "3",
        orient: "auto"
      });
      marker.appendChild(
        svgEl("path", { d: "M0,0 L6,3 L0,6 Z", fill: "var(--accent, #3ecfc4)" })
      );
      defs.appendChild(marker);
      svg.appendChild(defs);

      svg.appendChild(
        svgEl("text", {
          x: "70",
          y: "22",
          "text-anchor": "middle",
          class: "srf-label",
          fill: "currentColor"
        })
      ).textContent = "X (domain)";
      svg.appendChild(
        svgEl("text", {
          x: "370",
          y: "22",
          "text-anchor": "middle",
          class: "srf-label",
          fill: "currentColor"
        })
      ).textContent = "Y (codomain)";

      DOMAIN.forEach(function (x, i) {
        var p = leftPos(i);
        var g = svgEl("g", { class: "srf-node", "data-side": "L", "data-id": x });
        var c = svgEl("circle", {
          cx: String(p.x),
          cy: String(p.y),
          r: "18",
          class: "srf-circle"
        });
        var imgs = imagesOf(x);
        if (mode === "function") {
          if (imgs.length === 1) c.classList.add("is-ok");
          else c.classList.add("is-bad");
        }
        g.appendChild(c);
        var t = svgEl("text", {
          x: String(p.x),
          y: String(p.y + 5),
          "text-anchor": "middle",
          class: "srf-node-label"
        });
        t.textContent = x;
        g.appendChild(t);
        svg.appendChild(g);
      });

      CODOMAIN.forEach(function (y, i) {
        var p = rightPos(i);
        var g = svgEl("g", { class: "srf-node", "data-side": "R", "data-id": y });
        g.appendChild(
          svgEl("circle", {
            cx: String(p.x),
            cy: String(p.y),
            r: "18",
            class: "srf-circle"
          })
        );
        var t = svgEl("text", {
          x: String(p.x),
          y: String(p.y + 5),
          "text-anchor": "middle",
          class: "srf-node-label"
        });
        t.textContent = y;
        g.appendChild(t);
        svg.appendChild(g);
      });

      DOMAIN.forEach(function (x, i) {
        CODOMAIN.forEach(function (y, j) {
          var L = leftPos(i);
          var R = rightPos(j);
          var on = hasPair(x, y);
          var line = svgEl("line", {
            x1: String(L.x + 18),
            y1: String(L.y),
            x2: String(R.x - 18),
            y2: String(R.y),
            class: on ? "srf-edge is-on" : "srf-edge",
            "data-x": x,
            "data-y": y,
            "stroke-width": on ? "2.5" : "1",
            "stroke-dasharray": on ? "none" : "4 4",
            "marker-end": on ? "url(#srf-arrow)" : "none",
            "pointer-events": "stroke"
          });
          if (!reduceMotion && on) line.classList.add("is-pulse");
          svg.appendChild(line);
        });
      });
    }

    function drawVenn() {
      svg.innerHTML = "";
      svg.appendChild(
        svgEl("circle", {
          cx: "170",
          cy: "130",
          r: "90",
          class: "srf-venn srf-venn-a"
        })
      );
      svg.appendChild(
        svgEl("circle", {
          cx: "270",
          cy: "130",
          r: "90",
          class: "srf-venn srf-venn-b"
        })
      );
      var ta = svgEl("text", {
        x: "130",
        y: "80",
        class: "srf-label",
        fill: "currentColor"
      });
      ta.textContent = "A";
      svg.appendChild(ta);
      var tb = svgEl("text", {
        x: "300",
        y: "80",
        class: "srf-label",
        fill: "currentColor"
      });
      tb.textContent = "B";
      svg.appendChild(tb);
      var mid = svgEl("text", {
        x: "220",
        y: "135",
        "text-anchor": "middle",
        class: "srf-node-label"
      });
      mid.textContent = "A ∩ B";
      svg.appendChild(mid);
      var onlyA = svgEl("text", {
        x: "120",
        y: "140",
        "text-anchor": "middle",
        class: "srf-node-label"
      });
      onlyA.textContent = "A−B";
      svg.appendChild(onlyA);
      var onlyB = svgEl("text", {
        x: "320",
        y: "140",
        "text-anchor": "middle",
        class: "srf-node-label"
      });
      onlyB.textContent = "B−A";
      svg.appendChild(onlyB);
    }

    function renderCode() {
      if (!codeRoot) return;
      var lines;
      if (mode === "venn") {
        lines = [
          "A, B ⊆ U",
          "A ∪ B = {x | x∈A ∨ x∈B}",
          "A ∩ B = {x | x∈A ∧ x∈B}",
          "A − B = {x | x∈A ∧ x∉B}"
        ];
      } else if (mode === "function") {
        lines = [
          "f ⊆ X × Y",
          "∀x∈X ∃! y∈Y: (x,y)∈f",
          "isFunction? " + (isFunction() ? "YES" : "NO"),
          "pairs = {" +
            pairs
              .map(function (p) {
                return "(" + p[0] + "," + p[1] + ")";
              })
              .join(" ") +
            "}"
        ];
      } else {
        lines = [
          "R ⊆ X × Y",
          "no uniqueness required",
          "|R| = " + pairs.length,
          "pairs = {" +
            pairs
              .map(function (p) {
                return "(" + p[0] + "," + p[1] + ")";
              })
              .join(" ") +
            "}"
        ];
      }
      codeRoot.innerHTML = "";
      lines.forEach(function (html, i) {
        var row = document.createElement("div");
        row.className = "code-line" + (i === 2 ? " is-active" : "");
        var ln = document.createElement("span");
        ln.className = "code-ln";
        ln.textContent = String(i + 1);
        var src = document.createElement("span");
        src.className = "code-src";
        src.textContent = html;
        row.appendChild(ln);
        row.appendChild(src);
        codeRoot.appendChild(row);
      });
    }

    function refresh() {
      if (modeLabel) modeLabel.textContent = mode;
      if (badge) badge.textContent = mode;
      if (mode === "venn") drawVenn();
      else drawArrows();
      renderCode();

      if (mode === "venn") {
        setStatus("Venn view: union is everything shaded; intersection is the overlap.");
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Set algebra</strong> — membership builds union, intersect, difference.";
        }
      } else if (mode === "function") {
        setStatus(
          isFunction()
            ? "Every domain element has exactly one arrow — this is a function."
            : "Not a function yet: some x has 0 or ≥2 images. Click edges to fix."
        );
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Function</strong> — exactly one image per domain element.";
        }
      } else {
        setStatus(
          "Relation mode: click dashed lines to add pairs, solid lines to remove."
        );
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Relation</strong> — any set of ordered pairs is allowed.";
        }
      }
    }

    svg.addEventListener("click", function (ev) {
      try {
        if (mode === "venn") return;
        var t = ev.target;
        if (!t || !t.getAttribute) return;
        var x = t.getAttribute("data-x");
        var y = t.getAttribute("data-y");
        if (!x || !y) return;
        togglePair(x, y);
        refresh();
      } catch (err) {
        console.error("[learn-srf] Edge click failed", err);
      }
    });

    if (toggle) {
      toggle.addEventListener("click", function (ev) {
        try {
          var btn = ev.target.closest("[data-srf-mode]");
          if (!btn) return;
          mode = btn.getAttribute("data-srf-mode") || "relation";
          toggle.querySelectorAll("[data-srf-mode]").forEach(function (b) {
            b.classList.toggle("is-selected", b === btn);
          });
          refresh();
        } catch (err) {
          console.error("[learn-srf] Mode toggle failed", err);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        try {
          pairs = DEFAULT_PAIRS.map(function (p) {
            return p.slice();
          });
          refresh();
        } catch (err) {
          console.error("[learn-srf] Reset failed", err);
        }
      });
    }

    refresh();
  }

  try {
    initSrf();
  } catch (err) {
    console.error("[learn-srf] Init failed", err);
  }
})();
