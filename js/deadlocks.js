/**
 * Two-lock circular wait vs ordered acquire demo.
 */
(function () {
  var CODE_DEADLOCK = [
    { html: '<span class="code-cm">/* opposite lock orders → cycle */</span>', id: "title" },
    { html: 'T1: lock(A); lock(B); …', id: "t1" },
    { html: 'T2: lock(B); lock(A); …', id: "t2" },
    { html: '<span class="code-cm">/* T1 holds A waits B; T2 holds B waits A */</span>', id: "cycle" }
  ];

  var CODE_ORDERED = [
    { html: '<span class="code-cm">/* same global order on every thread */</span>', id: "title" },
    { html: 'T1: lock(A); lock(B); …', id: "t1" },
    { html: 'T2: lock(A); lock(B); …', id: "t2" },
    { html: '<span class="code-cm">/* no circular wait — both finish */</span>', id: "ok" }
  ];

  function initDeadlock() {
    var status = document.getElementById("dl-status");
    var badge = document.getElementById("dl-badge");
    var stateLabel = document.getElementById("dl-state-label");
    var cycleEl = document.getElementById("dl-cycle");
    var codeRoot = document.getElementById("dl-code");
    var codeNote = document.getElementById("dl-code-note");
    var ownerA = document.getElementById("dl-ownerA");
    var ownerB = document.getElementById("dl-ownerB");
    var lockA = document.getElementById("dl-lockA");
    var lockB = document.getElementById("dl-lockB");
    if (!status) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var lineEls = {};
    var owners = { A: null, B: null };
    var waits = { 0: null, 1: null };
    var holds = { 0: [], 1: [] };

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
      if (stateLabel) stateLabel.textContent = text;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function sleep(ms) {
      return new Promise(function (r) {
        window.setTimeout(r, reduceMotion ? 0 : ms);
      });
    }

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      lines.forEach(function (line, i) {
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

    function paint() {
      if (ownerA) ownerA.textContent = owners.A === null ? "free" : "T" + (owners.A + 1);
      if (ownerB) ownerB.textContent = owners.B === null ? "free" : "T" + (owners.B + 1);
      if (lockA) lockA.classList.toggle("is-held", owners.A !== null);
      if (lockB) lockB.classList.toggle("is-held", owners.B !== null);

      [0, 1].forEach(function (tid) {
        var h = document.getElementById("dl-holds" + tid);
        var w = document.getElementById("dl-waits" + tid);
        var node = document.querySelector('.dl-thread[data-tid="' + tid + '"]');
        if (h) h.textContent = "holds: " + (holds[tid].length ? holds[tid].join(", ") : "—");
        if (w) w.textContent = "waits: " + (waits[tid] || "—");
        if (node) {
          node.classList.toggle("is-waiting", !!waits[tid]);
          node.classList.toggle("is-holding", holds[tid].length > 0);
        }
      });

      var deadlocked = waits[0] && waits[1];
      if (cycleEl) {
        cycleEl.hidden = !deadlocked;
        cycleEl.classList.toggle("is-on", !!deadlocked);
      }
    }

    function acquire(tid, lock) {
      if (owners[lock] === null) {
        owners[lock] = tid;
        holds[tid].push(lock);
        waits[tid] = null;
        paint();
        return true;
      }
      waits[tid] = lock;
      paint();
      return false;
    }

    function releaseAll() {
      owners = { A: null, B: null };
      waits = { 0: null, 1: null };
      holds = { 0: [], 1: [] };
      paint();
    }

    async function causeDeadlock() {
      if (busy) return;
      busy = true;
      try {
        releaseAll();
        renderCode(CODE_DEADLOCK);
        highlight("title");
        setBadge("running");
        setStatus("T1 and T2 take locks in opposite orders…");

        highlight("t1");
        setCodeNote("T1 acquires <strong>Lock A</strong>.");
        acquire(0, "A");
        await sleep(500);

        highlight("t2");
        setCodeNote("T2 acquires <strong>Lock B</strong>.");
        acquire(1, "B");
        await sleep(500);

        highlight("t1");
        setCodeNote("T1 waits for <strong>Lock B</strong> (held by T2).");
        acquire(0, "B");
        await sleep(500);

        highlight("t2");
        setCodeNote("T2 waits for <strong>Lock A</strong> (held by T1).");
        acquire(1, "A");
        await sleep(300);

        highlight("cycle");
        setBadge("DEADLOCK");
        setStatus("Circular wait: T1→B→T2→A→T1. Nobody can proceed.");
        setCodeNote("Break the cycle: one lock order, timeouts, or detection.");
      } catch (err) {
        console.error("[learn-deadlocks] deadlock demo failed", err);
      } finally {
        busy = false;
      }
    }

    async function orderedAcquire() {
      if (busy) return;
      busy = true;
      try {
        releaseAll();
        renderCode(CODE_ORDERED);
        highlight("title");
        setBadge("running");
        setStatus("Both threads lock A before B — no cycle.");

        highlight("t1");
        setCodeNote("T1: lock A, then B.");
        acquire(0, "A");
        await sleep(350);
        acquire(0, "B");
        await sleep(350);
        // finish T1
        holds[0] = [];
        owners.A = null;
        owners.B = null;
        paint();
        await sleep(300);

        highlight("t2");
        setCodeNote("T2: same order — lock A, then B.");
        acquire(1, "A");
        await sleep(350);
        acquire(1, "B");
        await sleep(350);
        holds[1] = [];
        owners.A = null;
        owners.B = null;
        paint();

        highlight("ok");
        setBadge("ok");
        setStatus("Both finished. Global lock order prevented circular wait.");
        setCodeNote("Prevention: impose a total order on lock acquisition.");
      } catch (err) {
        console.error("[learn-deadlocks] ordered demo failed", err);
      } finally {
        busy = false;
      }
    }

    function reset() {
      try {
        busy = false;
        releaseAll();
        renderCode(CODE_DEADLOCK);
        highlight(null);
        setBadge("ready");
        setCodeNote("Run a scenario — hold-and-wait vs ordered locking.");
        setStatus("Cause a circular wait — or acquire A then B in the same order on both threads.");
      } catch (err) {
        console.error("[learn-deadlocks] reset failed", err);
      }
    }

    document.querySelectorAll("[data-dl-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-dl-action");
          if (action === "deadlock") causeDeadlock();
          else if (action === "ordered") orderedAcquire();
          else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-deadlocks] action failed", err);
        }
      });
    });

    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDeadlock);
  } else {
    initDeadlock();
  }
})();
