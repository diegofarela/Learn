/**
 * Table scan vs B-tree index lookup for key 42.
 */
(function () {
  var KEYS = [7, 12, 19, 23, 31, 42, 55, 61, 70];
  var TARGET = 42;

  /* Simple 2-level B-tree intuition: root pivots → leaves */
  var TREE = {
    root: [23, 55],
    leaves: [
      { range: "<23", keys: [7, 12, 19] },
      { range: "23…54", keys: [23, 31, 42] },
      { range: "≥55", keys: [55, 61, 70] }
    ]
  };

  function initIdx() {
    var modeEl = document.getElementById("idx-mode");
    var heap = document.getElementById("idx-heap");
    var tree = document.getElementById("idx-tree");
    var status = document.getElementById("idx-status");
    var meta = document.getElementById("idx-meta");
    var codeRoot = document.getElementById("idx-code");
    var codeLang = document.getElementById("idx-code-lang");
    var codeNote = document.getElementById("idx-code-note");
    if (!modeEl || !heap) return;

    var step = 0;
    var playTimer = null;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function mode() {
      return modeEl.value === "index" ? "index" : "scan";
    }

    function maxSteps() {
      return mode() === "scan" ? KEYS.length + 1 : 4;
    }

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lines.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className =
          "code-line" +
          (src.indexOf("#") === 0 ? " is-dim" : i === lines.length - 1 ? " is-active" : "");
        el.innerHTML =
          '<span class="code-ln">' +
          (i + 1) +
          '</span><span class="code-src">' +
          src +
          "</span>";
        codeRoot.appendChild(el);
      });
    }

    function paint() {
      var m = mode();
      if (meta) meta.textContent = String(Math.max(0, step));
      if (codeLang) codeLang.textContent = m === "scan" ? "seq scan" : "index";

      heap.innerHTML = "";
      KEYS.forEach(function (k, i) {
        var cell = document.createElement("span");
        cell.className = "idx-row";
        cell.textContent = String(k);
        if (m === "scan") {
          if (step > 0 && i < step - 1) cell.classList.add("is-checked");
          if (step > 0 && i === step - 1) {
            cell.classList.add(k === TARGET ? "is-hit" : "is-probe");
          }
          if (step > KEYS.indexOf(TARGET) + 1 && k === TARGET) {
            cell.classList.add("is-hit");
          }
        } else if (step >= 3 && k === TARGET) {
          cell.classList.add("is-hit");
        }
        heap.appendChild(cell);
      });

      if (tree) {
        tree.innerHTML = "";
        tree.classList.toggle("is-visible", m === "index");
        if (m === "index") {
          var root = document.createElement("div");
          root.className = "idx-node idx-node--root";
          if (step === 1) root.classList.add("is-probe");
          if (step > 1) root.classList.add("is-path");
          root.textContent = TREE.root.join(" | ");
          tree.appendChild(root);

          var leaves = document.createElement("div");
          leaves.className = "idx-leaves";
          TREE.leaves.forEach(function (leaf, li) {
            var n = document.createElement("div");
            n.className = "idx-node";
            n.innerHTML =
              '<span class="idx-leaf-range">' +
              leaf.range +
              "</span><span>" +
              leaf.keys.join(", ") +
              "</span>";
            var targetLeaf = 1;
            if (step === 2 && li === targetLeaf) n.classList.add("is-probe");
            if (step >= 3 && li === targetLeaf) n.classList.add("is-hit");
            if (step > 1 && li === targetLeaf) n.classList.add("is-path");
            leaves.appendChild(n);
          });
          tree.appendChild(leaves);
        }
      }

      if (m === "scan") {
        if (step === 0) {
          if (status) status.textContent = "Table scan ready — will check rows left → right.";
          renderCode(["# Seq Scan on heap", "FOR EACH row: compare key"]);
        } else if (step <= KEYS.length) {
          var k = KEYS[step - 1];
          if (status) {
            status.textContent =
              k === TARGET
                ? "Found 42 after " + step + " row check(s)."
                : "Checked " + k + " — not 42, continue.";
          }
          renderCode([
            "scan row key = " + k,
            k === TARGET ? "MATCH → return row" : "no match → next row"
          ]);
        }
      } else {
        if (step === 0) {
          if (status) status.textContent = "Index ready — descend the B-tree for key 42.";
          renderCode(["# Index Scan on btree(key)", "seek key = 42"]);
        } else if (step === 1) {
          if (status) status.textContent = "Root: 42 is between 23 and 55 → middle child.";
          renderCode(["read root pivots [23, 55]", "42 ∈ [23, 55) → leaf 1"]);
        } else if (step === 2) {
          if (status) status.textContent = "Leaf holds 23, 31, 42 — probe the leaf.";
          renderCode(["open leaf 23…54", "binary search leaf keys"]);
        } else {
          if (status) status.textContent = "Hit 42 in 3 probes — then fetch the heap row.";
          renderCode(["leaf key 42 → row pointer", "fetch heap tuple"]);
        }
      }

      if (codeNote) {
        codeNote.innerHTML =
          m === "scan"
            ? "Scan cost grows with <strong>table size</strong>."
            : "Index cost grows with <strong>tree height</strong> (~log n).";
      }
    }

    function go(next) {
      step = Math.max(0, Math.min(maxSteps() - 1, next));
      /* for scan, allow landing on found step */
      if (mode() === "scan") {
        var foundAt = KEYS.indexOf(TARGET) + 1;
        step = Math.max(0, Math.min(foundAt, next));
      }
      paint();
    }

    function stepOnce() {
      var max =
        mode() === "scan" ? KEYS.indexOf(TARGET) + 1 : maxSteps() - 1;
      if (step >= max) {
        go(0);
        go(1);
        return;
      }
      go(step + 1);
    }

    function play() {
      clearPlay();
      if (step > 0 && step >= (mode() === "scan" ? KEYS.indexOf(TARGET) + 1 : 3)) {
        go(0);
      }
      function tick() {
        var max = mode() === "scan" ? KEYS.indexOf(TARGET) + 1 : 3;
        if (step >= max) {
          clearPlay();
          return;
        }
        stepOnce();
        playTimer = setTimeout(tick, reduceMotion ? 0 : 600);
      }
      tick();
    }

    modeEl.addEventListener("change", function () {
      try {
        clearPlay();
        go(0);
      } catch (err) {
        console.error("[learn-idx] Mode failed", err);
      }
    });

    document.querySelectorAll("[data-idx-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-idx-action");
          clearPlay();
          if (action === "reset") go(0);
          else if (action === "step") stepOnce();
          else if (action === "play") play();
        } catch (err) {
          console.error("[learn-idx] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    initIdx();
  } catch (err) {
    console.error("[learn-idx] Init failed", err);
  }
})();
