/**
 * Combinatorics: interactive C(n,k) with sliders.
 */
(function () {
  function factorial(n) {
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  }

  function choose(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    k = Math.min(k, n - k);
    var r = 1;
    for (var i = 1; i <= k; i++) {
      r = (r * (n - k + i)) / i;
    }
    return Math.round(r);
  }

  function initComb() {
    var nSlider = document.getElementById("comb-n");
    var kSlider = document.getElementById("comb-k");
    var nVal = document.getElementById("comb-n-val");
    var kVal = document.getElementById("comb-k-val");
    var metaN = document.getElementById("comb-meta-n");
    var metaK = document.getElementById("comb-meta-k");
    var metaVal = document.getElementById("comb-meta-val");
    var badge = document.getElementById("comb-badge");
    var universe = document.getElementById("comb-universe");
    var formula = document.getElementById("comb-formula");
    var status = document.getElementById("comb-status");
    var codeRoot = document.getElementById("comb-code");
    var codeNote = document.getElementById("comb-code-note");
    if (!nSlider || !kSlider || !universe) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function refresh() {
      var n = Number(nSlider.value) || 1;
      var k = Number(kSlider.value) || 0;
      if (k > n) {
        k = n;
        kSlider.value = String(k);
      }
      kSlider.max = String(n);
      kSlider.setAttribute("aria-valuemax", String(n));
      nSlider.setAttribute("aria-valuenow", String(n));
      kSlider.setAttribute("aria-valuenow", String(k));

      if (nVal) nVal.textContent = String(n);
      if (kVal) kVal.textContent = String(k);
      if (metaN) metaN.textContent = String(n);
      if (metaK) metaK.textContent = String(k);

      var c = choose(n, k);
      if (metaVal) metaVal.textContent = String(c);
      if (badge) badge.textContent = "C(" + n + "," + k + ")=" + c;

      universe.innerHTML = "";
      for (var i = 0; i < n; i++) {
        var chip = document.createElement("span");
        chip.className = "comb-chip";
        chip.textContent = String(i + 1);
        if (i < k) {
          chip.classList.add("is-picked");
          if (!reduceMotion) chip.classList.add("is-pulse");
        }
        universe.appendChild(chip);
      }

      if (formula) {
        formula.innerHTML =
          "C(" +
          n +
          "," +
          k +
          ") = " +
          n +
          "! / (" +
          k +
          "! · " +
          (n - k) +
          "!) = <strong>" +
          c +
          "</strong>";
      }

      if (codeRoot) {
        var pascal =
          k > 0 && k < n
            ? "C(" +
              (n - 1) +
              "," +
              (k - 1) +
              ") + C(" +
              (n - 1) +
              "," +
              k +
              ") = " +
              choose(n - 1, k - 1) +
              " + " +
              choose(n - 1, k) +
              " = " +
              c
            : "edge: C(n,0)=C(n,n)=1";
        var lines = [
          "C(n,k) = n! / (k!(n-k)!)",
          "P(n,k) = n! / (n-k)! = " +
            (k <= n ? Math.round(factorial(n) / factorial(n - k)) : 0),
          "Pascal: " + pascal,
          "2^n = Σ C(n,i) = " + Math.pow(2, n)
        ];
        codeRoot.innerHTML = "";
        lines.forEach(function (text, idx) {
          var row = document.createElement("div");
          row.className = "code-line" + (idx === 0 ? " is-active" : "");
          var ln = document.createElement("span");
          ln.className = "code-ln";
          ln.textContent = String(idx + 1);
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
          "<strong>C(" +
          n +
          "," +
          k +
          ")</strong> — " +
          c +
          " unordered subsets of size " +
          k +
          ".";
      }

      setStatus(
        "C(" +
          n +
          "," +
          k +
          ") = " +
          c +
          " ways to choose " +
          k +
          " from " +
          n +
          " (order ignored)."
      );
    }

    nSlider.addEventListener("input", function () {
      try {
        refresh();
      } catch (err) {
        console.error("[learn-comb] n slider failed", err);
      }
    });
    kSlider.addEventListener("input", function () {
      try {
        refresh();
      } catch (err) {
        console.error("[learn-comb] k slider failed", err);
      }
    });

    refresh();
  }

  try {
    initComb();
  } catch (err) {
    console.error("[learn-comb] Init failed", err);
  }
})();
