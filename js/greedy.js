/**
 * Interactive greedy demo: US coin change for 41¢.
 */
(function () {
  var AMOUNT = 41;
  var DENOMS = [
    { value: 25, label: "25¢", name: "quarter" },
    { value: 10, label: "10¢", name: "dime" },
    { value: 5, label: "5¢", name: "nickel" },
    { value: 1, label: "1¢", name: "penny" }
  ];

  var CODE_LINES = [
    { html: '<span class="code-type">void</span> <span class="code-fn">make_change</span>(<span class="code-type">int</span> amount) {', id: "sig" },
    { html: '  <span class="code-type">int</span> coins[] = {<span class="code-num">25</span>, <span class="code-num">10</span>, <span class="code-num">5</span>, <span class="code-num">1</span>};', id: "coins" },
    { html: '  <span class="code-type">int</span> i = <span class="code-num">0</span>;', id: "idx" },
    { blank: true },
    { html: '  <span class="code-kw">while</span> (amount &gt; <span class="code-num">0</span>) {', id: "while" },
    { html: '    <span class="code-kw">while</span> (coins[i] &gt; amount) i++;', id: "skip" },
    { html: '    <span class="code-cm">/* greedy: take largest that fits */</span>', id: "pick" },
    { html: '    amount -= coins[i];', id: "subtract" },
    { html: '    <span class="code-cm">/* emit coin */</span>', id: "emit" },
    { html: '  }' },
    { html: '}' }
  ];

  function buildScript() {
    var steps = [];
    var remaining = AMOUNT;
    var chosen = [];
    var i = 0;

    steps.push({
      kind: "init",
      line: "coins",
      phase: "init",
      note: "Denominations sorted largest-first: 25, 10, 5, 1.",
      status: "Start with " + AMOUNT + "¢ to make.",
      remaining: remaining,
      chosen: [],
      focus: -1,
      count: 0
    });

    while (remaining > 0) {
      steps.push({
        kind: "while",
        line: "while",
        phase: "loop",
        note: "Still owe <strong>" + remaining + "¢</strong>.",
        status: "Remaining: " + remaining + "¢.",
        remaining: remaining,
        chosen: chosen.slice(),
        focus: -1,
        count: chosen.length
      });

      while (i < DENOMS.length && DENOMS[i].value > remaining) {
        steps.push({
          kind: "skip",
          line: "skip",
          phase: "skip",
          note:
            "<strong>" +
            DENOMS[i].label +
            "</strong> is larger than " +
            remaining +
            "¢ — skip.",
          status: "Skip " + DENOMS[i].name + " (" + DENOMS[i].label + ").",
          remaining: remaining,
          chosen: chosen.slice(),
          focus: i,
          count: chosen.length
        });
        i += 1;
      }

      if (i >= DENOMS.length) break;

      var coin = DENOMS[i];
      steps.push({
        kind: "pick",
        line: "pick",
        phase: "pick",
        note:
          "Greedy choice: take a <strong>" +
          coin.name +
          "</strong> (" +
          coin.label +
          ").",
        status: "Pick " + coin.name + ".",
        remaining: remaining,
        chosen: chosen.slice(),
        focus: i,
        count: chosen.length,
        pulse: true
      });

      remaining -= coin.value;
      chosen.push(coin.value);
      steps.push({
        kind: "subtract",
        line: "subtract",
        phase: "take",
        note:
          "amount -= " +
          coin.value +
          " → remaining <strong>" +
          remaining +
          "¢</strong>.",
        status: "Subtract " + coin.value + "¢. Left: " + remaining + "¢.",
        remaining: remaining,
        chosen: chosen.slice(),
        focus: i,
        count: chosen.length
      });

      steps.push({
        kind: "emit",
        line: "emit",
        phase: "take",
        note: "Emit coin · till has " + chosen.length + " coin(s).",
        status: "Coins so far: [" + chosen.join(", ") + "].",
        remaining: remaining,
        chosen: chosen.slice(),
        focus: i,
        count: chosen.length
      });
    }

    steps.push({
      kind: "done",
      line: "sig",
      phase: "done",
      note:
        "Done — <strong>" +
        chosen.length +
        " coins</strong>: " +
        chosen.map(function (c) {
          return c + "¢";
        }).join(" + ") +
        ".",
      status: "Optimal for US coins: " + chosen.join(" + ") + " = " + AMOUNT + "¢.",
      remaining: 0,
      chosen: chosen.slice(),
      focus: -1,
      count: chosen.length
    });

    return steps;
  }

  function initGreedy() {
    var denomsRoot = document.getElementById("greedy-denoms");
    var chosenRoot = document.getElementById("greedy-chosen");
    var remainEl = document.getElementById("greedy-remain");
    var coinsEl = document.getElementById("greedy-coins");
    var status = document.getElementById("greedy-status");
    var phaseEl = document.getElementById("greedy-phase");
    var codeRoot = document.getElementById("greedy-code");
    var codeNote = document.getElementById("greedy-code-note");
    if (!denomsRoot || !chosenRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var steps = buildScript();
    var index = -1;
    var busy = false;
    var playing = false;
    var playTimer = null;
    var lineEls = {};
    var denomEls = [];

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function setPhase(label) {
      if (!phaseEl) return;
      phaseEl.textContent = label;
      phaseEl.dataset.phase = label;
    }

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
        if (line.blank) row.dataset.blank = "1";
        var ln = document.createElement("span");
        ln.className = "code-ln";
        ln.textContent = String(i + 1);
        var src = document.createElement("span");
        src.className = "code-src";
        src.innerHTML = line.blank ? "" : line.html;
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
      var active = id && lineEls[id];
      if (active && typeof active.scrollIntoView === "function") {
        try {
          active.scrollIntoView({
            block: "nearest",
            behavior: reduceMotion ? "auto" : "smooth"
          });
        } catch (err) {}
      }
    }

    function paintDenoms() {
      denomsRoot.innerHTML = "";
      denomEls = [];
      DENOMS.forEach(function (d, i) {
        var btn = document.createElement("div");
        btn.className = "greedy-denom";
        btn.setAttribute("role", "listitem");
        btn.dataset.index = String(i);
        btn.innerHTML =
          '<span class="greedy-denom-val">' +
          d.label +
          '</span><span class="greedy-denom-name">' +
          d.name +
          "</span>";
        denomsRoot.appendChild(btn);
        denomEls.push(btn);
      });
    }

    function paintChosen(chosen) {
      chosenRoot.innerHTML = "";
      if (!chosen || !chosen.length) {
        var empty = document.createElement("span");
        empty.className = "greedy-empty";
        empty.textContent = "none yet";
        chosenRoot.appendChild(empty);
        return;
      }
      chosen.forEach(function (v) {
        var chip = document.createElement("span");
        chip.className = "greedy-chip";
        chip.setAttribute("role", "listitem");
        chip.textContent = v + "¢";
        chosenRoot.appendChild(chip);
      });
    }

    function applyState(step) {
      if (remainEl) remainEl.textContent = String(step.remaining);
      if (coinsEl) coinsEl.textContent = String(step.count);
      denomEls.forEach(function (el, i) {
        el.classList.toggle("is-focus", step.focus === i);
        el.classList.toggle("is-skip", step.kind === "skip" && step.focus === i);
        el.classList.toggle(
          "is-pick",
          (step.kind === "pick" || step.kind === "subtract" || step.kind === "emit") &&
            step.focus === i
        );
        if (step.pulse && step.focus === i && !reduceMotion) {
          el.classList.remove("is-pulse");
          void el.offsetWidth;
          el.classList.add("is-pulse");
        }
      });
      paintChosen(step.chosen);
      highlight(step.line);
      setCodeNote(step.note);
      setPhase(step.phase);
      setStatus(step.status);
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearTimeout(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-greedy-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= steps.length - 1) {
        stopPlay();
        setStatus("Finished. Reset to make 41¢ again.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyState(steps[index]);
      } catch (err) {
        console.error("[learn-greedy] Step failed", { index: index, err: err });
      }
      busy = false;
      return index < steps.length - 1;
    }

    function play() {
      if (playing) {
        stopPlay();
        return;
      }
      if (index >= steps.length - 1) reset();
      playing = true;
      var playBtn = document.querySelector('[data-greedy-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";

      function tick() {
        if (!playing) return;
        var more = stepOnce();
        if (!more) {
          stopPlay();
          return;
        }
        playTimer = window.setTimeout(tick, reduceMotion ? 80 : 700);
      }
      tick();
    }

    function reset() {
      stopPlay();
      index = -1;
      denomEls.forEach(function (el) {
        el.className = "greedy-denom";
      });
      paintChosen([]);
      if (remainEl) remainEl.textContent = String(AMOUNT);
      if (coinsEl) coinsEl.textContent = "0";
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setPhase("ready");
      setCodeNote(
        "Press <strong>Step</strong> or <strong>Play</strong> — each greedy pick lights up in the loop."
      );
      setStatus("Ready. Step to pick the largest coin that fits in 41¢.");
    }

    document.querySelectorAll("[data-greedy-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-greedy-action");
        if (action === "step") {
          stopPlay();
          stepOnce();
        } else if (action === "play") play();
        else if (action === "reset") reset();
      });
    });

    renderCode();
    paintDenoms();
    reset();
  }

  try {
    initGreedy();
  } catch (err) {
    console.error("[learn-greedy] Init failed", err);
  }
})();
