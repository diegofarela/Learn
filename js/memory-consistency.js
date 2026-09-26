/**
 * Memory consistency litmus: SC vs weak store-buffer outcomes.
 */
(function () {
  var OUTCOMES = [
    { key: "01", label: "(0, 1)", sc: true, weak: true },
    { key: "10", label: "(1, 0)", sc: true, weak: true },
    { key: "11", label: "(1, 1)", sc: true, weak: true },
    { key: "00", label: "(0, 0)", sc: false, weak: true }
  ];

  var CODE_LINES = [
    { html: '<span class="code-cm">/* initially x = y = 0 */</span>' },
    { html: '<span class="code-kw">Core0:</span>  x = 1;  r1 = y;', id: "c0" },
    { html: '<span class="code-kw">Core1:</span>  y = 1;  r2 = x;', id: "c1" },
    { html: '<span class="code-cm">/* observe (r1, r2) */</span>', id: "obs" }
  ];

  function initMc() {
    var cores = document.getElementById("mc-cores");
    var outcomes = document.getElementById("mc-outcomes");
    var modelEl = document.getElementById("mc-model");
    var status = document.getElementById("mc-status");
    var badgeLabel = document.getElementById("mc-model-label");
    var codeRoot = document.getElementById("mc-code");
    var codeNote = document.getElementById("mc-code-note");
    if (!cores || !outcomes || !modelEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var timers = [];
    var lineEls = {};
    var lastResult = null;

    function clearTimers() {
      timers.forEach(function (t) {
        window.clearTimeout(t);
      });
      timers = [];
    }

    function after(ms, fn) {
      if (reduceMotion) {
        fn();
        return;
      }
      timers.push(window.setTimeout(fn, ms));
    }

    function model() {
      return modelEl.value === "weak" ? "weak" : "sc";
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function updateModelLabel() {
      if (badgeLabel) badgeLabel.textContent = model() === "sc" ? "SC" : "weak";
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

    function paintCores(state) {
      cores.innerHTML = "";
      [
        {
          name: "Core 0",
          ops: "x=1; r1=y",
          val: state.r1 != null ? "r1 = " + state.r1 : "r1 = ?",
          active: state.focus === "c0"
        },
        {
          name: "Core 1",
          ops: "y=1; r2=x",
          val: state.r2 != null ? "r2 = " + state.r2 : "r2 = ?",
          active: state.focus === "c1"
        }
      ].forEach(function (c) {
        var el = document.createElement("div");
        el.className = "mc-core" + (c.active ? " is-active" : "");
        el.innerHTML =
          '<span class="mc-core-name">' +
          c.name +
          '</span><span class="mc-core-ops">' +
          c.ops +
          '</span><span class="mc-core-val">' +
          c.val +
          "</span>";
        cores.appendChild(el);
      });
    }

    function paintOutcomes(resultKey) {
      outcomes.innerHTML = "";
      var m = model();
      OUTCOMES.forEach(function (o) {
        var allowed = m === "sc" ? o.sc : o.weak;
        var el = document.createElement("button");
        el.type = "button";
        el.className = "mc-outcome";
        if (!allowed) el.classList.add("is-forbidden");
        if (resultKey === o.key) el.classList.add("is-hit");
        if (allowed) el.classList.add("is-allowed");
        el.innerHTML =
          '<span class="mc-outcome-pair">' +
          o.label +
          '</span><span class="mc-outcome-tag">' +
          (allowed ? "allowed" : "forbidden") +
          "</span>";
        el.disabled = true;
        outcomes.appendChild(el);
      });
    }

    function pickResult() {
      var m = model();
      var pool = OUTCOMES.filter(function (o) {
        return m === "sc" ? o.sc : o.weak;
      });
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function reset() {
      clearTimers();
      busy = false;
      lastResult = null;
      updateModelLabel();
      paintCores({ r1: null, r2: null, focus: null });
      paintOutcomes(null);
      setStatus("Pick a model, then run. Under SC, (0,0) is impossible.");
      setNote("Initially <strong>x = y = 0</strong>. Each core stores then loads.");
      renderCode();
      highlight(null);
    }

    function run() {
      if (busy) return;
      busy = true;
      clearTimers();
      updateModelLabel();
      var pick = pickResult();
      lastResult = pick;

      paintCores({ r1: null, r2: null, focus: "c0" });
      paintOutcomes(null);
      highlight("c0");
      setStatus("Core 0 stores x=1, then loads y…");
      setNote("<strong>Core 0</strong> write then read.");

      after(reduceMotion ? 0 : 550, function () {
        paintCores({ r1: null, r2: null, focus: "c1" });
        highlight("c1");
        setStatus("Core 1 stores y=1, then loads x…");
        setNote("<strong>Core 1</strong> write then read (concurrent).");
      });

      after(reduceMotion ? 0 : 1100, function () {
        var r1 = pick.key[0] === "0" ? 0 : 1;
        var r2 = pick.key[1] === "0" ? 0 : 1;
        paintCores({ r1: r1, r2: r2, focus: null });
        paintOutcomes(pick.key);
        highlight("obs");
        var m = model();
        if (pick.key === "00") {
          setStatus(
            "Observed (0,0) — both loads missed the other’s store. Allowed only under a weak model."
          );
          setNote("<strong>(0,0)</strong>: store buffers / reordering can hide stores.");
        } else {
          setStatus(
            "Observed " +
              pick.label +
              " — allowed under " +
              (m === "sc" ? "sequential consistency" : "the weak model") +
              "."
          );
          setNote("Result <strong>" + pick.label + "</strong> fits an allowed interleaving.");
        }
        busy = false;
      });
    }

    modelEl.addEventListener("change", function () {
      updateModelLabel();
      paintOutcomes(lastResult ? lastResult.key : null);
      setStatus(
        model() === "sc"
          ? "SC: one global order — (0,0) is forbidden."
          : "Weak: store buffers can yield (0,0)."
      );
    });

    document.querySelectorAll("[data-mc-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-mc-action");
        if (action === "reset") reset();
        else if (action === "run") run();
      });
    });

    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMc);
  } else {
    initMc();
  }
})();
