/**
 * FCFS vs Round Robin Gantt timeline for 4 jobs.
 */
(function () {
  var JOBS = [
    { id: "A", burst: 5, color: 0 },
    { id: "B", burst: 3, color: 1 },
    { id: "C", burst: 8, color: 2 },
    { id: "D", burst: 2, color: 3 }
  ];
  var QUANTUM = 2;

  var CODE_LINES = {
    fcfs: [
      { html: '<span class="code-fn">schedule_fcfs</span>() {', id: "sig" },
      { html: '  <span class="code-kw">while</span> (!ready.empty()) {', id: "loop" },
      { html: '    job = ready.dequeue(); <span class="code-cm">/* FIFO */</span>', id: "pick" },
      { html: '    run(job, job.burst); <span class="code-cm">/* to completion */</span>', id: "run" },
      { html: '  }' },
      { html: '}' }
    ],
    rr: [
      { html: '<span class="code-fn">schedule_rr</span>(q=' + QUANTUM + ') {', id: "sig" },
      { html: '  <span class="code-kw">while</span> (!ready.empty()) {', id: "loop" },
      { html: '    job = ready.dequeue();', id: "pick" },
      { html: '    slice = min(q, job.remaining);', id: "slice" },
      { html: '    run(job, slice);', id: "run" },
      { html: '    <span class="code-kw">if</span> (job.remaining &gt; 0) ready.enqueue(job);', id: "requeue" },
      { html: '  }' },
      { html: '}' }
    ]
  };

  function buildFCFS() {
    var segs = [];
    var t = 0;
    JOBS.forEach(function (j) {
      segs.push({ id: j.id, color: j.color, start: t, end: t + j.burst });
      t += j.burst;
    });
    return segs;
  }

  function buildRR() {
    var remaining = JOBS.map(function (j) {
      return { id: j.id, color: j.color, left: j.burst };
    });
    var queue = remaining.map(function (_, i) {
      return i;
    });
    var segs = [];
    var t = 0;
    var guard = 0;
    while (queue.length && guard < 200) {
      guard++;
      var idx = queue.shift();
      var job = remaining[idx];
      if (job.left <= 0) continue;
      var slice = Math.min(QUANTUM, job.left);
      segs.push({ id: job.id, color: job.color, start: t, end: t + slice });
      t += slice;
      job.left -= slice;
      if (job.left > 0) queue.push(idx);
    }
    return segs;
  }

  function avgWait(segs) {
    var finish = {};
    var startFirst = {};
    segs.forEach(function (s) {
      if (startFirst[s.id] === undefined) startFirst[s.id] = s.start;
      finish[s.id] = s.end;
    });
    var total = 0;
    JOBS.forEach(function (j) {
      var wait = finish[j.id] - j.burst;
      total += wait;
    });
    return (total / JOBS.length).toFixed(1);
  }

  function initSched() {
    var gantt = document.getElementById("sched-gantt");
    var jobsEl = document.getElementById("sched-jobs");
    var status = document.getElementById("sched-status");
    var badge = document.getElementById("sched-badge");
    var waitEl = document.getElementById("sched-wait");
    var codeRoot = document.getElementById("sched-code");
    var codeNote = document.getElementById("sched-code-note");
    if (!gantt) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mode = "fcfs";
    var segs = [];
    var reveal = 0;
    var animTimer = null;
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

    function stopAnim() {
      if (animTimer) {
        window.clearInterval(animTimer);
        animTimer = null;
      }
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE_LINES[mode].forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        row.innerHTML = line.html || "&nbsp;";
        codeRoot.appendChild(row);
      });
    }

    function highlight(id) {
      Object.keys(lineEls).forEach(function (k) {
        lineEls[k].classList.remove("is-active");
      });
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function renderJobs() {
      if (!jobsEl) return;
      jobsEl.innerHTML = "";
      JOBS.forEach(function (j) {
        var chip = document.createElement("div");
        chip.className = "sched-job";
        chip.dataset.tone = String(j.color);
        chip.innerHTML =
          "<strong>" +
          j.id +
          "</strong><span>burst " +
          j.burst +
          "</span>";
        jobsEl.appendChild(chip);
      });
    }

    function renderGantt() {
      gantt.innerHTML = "";
      var total = segs.length ? segs[segs.length - 1].end : 1;
      var track = document.createElement("div");
      track.className = "sched-track";

      var visible = segs.slice(0, reveal);
      visible.forEach(function (s) {
        var bar = document.createElement("div");
        bar.className = "sched-bar";
        bar.dataset.tone = String(s.color);
        bar.style.left = (s.start / total) * 100 + "%";
        bar.style.width = ((s.end - s.start) / total) * 100 + "%";
        bar.textContent = s.id;
        bar.title = s.id + ": t=" + s.start + "–" + s.end;
        track.appendChild(bar);
      });
      gantt.appendChild(track);

      var axis = document.createElement("div");
      axis.className = "sched-axis";
      for (var t = 0; t <= total; t++) {
        var tick = document.createElement("span");
        tick.textContent = String(t);
        tick.style.left = (t / total) * 100 + "%";
        axis.appendChild(tick);
      }
      gantt.appendChild(axis);

      if (waitEl) waitEl.textContent = avgWait(segs);
    }

    function applyMode(next) {
      try {
        stopAnim();
        mode = next;
        segs = mode === "rr" ? buildRR() : buildFCFS();
        reveal = segs.length;
        renderCode();
        highlight("sig");
        setBadge(mode === "rr" ? "Round Robin" : "FCFS");
        setCodeNote(
          mode === "rr"
            ? "Round Robin with quantum <strong>" + QUANTUM + "</strong>."
            : "FCFS runs each job to completion in order."
        );
        setStatus(
          mode === "rr"
            ? "RR (q=" + QUANTUM + "): jobs rotate; avg wait " + avgWait(segs) + "."
            : "FCFS: run each job to completion. Avg wait " + avgWait(segs) + "."
        );
        renderGantt();
      } catch (err) {
        console.error("[learn-scheduling] applyMode failed", next, err);
      }
    }

    function animate() {
      stopAnim();
      reveal = 0;
      renderGantt();
      highlight("loop");
      if (reduceMotion) {
        reveal = segs.length;
        renderGantt();
        highlight("run");
        return;
      }
      animTimer = window.setInterval(function () {
        reveal++;
        highlight(reveal % 2 === 0 ? "run" : "pick");
        renderGantt();
        if (reveal >= segs.length) {
          stopAnim();
          highlight(mode === "rr" ? "requeue" : "run");
        }
      }, 380);
    }

    document.querySelectorAll("[data-sched-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-sched-action");
          if (action === "fcfs") applyMode("fcfs");
          else if (action === "rr") applyMode("rr");
          else if (action === "play") animate();
          else if (action === "reset") applyMode(mode);
        } catch (err) {
          console.error("[learn-scheduling] action failed", err);
        }
      });
    });

    renderJobs();
    applyMode("fcfs");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSched);
  } else {
    initSched();
  }
})();
