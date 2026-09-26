/**
 * Functional: map/filter/reduce pipeline + immutability demo.
 */
(function () {
  var SRC = [1, 2, 3, 4, 5, 6, 7, 8];

  var CODE_LINES = [
    { html: 'xs = [1,2,3,4,5,6,7,8];', id: "src" },
    { html: 'odds = filter(xs, n =&gt; n % 2);', id: "filter" },
    { html: 'doubled = map(odds, n =&gt; n * 2);', id: "map" },
    { html: 'sum = reduce(doubled, (a,b) =&gt; a+b, 0);', id: "reduce" },
    { html: '<span class="code-cm">/* impure: logCount++ */</span>', id: "side" },
    { html: 'copy = xs.slice(); copy[0] = 99;', id: "copy" },
    { html: 'xs[0] = 99; <span class="code-cm">/* mutate */</span>', id: "mutate" }
  ];

  function initFp() {
    var srcEl = document.getElementById("fp-src");
    var filterEl = document.getElementById("fp-filter");
    var mapEl = document.getElementById("fp-map");
    var reduceEl = document.getElementById("fp-reduce");
    var origEl = document.getElementById("fp-orig");
    var copyEl = document.getElementById("fp-copy");
    var modeLabel = document.getElementById("fp-immut-mode-label");
    var status = document.getElementById("fp-status");
    var badge = document.getElementById("fp-badge");
    var resultEl = document.getElementById("fp-result");
    var impureToggle = document.getElementById("fp-impure");
    var codeRoot = document.getElementById("fp-code");
    var codeNote = document.getElementById("fp-code-note");
    if (!srcEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var list = SRC.slice();
    var logCount = 0;
    var busy = false;
    var lineEls = {};

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
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

    function fillChips(el, values, hotIdx) {
      if (!el) return;
      el.innerHTML = "";
      values.forEach(function (v, i) {
        var chip = document.createElement("span");
        chip.className = "fp-chip" + (hotIdx === i ? " is-hot" : "");
        chip.textContent = String(v);
        el.appendChild(chip);
      });
    }

    function renderLists() {
      fillChips(srcEl, list);
      fillChips(origEl, list);
      if (filterEl) filterEl.innerHTML = "";
      if (mapEl) mapEl.innerHTML = "";
      if (reduceEl) reduceEl.textContent = "—";
      if (copyEl) copyEl.innerHTML = "";
      if (modeLabel) modeLabel.textContent = "after op";
      if (resultEl) resultEl.textContent = "—";
    }

    function sleep(ms) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, reduceMotion ? 0 : ms);
      });
    }

    function runPipeline() {
      if (busy) return;
      busy = true;
      (async function () {
        try {
          var impure = impureToggle && impureToggle.checked;
          highlight("src");
          fillChips(srcEl, list);
          setBadge(impure ? "impure" : "pure");
          setStatus(
            impure
              ? "Impure run: also bumps a shared log counter."
              : "Pure run: only returns a computed value."
          );
          await sleep(350);

          highlight("filter");
          var odds = list.filter(function (n) {
            return n % 2 === 1;
          });
          fillChips(filterEl, odds);
          document.querySelector('[data-stage="filter"]').classList.add("is-active");
          await sleep(400);

          highlight("map");
          var doubled = odds.map(function (n) {
            return n * 2;
          });
          fillChips(mapEl, doubled);
          document.querySelector('[data-stage="map"]').classList.add("is-active");
          await sleep(400);

          highlight("reduce");
          var sum = doubled.reduce(function (a, b) {
            return a + b;
          }, 0);
          if (reduceEl) reduceEl.textContent = String(sum);
          document.querySelector('[data-stage="reduce"]').classList.add("is-active");
          if (resultEl) resultEl.textContent = String(sum);

          if (impure) {
            highlight("side");
            logCount++;
            setCodeNote("Side effect: logCount is now " + logCount + ".");
            setStatus("Sum = " + sum + " · impure logCount = " + logCount + ".");
          } else {
            setCodeNote("Same inputs always yield " + sum + " — no shared state touched.");
            setStatus("Sum of doubled odds = " + sum + ".");
          }
          setBadge("done");
        } catch (err) {
          console.error("[learn-functional] pipeline failed", err);
          setStatus("Demo error — see console.");
        } finally {
          busy = false;
          document.querySelectorAll(".fp-stage-block").forEach(function (n) {
            n.classList.remove("is-active");
          });
        }
      })();
    }

    function doCopy() {
      try {
        var next = list.slice();
        next[0] = 99;
        fillChips(origEl, list);
        fillChips(copyEl, next, 0);
        if (modeLabel) modeLabel.textContent = "copy (changed)";
        highlight("copy");
        setBadge("immutable");
        setCodeNote("slice() then edit — original list unchanged.");
        setStatus("Original stays [" + list.join(",") + "]; copy has 99 at index 0.");
      } catch (err) {
        console.error("[learn-functional] copy failed", err);
      }
    }

    function doMutate() {
      try {
        var before = list.slice();
        list[0] = 99;
        fillChips(origEl, before);
        fillChips(copyEl, list, 0);
        fillChips(srcEl, list);
        if (modeLabel) modeLabel.textContent = "mutated";
        highlight("mutate");
        setBadge("mutated");
        setCodeNote("In-place write — every reference sees the change.");
        setStatus("Mutated in place: list is now [" + list.join(",") + "].");
      } catch (err) {
        console.error("[learn-functional] mutate failed", err);
      }
    }

    function reset() {
      try {
        busy = false;
        list = SRC.slice();
        highlight(null);
        setBadge(impureToggle && impureToggle.checked ? "impure" : "pure");
        setCodeNote("Run the pipeline — each stage lights up.");
        setStatus(
          impureToggle && impureToggle.checked
            ? "Impure mode: pipeline also mutates a shared log counter."
            : "Pure mode: pipeline returns a value without touching outside state."
        );
        renderLists();
      } catch (err) {
        console.error("[learn-functional] reset failed", err);
      }
    }

    if (impureToggle) {
      impureToggle.addEventListener("change", function () {
        setBadge(impureToggle.checked ? "impure" : "pure");
        setStatus(
          impureToggle.checked
            ? "Impure mode: pipeline also mutates a shared log counter."
            : "Pure mode: pipeline returns a value without touching outside state."
        );
      });
    }

    document.querySelectorAll("[data-fp-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-fp-action");
          if (action === "run") runPipeline();
          else if (action === "copy") doCopy();
          else if (action === "mutate") doMutate();
          else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-functional] action failed", err);
        }
      });
    });

    renderCode();
    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFp);
  } else {
    initFp();
  }
})();
