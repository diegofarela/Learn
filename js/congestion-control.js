/**
 * AIMD congestion-window sawtooth animation.
 */
(function () {
  var CODE = [
    { html: '<span class="code-kw">on</span> ACK:', id: "ack" },
    { html: '  <span class="code-kw">if</span> cwnd &lt; ssthresh: cwnd *= <span class="code-num">2</span>  <span class="code-cm">/* slow start */</span>', id: "ss" },
    { html: '  <span class="code-kw">else</span>: cwnd += <span class="code-num">1</span>           <span class="code-cm">/* CA */</span>', id: "ca" },
    { blank: true },
    { html: '<span class="code-kw">on</span> loss:', id: "loss" },
    { html: '  ssthresh = cwnd / <span class="code-num">2</span>', id: "cut" },
    { html: '  cwnd = ssthresh', id: "set" }
  ];

  function initCc() {
    var canvas = document.getElementById("cc-canvas");
    var status = document.getElementById("cc-status");
    var phaseEl = document.getElementById("cc-phase");
    var cwndEl = document.getElementById("cc-cwnd");
    var pipeFill = document.getElementById("cc-pipe-fill");
    var codeRoot = document.getElementById("cc-code");
    var codeNote = document.getElementById("cc-code-note");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var cwnd = 1;
    var ssthresh = 16;
    var history = [1];
    var playing = false;
    var timer = null;
    var lineEls = {};
    var maxCwnd = 32;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function highlight(id) {
      Object.keys(lineEls).forEach(function (k) {
        lineEls[k].classList.remove("is-active");
      });
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE.forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        if (line.blank) row.innerHTML = "&nbsp;";
        else row.innerHTML = line.html || "&nbsp;";
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        codeRoot.appendChild(row);
      });
    }

    function draw() {
      var w = canvas.width;
      var h = canvas.height;
      var pad = 28;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(232,240,244,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, pad);
      ctx.lineTo(pad, h - pad);
      ctx.lineTo(w - pad, h - pad);
      ctx.stroke();

      // ssthresh line
      var yThresh = h - pad - ((ssthresh / maxCwnd) * (h - 2 * pad));
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255,210,122,0.45)";
      ctx.beginPath();
      ctx.moveTo(pad, yThresh);
      ctx.lineTo(w - pad, yThresh);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,210,122,0.7)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText("ssthresh=" + ssthresh, pad + 4, yThresh - 4);

      if (history.length < 2) return;
      ctx.strokeStyle = "#3ecfc4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      history.forEach(function (v, i) {
        var x = pad + (i / Math.max(history.length - 1, 1)) * (w - 2 * pad);
        var y = h - pad - ((v / maxCwnd) * (h - 2 * pad));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      var last = history[history.length - 1];
      var lx = pad + ((history.length - 1) / Math.max(history.length - 1, 1)) * (w - 2 * pad);
      var ly = h - pad - ((last / maxCwnd) * (h - 2 * pad));
      ctx.fillStyle = "#3ecfc4";
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    function syncUi(phase, noteId) {
      if (cwndEl) cwndEl.textContent = String(Math.round(cwnd * 10) / 10);
      if (phaseEl) phaseEl.textContent = phase;
      if (pipeFill) {
        pipeFill.style.width = Math.min(100, (cwnd / maxCwnd) * 100) + "%";
      }
      highlight(noteId);
      draw();
    }

    function tick() {
      var phase;
      var noteId;
      if (cwnd < ssthresh) {
        cwnd = Math.min(maxCwnd, cwnd * 2);
        phase = "slow start";
        noteId = "ss";
        setStatus("Slow start: cwnd doubles each RTT → " + cwnd);
      } else {
        cwnd = Math.min(maxCwnd, cwnd + 1);
        phase = "cong. avoidance";
        noteId = "ca";
        setStatus("Congestion avoidance: cwnd += 1 → " + cwnd);
      }
      // auto loss near capacity
      if (cwnd >= maxCwnd - 1 && Math.random() < 0.35) {
        forceLoss(true);
        return;
      }
      history.push(cwnd);
      if (history.length > 48) history.shift();
      syncUi(phase, noteId);
      if (codeNote) codeNote.textContent = "Additive increase while ACKs arrive.";
    }

    function forceLoss(fromAuto) {
      ssthresh = Math.max(2, Math.floor(cwnd / 2));
      cwnd = ssthresh;
      history.push(cwnd);
      if (history.length > 48) history.shift();
      syncUi("loss → cut", "cut");
      setStatus(
        (fromAuto ? "Loss detected — " : "Forced loss — ") +
          "multiplicative decrease: cwnd = " +
          cwnd +
          ", ssthresh = " +
          ssthresh
      );
      if (codeNote) codeNote.textContent = "Multiplicative decrease on loss.";
      highlight("loss");
    }

    function play() {
      if (playing) return;
      playing = true;
      setStatus("Playing AIMD…");
      function loop() {
        tick();
        timer = window.setTimeout(loop, reduceMotion ? 80 : 500);
      }
      loop();
    }

    function stop() {
      playing = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function reset() {
      stop();
      cwnd = 1;
      ssthresh = 16;
      history = [1];
      syncUi("idle", null);
      setStatus("Idle — press Play to grow cwnd with AIMD.");
      if (codeNote) codeNote.textContent = "Additive increase, multiplicative decrease.";
    }

    document.querySelectorAll("[data-cc-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-cc-action");
        if (a === "play") {
          if (playing) {
            stop();
            setStatus("Paused at cwnd = " + cwnd);
          } else play();
        } else if (a === "loss") {
          forceLoss(false);
        } else if (a === "reset") reset();
      });
    });

    renderCode();
    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCc);
  } else {
    initCc();
  }
})();
