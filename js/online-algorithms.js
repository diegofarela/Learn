/**
 * Online algorithms: ski rental vs offline OPT.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-cm">/* ski rental: rent $1/day or buy $B */</span>', id: "sig" },
    { html: 'owned = false; cost = 0', id: "init" },
    { html: '<span class="code-kw">for</span> day <span class="code-kw">in</span> 1..???:', id: "loop" },
    { html: '  <span class="code-kw">if</span> not owned and should_buy(day):', id: "decide" },
    { html: '    cost += B; owned = true', id: "buy" },
    { html: '  <span class="code-kw">elif</span> not owned:', id: "rent" },
    { html: '    cost += 1', id: "pay" },
    { html: '<span class="code-cm">/* OPT = min(days, B) */</span>', id: "opt" }
  ];

  function initOn() {
    var timeline = document.getElementById("on-timeline");
    var status = document.getElementById("on-status");
    var badge = document.getElementById("on-badge");
    var dayEl = document.getElementById("on-day");
    var costEl = document.getElementById("on-cost");
    var optEl = document.getElementById("on-opt");
    var ratioEl = document.getElementById("on-ratio");
    var bSlider = document.getElementById("on-b");
    var lenSlider = document.getElementById("on-len");
    var bLabel = document.getElementById("on-b-label");
    var codeRoot = document.getElementById("on-code");
    var codeNote = document.getElementById("on-code-note");
    if (!timeline || !bSlider) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var policy = "break";
    var B = Number(bSlider.value) || 4;
    var season = Number(lenSlider.value) || 7;
    var day = 0;
    var cost = 0;
    var owned = false;
    var days = [];
    var lineEls = {};
    var runTimer = null;

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE_LINES.forEach(function (line, i) {
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
        src.innerHTML = line.html;
        row.appendChild(ln);
        row.appendChild(src);
        codeRoot.appendChild(row);
      });
    }

    function highlight(id) {
      Object.keys(lineEls).forEach(function (key) {
        var el = lineEls[key];
        el.classList.toggle("is-active", key === id);
        el.classList.toggle("is-dim", Boolean(id) && key !== id);
      });
    }

    function optCost(len, buy) {
      return Math.min(len, buy);
    }

    function shouldBuy(d) {
      if (policy === "buy") return d === 1;
      if (policy === "rent") return false;
      /* break-even: buy on day B (after B-1 rentals) */
      return d === B;
    }

    function paintTimeline() {
      timeline.innerHTML = "";
      for (var i = 1; i <= season; i++) {
        var cell = document.createElement("div");
        cell.className = "on-day";
        cell.setAttribute("role", "listitem");
        var info = days[i - 1];
        if (!info) {
          cell.classList.add("is-future");
          cell.innerHTML = '<span class="on-day-n">?</span><span class="on-day-act">·</span>';
        } else {
          cell.classList.add(
            info.action === "buy" ? "is-buy" : info.action === "own" ? "is-own" : "is-rent"
          );
          if (info.action === "buy" && !reduceMotion) cell.classList.add("is-pulse");
          cell.innerHTML =
            '<span class="on-day-n">' +
            i +
            '</span><span class="on-day-act">' +
            (info.action === "buy" ? "BUY" : info.action === "own" ? "ski" : "rent") +
            "</span>";
        }
        timeline.appendChild(cell);
      }
    }

    function syncScores() {
      var opt = day === 0 ? 0 : optCost(day, B);
      if (costEl) costEl.textContent = String(cost);
      if (optEl) optEl.textContent = String(opt);
      if (ratioEl) {
        ratioEl.textContent = day === 0 || opt === 0 ? "—" : (cost / opt).toFixed(2);
      }
      if (dayEl) dayEl.textContent = String(day);
      if (bLabel) bLabel.textContent = String(B);
    }

    function reset() {
      if (runTimer) {
        window.clearInterval(runTimer);
        runTimer = null;
      }
      B = Number(bSlider.value) || 4;
      season = Number(lenSlider.value) || 7;
      day = 0;
      cost = 0;
      owned = false;
      days = [];
      paintTimeline();
      syncScores();
      highlight("init");
      if (badge) {
        badge.textContent = "ready";
        badge.dataset.phase = "ready";
      }
      if (codeNote) {
        codeNote.innerHTML =
          policy === "break"
            ? "Break-even buys on day <strong>B</strong> — worst-case ratio 2."
            : policy === "rent"
              ? "Always rent — terrible if the season is long."
              : "Buy immediately — bad if you only ski one day.";
      }
      if (status) {
        status.textContent =
          "B=" + B + ". Season length hidden (" + season + " for OPT). Step day by day.";
      }
    }

    function stepDay() {
      if (day >= season) {
        finish();
        return;
      }
      day += 1;
      highlight("decide");
      var action;
      if (owned) {
        action = "own";
        highlight("loop");
      } else if (shouldBuy(day)) {
        cost += B;
        owned = true;
        action = "buy";
        highlight("buy");
        if (badge) {
          badge.textContent = "buy";
          badge.dataset.phase = "buy";
        }
      } else {
        cost += 1;
        action = "rent";
        highlight("pay");
        if (badge) {
          badge.textContent = "rent";
          badge.dataset.phase = "rent";
        }
      }
      days.push({ action: action, cost: cost });
      paintTimeline();
      syncScores();
      if (codeNote) {
        codeNote.innerHTML =
          "Day <strong>" +
          day +
          "</strong>: " +
          (action === "buy" ? "bought for $" + B : action === "own" ? "already own" : "rented $1") +
          " · online $" +
          cost +
          " · OPT so far $" +
          optCost(day, B) +
          ".";
      }
      if (status) {
        status.textContent =
          "Day " + day + "/" + season + " · online $" + cost + " · OPT $" + optCost(day, B);
      }
      if (day >= season) finish();
    }

    function finish() {
      if (runTimer) {
        window.clearInterval(runTimer);
        runTimer = null;
      }
      var opt = optCost(season, B);
      var ratio = opt === 0 ? 0 : cost / opt;
      highlight("opt");
      if (badge) {
        badge.textContent = "done";
        badge.dataset.phase = "done";
      }
      if (codeNote) {
        codeNote.innerHTML =
          "Season ended. Online <strong>$" +
          cost +
          "</strong> vs OPT <strong>$" +
          opt +
          "</strong> (ratio " +
          ratio.toFixed(2) +
          ").";
      }
      if (status) {
        status.textContent =
          "Done. Competitive ratio on this instance: " + ratio.toFixed(2) + ".";
      }
      syncScores();
    }

    function runSeason() {
      if (day >= season) {
        reset();
      }
      if (runTimer) return;
      runTimer = window.setInterval(
        function () {
          if (day >= season) {
            window.clearInterval(runTimer);
            runTimer = null;
            return;
          }
          stepDay();
        },
        reduceMotion ? 60 : 280
      );
    }

    renderCode();
    reset();

    bSlider.addEventListener("input", reset);
    lenSlider.addEventListener("input", reset);

    document.querySelectorAll("[data-on-policy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        policy = btn.getAttribute("data-on-policy");
        document.querySelectorAll("[data-on-policy]").forEach(function (b) {
          b.classList.toggle("is-selected", b === btn);
        });
        reset();
      });
    });

    document.querySelectorAll("[data-on-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-on-action");
        if (action === "step") stepDay();
        else if (action === "run") runSeason();
        else if (action === "reset") reset();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOn);
  } else {
    initOn();
  }
})();
