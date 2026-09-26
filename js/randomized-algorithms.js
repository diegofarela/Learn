/**
 * Random-pivot partition walk (quicksort flavor).
 */
(function () {
  function init() {
    var arrEl = document.getElementById("rand-arr");
    var status = document.getElementById("rand-status");
    var badge = document.getElementById("rand-badge");
    var meta = document.getElementById("rand-meta");
    var code = document.getElementById("rand-code");
    var stepBtn = document.getElementById("rand-step");
    var shuffleBtn = document.getElementById("rand-reshuffle");
    var resetBtn = document.getElementById("rand-reset");
    if (!arrEl) return;

    var arr = [];
    var lo = 0;
    var hi = 0;
    var pivotIdx = -1;
    var pivots = 0;
    var phase = "pick";

    function fresh() {
      arr = [];
      for (var i = 0; i < 10; i++) arr.push(10 + Math.floor(Math.random() * 89));
      lo = 0;
      hi = arr.length - 1;
      pivotIdx = -1;
      pivots = 0;
      phase = "pick";
      render("New array — step to pick a random pivot.");
    }

    function render(msg) {
      arrEl.innerHTML = "";
      arr.forEach(function (v, i) {
        var d = document.createElement("div");
        d.className = "rand-cell";
        if (i === pivotIdx) d.classList.add("is-pivot");
        if (i < lo || i > hi) d.classList.add("is-done");
        d.textContent = String(v);
        arrEl.appendChild(d);
      });
      if (badge) badge.textContent = phase;
      if (meta) meta.textContent = String(pivots);
      if (code) {
        code.textContent =
          "phase: " + phase + "\n" +
          "subarray [" + lo + ".." + hi + "]\n" +
          "pivotIdx=" + pivotIdx + "  pivots=" + pivots;
      }
      if (status && msg) status.textContent = msg;
    }

    function partition(p) {
      var pivot = arr[p];
      var tmp = arr[p];
      arr[p] = arr[hi];
      arr[hi] = tmp;
      var store = lo;
      for (var i = lo; i < hi; i++) {
        if (arr[i] < pivot) {
          tmp = arr[i];
          arr[i] = arr[store];
          arr[store] = tmp;
          store += 1;
        }
      }
      tmp = arr[store];
      arr[store] = arr[hi];
      arr[hi] = tmp;
      return store;
    }

    function step() {
      if (lo >= hi) {
        render("Subarray sorted / size ≤ 1. Reshuffle for another run.");
        phase = "done";
        return;
      }
      if (phase === "pick") {
        pivotIdx = lo + Math.floor(Math.random() * (hi - lo + 1));
        pivots += 1;
        phase = "partition";
        render("Picked pivot " + arr[pivotIdx] + " at index " + pivotIdx + ".");
        return;
      }
      var p = partition(pivotIdx);
      pivotIdx = p;
      // Continue on larger side for demo simplicity
      if (p - lo > hi - p) {
        hi = p - 1;
      } else {
        lo = p + 1;
      }
      pivotIdx = -1;
      phase = "pick";
      render("Partitioned; recurse on [" + lo + ".." + hi + "].");
    }

    if (stepBtn) stepBtn.addEventListener("click", step);
    if (shuffleBtn) shuffleBtn.addEventListener("click", fresh);
    if (resetBtn) resetBtn.addEventListener("click", fresh);
    fresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
