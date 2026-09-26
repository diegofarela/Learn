/**
 * Parallelism: split array sum across 2–4 workers.
 */
(function () {
  var DATA = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8];

  var CODE_LINES = [
    { html: 'chunks = split(array, N);', id: "split" },
    { html: 'partials = parallel_map(chunks, sum);', id: "map" },
    { html: 'total = reduce(partials, +);', id: "reduce" },
    { html: '<span class="code-cm">/* workers run same wall-clock time */</span>', id: "note" }
  ];

  function initPar() {
    var arrayEl = document.getElementById("par-array");
    var workersEl = document.getElementById("par-workers");
    var totalEl = document.getElementById("par-total");
    var sumMeta = document.getElementById("par-sum");
    var status = document.getElementById("par-status");
    var badge = document.getElementById("par-badge");
    var nSelect = document.getElementById("par-n");
    var codeRoot = document.getElementById("par-code");
    var codeNote = document.getElementById("par-code-note");
    if (!arrayEl || !workersEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var lineEls = {};

    function workerCount() {
      var n = nSelect ? parseInt(nSelect.value, 10) : 4;
      if (isNaN(n) || n < 2) n = 2;
      if (n > 4) n = 4;
      return n;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function setTotal(n) {
      if (totalEl) totalEl.textContent = String(n);
      if (sumMeta) sumMeta.textContent = String(n);
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE_LINES.forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        row.innerHTML = line.html || "&nbsp;";
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        codeRoot.appendChild(row);
      });
    }

    function highlight(id) {
      Object.keys(lineEls).forEach(function (k) {
        lineEls[k].classList.remove("is-active");
      });
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function chunkRanges(n) {
      var size = Math.ceil(DATA.length / n);
      var ranges = [];
      for (var i = 0; i < n; i++) {
        var start = i * size;
        var end = Math.min(DATA.length, start + size);
        if (start < end) ranges.push({ start: start, end: end, id: i });
      }
      return ranges;
    }

    function renderIdle() {
      var n = workerCount();
      var ranges = chunkRanges(n);
      arrayEl.innerHTML = "";
      DATA.forEach(function (v, i) {
        var cell = document.createElement("span");
        cell.className = "par-cell";
        var owner = 0;
        for (var r = 0; r < ranges.length; r++) {
          if (i >= ranges[r].start && i < ranges[r].end) {
            owner = ranges[r].id;
            break;
          }
        }
        cell.dataset.worker = String(owner);
        cell.textContent = String(v);
        arrayEl.appendChild(cell);
      });

      workersEl.innerHTML = "";
      ranges.forEach(function (range) {
        var w = document.createElement("div");
        w.className = "par-worker";
        w.dataset.wid = String(range.id);
        w.innerHTML =
          '<span class="par-worker-name">W' +
          (range.id + 1) +
          "</span>" +
          '<span class="par-worker-slice">[' +
          range.start +
          ".." +
          (range.end - 1) +
          "]</span>" +
          '<span class="par-worker-partial" data-partial>—</span>';
        workersEl.appendChild(w);
      });
      setTotal(0);
    }

    function sleep(ms) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, reduceMotion ? 0 : ms);
      });
    }

    function runParallel() {
      if (busy) return;
      busy = true;
      (async function () {
        try {
          renderIdle();
          var ranges = chunkRanges(workerCount());
          highlight("split");
          setBadge("split");
          setStatus("Split into " + ranges.length + " chunks.");
          await sleep(350);

          highlight("map");
          setBadge("parallel");
          setStatus("Workers summing slices at the same time…");
          document.querySelectorAll(".par-cell").forEach(function (c) {
            c.classList.add("is-active");
          });
          document.querySelectorAll(".par-worker").forEach(function (w) {
            w.classList.add("is-running");
          });

          var partials = ranges.map(function (range) {
            var s = 0;
            for (var i = range.start; i < range.end; i++) s += DATA[i];
            return s;
          });

          await sleep(600);

          ranges.forEach(function (range, idx) {
            var node = workersEl.querySelector(
              '.par-worker[data-wid="' + range.id + '"] [data-partial]'
            );
            if (node) node.textContent = String(partials[idx]);
          });
          document.querySelectorAll(".par-worker").forEach(function (w) {
            w.classList.remove("is-running");
            w.classList.add("is-done");
          });
          await sleep(300);

          highlight("reduce");
          var total = partials.reduce(function (a, b) {
            return a + b;
          }, 0);
          setTotal(total);
          setBadge("merged");
          highlight("note");
          setCodeNote("Partials merged — true parallel wall-clock work, then reduce.");
          setStatus("Combined sum = " + total + " (expected " + DATA.reduce(function (a, b) {
            return a + b;
          }, 0) + ").");
          document.querySelectorAll(".par-cell").forEach(function (c) {
            c.classList.remove("is-active");
            c.classList.add("is-done");
          });
        } catch (err) {
          console.error("[learn-parallelism] run failed", err);
          setStatus("Demo error — see console.");
        } finally {
          busy = false;
        }
      })();
    }

    function reset() {
      try {
        busy = false;
        highlight(null);
        setBadge("idle");
        setCodeNote("Run — watch slices light up together.");
        setStatus("Workers sum their slices at the same time, then results merge.");
        renderIdle();
      } catch (err) {
        console.error("[learn-parallelism] reset failed", err);
      }
    }

    if (nSelect) {
      nSelect.addEventListener("change", function () {
        if (!busy) reset();
      });
    }

    document.querySelectorAll("[data-par-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-par-action");
          if (action === "run") runParallel();
          else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-parallelism] action failed", err);
        }
      });
    });

    renderCode();
    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPar);
  } else {
    initPar();
  }
})();
