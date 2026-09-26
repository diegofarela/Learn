/**
 * Strategy / Observer live demos.
 */
(function () {
  var ITEMS = ["pear", "fig", "apple", "kiwi", "mango"];

  var STRATEGIES = {
    alpha: function (a, b) {
      return a.localeCompare(b);
    },
    length: function (a, b) {
      return a.length - b.length || a.localeCompare(b);
    },
    reverse: function (a, b) {
      return b.localeCompare(a);
    }
  };

  function initDpat() {
    var patternEl = document.getElementById("dpat-pattern");
    var status = document.getElementById("dpat-status");
    var meta = document.getElementById("dpat-meta");
    var strategyPane = document.getElementById("dpat-strategy");
    var observerPane = document.getElementById("dpat-observer");
    var algoEl = document.getElementById("dpat-algo");
    var listEl = document.getElementById("dpat-list");
    var subjectVal = document.getElementById("dpat-subject-val");
    var obsRow = document.getElementById("dpat-obs-row");
    var codeRoot = document.getElementById("dpat-code");
    var codeNote = document.getElementById("dpat-code-note");
    var codeLang = document.getElementById("dpat-code-lang");
    if (!patternEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var observers = [
      { id: "log", label: "Logger", last: "—" },
      { id: "ui", label: "UI badge", last: "—" },
      { id: "metrics", label: "Metrics", last: "—" }
    ];
    var eventN = 0;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function renderStrategyCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      [
        "context.setStrategy(algo)",
        "context.sort(items)",
        "// caller unchanged when algo swaps"
      ].forEach(function (line) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.textContent = line;
        codeRoot.appendChild(row);
      });
    }

    function renderObserverCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      [
        "subject.subscribe(obs)",
        "subject.setState(x)",
        "→ obs.update(x) for each"
      ].forEach(function (line) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.textContent = line;
        codeRoot.appendChild(row);
      });
    }

    function paintList(items) {
      if (!listEl) return;
      listEl.innerHTML = "";
      items.forEach(function (item) {
        var chip = document.createElement("span");
        chip.className = "dpat-chip";
        chip.textContent = item;
        listEl.appendChild(chip);
      });
    }

    function paintObservers() {
      if (!obsRow) return;
      obsRow.innerHTML = "";
      observers.forEach(function (o) {
        var card = document.createElement("div");
        card.className = "dpat-obs";
        card.innerHTML =
          '<span class="dpat-obs-label"></span><span class="dpat-obs-last"></span>';
        card.querySelector(".dpat-obs-label").textContent = o.label;
        card.querySelector(".dpat-obs-last").textContent = o.last;
        obsRow.appendChild(card);
      });
    }

    function applyStrategy() {
      var algo = (algoEl && algoEl.value) || "alpha";
      var sorted = ITEMS.slice().sort(STRATEGIES[algo] || STRATEGIES.alpha);
      paintList(sorted);
      setStatus("Strategy “" + algo + "” sorted the list.");
      if (codeNote) codeNote.textContent = "Swap behavior without rewriting the caller.";
    }

    function notify() {
      eventN += 1;
      var msg = "event #" + eventN;
      if (subjectVal) subjectVal.textContent = msg;
      observers.forEach(function (o) {
        o.last = msg;
      });
      paintObservers();
      if (!reduceMotion && obsRow) {
        obsRow.querySelectorAll(".dpat-obs").forEach(function (el) {
          el.classList.remove("is-flash");
          void el.offsetWidth;
          el.classList.add("is-flash");
        });
      }
      setStatus("Observer: subject published “" + msg + "” to " + observers.length + " listeners.");
      if (codeNote) codeNote.textContent = "Dependents react without the subject knowing who.";
    }

    function syncMode() {
      var isStrategy = patternEl.value === "strategy";
      if (meta) meta.textContent = isStrategy ? "strategy" : "observer";
      if (codeLang) codeLang.textContent = isStrategy ? "Strategy" : "Observer";
      if (strategyPane) strategyPane.hidden = !isStrategy;
      if (observerPane) observerPane.hidden = isStrategy;
      if (isStrategy) {
        renderStrategyCode();
        applyStrategy();
        setStatus("Strategy: context delegates sorting to the selected algorithm.");
      } else {
        renderObserverCode();
        paintObservers();
        if (subjectVal) subjectVal.textContent = "idle";
        setStatus("Observer: press Notify to fan out a state change.");
      }
    }

    document.querySelectorAll("[data-dpat-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-dpat-action");
        if (a === "run") {
          if (patternEl.value === "strategy") applyStrategy();
          else notify();
        } else if (a === "reset") {
          eventN = 0;
          observers.forEach(function (o) {
            o.last = "—";
          });
          if (algoEl) algoEl.value = "alpha";
          syncMode();
        }
      });
    });

    if (algoEl) {
      algoEl.addEventListener("change", function () {
        if (patternEl.value === "strategy") applyStrategy();
      });
    }

    patternEl.addEventListener("change", syncMode);
    syncMode();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDpat);
  } else {
    initDpat();
  }
})();
