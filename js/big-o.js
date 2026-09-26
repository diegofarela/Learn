/**
 * Interactive Big-O growth chart + pseudocode highlighter.
 */
(function () {
  var CLASSES = [
    {
      id: "o1",
      label: "O(1)",
      color: "#7ec8ff",
      fn: function () {
        return 1;
      },
      code: [
        { html: '<span class="code-cm">/* constant — one step */</span>' },
        { html: '<span class="code-kw">return</span> a[i];', id: "body" },
        { html: '<span class="code-cm">/* cost stays flat as n grows */</span>' }
      ],
      note: "<strong>O(1)</strong> — one index lookup; n does not change the step count."
    },
    {
      id: "olog",
      label: "O(log n)",
      color: "#7ee0b8",
      fn: function (n) {
        return Math.log2(Math.max(n, 2));
      },
      code: [
        { html: '<span class="code-kw">while</span> (lo &lt;= hi) {', id: "loop" },
        { html: '  mid = (lo + hi) / <span class="code-num">2</span>;', id: "body" },
        { html: '  <span class="code-cm">/* halve the search space */</span>' },
        { html: '}' }
      ],
      note: "<strong>O(log n)</strong> — each step halves the problem (binary search)."
    },
    {
      id: "on",
      label: "O(n)",
      color: "#3ecfc4",
      fn: function (n) {
        return n;
      },
      code: [
        { html: '<span class="code-kw">for</span> i <span class="code-kw">in</span> <span class="code-num">0</span>..n-1 {', id: "loop" },
        { html: '  visit(a[i]);', id: "body" },
        { html: '}' }
      ],
      note: "<strong>O(n)</strong> — one pass: work grows in lockstep with n."
    },
    {
      id: "onlog",
      label: "O(n log n)",
      color: "#ffd27a",
      fn: function (n) {
        return n * Math.log2(Math.max(n, 2));
      },
      code: [
        { html: '<span class="code-cm">/* merge / heap / quick (avg) */</span>' },
        { html: '<span class="code-kw">for</span> each of n items {', id: "loop" },
        { html: '  do ~log n work;', id: "body" },
        { html: '}' }
      ],
      note: "<strong>O(n log n)</strong> — efficient comparison sorts live here."
    },
    {
      id: "on2",
      label: "O(n²)",
      color: "#ff8a4a",
      fn: function (n) {
        return n * n;
      },
      code: [
        { html: '<span class="code-kw">for</span> i <span class="code-kw">in</span> <span class="code-num">0</span>..n-1 {', id: "loop" },
        { html: '  <span class="code-kw">for</span> j <span class="code-kw">in</span> <span class="code-num">0</span>..n-1 {', id: "inner" },
        { html: '    compare(a[i], a[j]);', id: "body" },
        { html: '  }' },
        { html: '}' }
      ],
      note: "<strong>O(n²)</strong> — nested loops: double n and work roughly quadruples."
    }
  ];

  function initBigO() {
    var chart = document.getElementById("bigo-chart");
    var legend = document.getElementById("bigo-legend");
    var slider = document.getElementById("bigo-n");
    var nLabel = document.getElementById("bigo-n-label");
    var status = document.getElementById("bigo-status");
    var picked = document.getElementById("bigo-picked");
    var codeRoot = document.getElementById("bigo-code");
    var codeNote = document.getElementById("bigo-code-note");
    var workBar = document.getElementById("bigo-work-bar");
    if (!chart || !slider) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var selected = "on";
    var n = Number(slider.value) || 16;
    var lineEls = {};
    var NS = "http://www.w3.org/2000/svg";

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function classById(id) {
      for (var i = 0; i < CLASSES.length; i++) {
        if (CLASSES[i].id === id) return CLASSES[i];
      }
      return CLASSES[2];
    }

    function renderCode(cls) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      (cls.code || []).forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        var ln = document.createElement("span");
        ln.className = "code-ln";
        ln.textContent = String(i + 1);
        var src = document.createElement("span");
        src.className = "code-src";
        src.innerHTML = line.html || "";
        row.appendChild(ln);
        row.appendChild(src);
        codeRoot.appendChild(row);
      });
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.add("is-active");
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

    function buildLegend() {
      if (!legend) return;
      legend.innerHTML = "";
      CLASSES.forEach(function (cls) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bigo-legend-item" + (cls.id === selected ? " is-active" : "");
        btn.setAttribute("role", "listitem");
        btn.setAttribute("aria-pressed", cls.id === selected ? "true" : "false");
        btn.dataset.id = cls.id;
        btn.innerHTML =
          '<span class="bigo-swatch" style="background:' +
          cls.color +
          '"></span><span>' +
          cls.label +
          "</span>";
        btn.addEventListener("click", function () {
          selectClass(cls.id);
        });
        legend.appendChild(btn);
      });
    }

    function pathFor(cls, maxN, maxY, pad, w, h) {
      var pts = [];
      var steps = 48;
      for (var i = 0; i <= steps; i++) {
        var xN = 2 + ((maxN - 2) * i) / steps;
        var yV = cls.fn(xN);
        var x = pad.l + ((xN - 2) / (maxN - 2)) * w;
        var y = pad.t + h - (yV / maxY) * h;
        pts.push(x.toFixed(1) + "," + y.toFixed(1));
      }
      return "M" + pts.join(" L");
    }

    function drawChart() {
      var maxN = 48;
      var pad = { t: 18, r: 16, b: 36, l: 44 };
      var W = 480;
      var H = 280;
      var w = W - pad.l - pad.r;
      var h = H - pad.t - pad.b;
      var maxY = CLASSES[CLASSES.length - 1].fn(maxN) * 1.05;

      chart.innerHTML = "";

      var gGrid = svgEl("g", { class: "bigo-grid" });
      for (var gi = 0; gi <= 4; gi++) {
        var gy = pad.t + (h * gi) / 4;
        gGrid.appendChild(
          svgEl("line", {
            x1: String(pad.l),
            y1: String(gy),
            x2: String(pad.l + w),
            y2: String(gy),
            class: "bigo-grid-line"
          })
        );
      }
      chart.appendChild(gGrid);

      chart.appendChild(
        svgEl("text", {
          x: String(pad.l + w / 2),
          y: String(H - 6),
          class: "bigo-axis-label",
          "text-anchor": "middle"
        })
      ).textContent = "n →";

      var yLabel = svgEl("text", {
        x: "12",
        y: String(pad.t + h / 2),
        class: "bigo-axis-label",
        "text-anchor": "middle",
        transform: "rotate(-90 12 " + (pad.t + h / 2) + ")"
      });
      yLabel.textContent = "relative cost";
      chart.appendChild(yLabel);

      CLASSES.forEach(function (cls) {
        var path = svgEl("path", {
          d: pathFor(cls, maxN, maxY, pad, w, h),
          class: "bigo-curve" + (cls.id === selected ? " is-selected" : " is-dim"),
          stroke: cls.color,
          fill: "none",
          "data-id": cls.id
        });
        path.addEventListener("click", function () {
          selectClass(cls.id);
        });
        chart.appendChild(path);
      });

      var cls = classById(selected);
      var yV = cls.fn(n);
      var cx = pad.l + ((n - 2) / (maxN - 2)) * w;
      var cy = pad.t + h - (yV / maxY) * h;

      chart.appendChild(
        svgEl("line", {
          x1: String(cx),
          y1: String(pad.t),
          x2: String(cx),
          y2: String(pad.t + h),
          class: "bigo-n-guide"
        })
      );

      var dot = svgEl("circle", {
        cx: String(cx),
        cy: String(cy),
        r: "6",
        class: "bigo-dot" + (reduceMotion ? "" : " is-pulse"),
        fill: cls.color
      });
      chart.appendChild(dot);

      var tag = svgEl("text", {
        x: String(cx + 10),
        y: String(Math.max(pad.t + 12, cy - 10)),
        class: "bigo-dot-label",
        fill: cls.color
      });
      tag.textContent = cls.label + " ≈ " + Math.round(yV);
      chart.appendChild(tag);
    }

    function updateWork(cls) {
      if (!workBar) return;
      var maxY = CLASSES[CLASSES.length - 1].fn(48);
      var ratio = Math.min(1, cls.fn(n) / maxY);
      workBar.style.width = (ratio * 100).toFixed(1) + "%";
      workBar.style.background = cls.color;
      if (!reduceMotion) {
        workBar.classList.remove("is-tick");
        void workBar.offsetWidth;
        workBar.classList.add("is-tick");
      }
    }

    function refresh() {
      var cls = classById(selected);
      if (nLabel) nLabel.textContent = String(n);
      if (picked) {
        picked.textContent = cls.label;
        picked.style.color = cls.color;
      }
      slider.setAttribute("aria-valuenow", String(n));
      buildLegend();
      drawChart();
      renderCode(cls);
      setCodeNote(cls.note);
      updateWork(cls);
      setStatus(
        "At n = " +
          n +
          ", " +
          cls.label +
          " ≈ " +
          Math.round(cls.fn(n)) +
          " relative work units."
      );
    }

    function selectClass(id) {
      selected = id;
      refresh();
    }

    slider.addEventListener("input", function () {
      try {
        n = Number(slider.value) || 2;
        refresh();
      } catch (err) {
        console.error("[learn-bigo] Slider update failed", err);
      }
    });

    refresh();
  }

  try {
    initBigO();
  } catch (err) {
    console.error("[learn-bigo] Init failed", err);
  }
})();
