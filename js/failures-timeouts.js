/**
 * Failures & timeouts: crash/partition, timeout fires, retry.
 */
(function () {
  function init() {
    var topo = document.getElementById("fail-topo");
    var status = document.getElementById("fail-status");
    var phase = document.getElementById("fail-phase");
    var meta = document.getElementById("fail-meta");
    var codeRoot = document.getElementById("fail-code");
    var codeNote = document.getElementById("fail-code-note");
    var timerBar = document.getElementById("fail-timer-bar");
    var timerWrap = document.getElementById("fail-timer");
    if (!topo) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var nodes = {
      client: { ok: true },
      A: { ok: true },
      B: { ok: true }
    };
    var partitioned = false;
    var busy = false;
    var log = [];
    var timer = null;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function pushLog(line) {
      log.push(line);
      if (log.length > 6) log.shift();
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      log.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className = "code-line" + (i === log.length - 1 ? " is-active" : "");
        el.innerHTML =
          '<span class="code-ln">' +
          (i + 1) +
          '</span><span class="code-src">' +
          src +
          "</span>";
        codeRoot.appendChild(el);
      });
    }

    function paint() {
      topo.innerHTML = "";
      function mk(id, label, cls) {
        var d = document.createElement("div");
        d.className =
          "fail-node " +
          cls +
          (nodes[id] && !nodes[id].ok ? " is-down" : "") +
          (partitioned && id === "B" ? " is-cut" : "");
        d.innerHTML =
          '<span class="fail-node-n">' +
          label +
          '</span><span class="fail-node-s">' +
          (nodes[id] && nodes[id].ok ? "up" : "down") +
          "</span>";
        return d;
      }
      topo.appendChild(mk("client", "Client", "is-client"));
      var link1 = document.createElement("div");
      link1.className = "fail-link" + (busy ? " is-pulse" : "");
      link1.textContent = "→";
      topo.appendChild(link1);
      topo.appendChild(mk("A", "A", "is-server"));
      var link2 = document.createElement("div");
      link2.className =
        "fail-link" + (partitioned ? " is-broken" : "") + (busy ? " is-pulse" : "");
      link2.textContent = partitioned ? "✕" : "↔";
      topo.appendChild(link2);
      topo.appendChild(mk("B", "B", "is-server"));
    }

    function clearTimerAnim() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (timerWrap) timerWrap.classList.remove("is-on");
      if (timerBar) {
        timerBar.style.transition = "none";
        timerBar.style.width = "0%";
      }
    }

    function runTimeout(ms, onFire) {
      clearTimerAnim();
      if (timerWrap) timerWrap.classList.add("is-on");
      if (timerBar) {
        void timerBar.offsetWidth;
        timerBar.style.transition = reduceMotion
          ? "none"
          : "width " + ms + "ms linear";
        timerBar.style.width = "100%";
        if (reduceMotion) timerBar.style.width = "100%";
      }
      timer = setTimeout(function () {
        try {
          onFire();
        } catch (err) {
          console.error("[learn-fail] Timeout handler failed", err);
        }
      }, ms);
    }

    function request() {
      if (busy) return;
      busy = true;
      if (phase) phase.textContent = "WAITING";
      if (meta) meta.textContent = "waiting";
      pushLog("client → A: REQUEST");
      setStatus("Request in flight…");
      paint();

      var targetOk = nodes.A.ok;
      var canReachB = nodes.B.ok && !partitioned;

      if (!targetOk) {
        runTimeout(reduceMotion ? 400 : 1200, function () {
          pushLog("timeout waiting for A");
          pushLog("retry → B");
          if (canReachB) {
            pushLog("B: OK (failover)");
            if (phase) phase.textContent = "OK";
            if (meta) meta.textContent = "ok";
            setStatus("A down — timeout fired; retry succeeded on B.");
            if (codeNote) {
              codeNote.textContent = "Timeout detected failure; retry hit a live replica.";
            }
          } else {
            pushLog("B unreachable — fail");
            if (phase) phase.textContent = "FAIL";
            if (meta) meta.textContent = "fail";
            setStatus("Timeout and retry both failed (crash + partition).");
            if (codeNote) {
              codeNote.textContent = "Without a reachable replica, the client must error.";
            }
          }
          busy = false;
          clearTimerAnim();
          paint();
        });
        return;
      }

      /* A is up — maybe slow path if we want B involved */
      runTimeout(reduceMotion ? 200 : 700, function () {
        pushLog("A: OK");
        if (phase) phase.textContent = "OK";
        if (meta) meta.textContent = "ok";
        setStatus("A answered before the timeout.");
        if (codeNote) codeNote.textContent = "Happy path — no retry needed.";
        busy = false;
        clearTimerAnim();
        paint();
      });
    }

    function reset() {
      clearTimerAnim();
      nodes = { client: { ok: true }, A: { ok: true }, B: { ok: true } };
      partitioned = false;
      busy = false;
      log = [];
      if (codeRoot) codeRoot.innerHTML = "";
      if (phase) phase.textContent = "IDLE";
      if (meta) meta.textContent = "idle";
      setStatus("Healthy cluster. Send a request from the client to node A.");
      if (codeNote) {
        codeNote.textContent = "Timeout ≈ detection; retry needs idempotency for safety.";
      }
      paint();
    }

    document.querySelectorAll("[data-fail-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var a = btn.getAttribute("data-fail-action");
          if (a === "request") request();
          else if (a === "crash") {
            nodes.A.ok = false;
            pushLog("A crashed");
            setStatus("Node A is down — the next request will time out and retry B.");
            if (phase) phase.textContent = "DEGRADED";
            if (meta) meta.textContent = "crash";
            paint();
          } else if (a === "partition") {
            partitioned = true;
            pushLog("partition: A ↛ B");
            setStatus("Network partition between A and B.");
            if (phase) phase.textContent = "SPLIT";
            if (meta) meta.textContent = "split";
            paint();
          } else if (a === "heal") {
            nodes.A.ok = true;
            nodes.B.ok = true;
            partitioned = false;
            pushLog("healed");
            setStatus("Cluster healed — all links and nodes up.");
            if (phase) phase.textContent = "IDLE";
            if (meta) meta.textContent = "idle";
            paint();
          } else if (a === "reset") reset();
        } catch (err) {
          console.error("[learn-fail] Action failed", err);
        }
      });
    });

    /* Crash A for timeout demo convenience via double path: also allow crashing A */
    paint();
    pushLog("# ready");
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-fail] Init failed", err);
  }
})();
