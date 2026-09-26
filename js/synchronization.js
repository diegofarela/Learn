/**
 * Two-thread counter race with optional mutex.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-cm">/* each thread, 10 times: */</span>' },
    { html: '<span class="code-kw">if</span> (use_lock) lock(mutex);', id: "lock" },
    { html: 'tmp = counter; <span class="code-cm">/* read */</span>', id: "read" },
    { html: 'tmp = tmp + 1; <span class="code-cm">/* modify */</span>', id: "mod" },
    { html: 'counter = tmp; <span class="code-cm">/* write */</span>', id: "write" },
    { html: '<span class="code-kw">if</span> (use_lock) unlock(mutex);', id: "unlock" }
  ];

  function initSync() {
    var counterEl = document.getElementById("sync-counter");
    var countMeta = document.getElementById("sync-count");
    var lockEl = document.getElementById("sync-lock");
    var useLock = document.getElementById("sync-use-lock");
    var status = document.getElementById("sync-status");
    var badge = document.getElementById("sync-badge");
    var op0 = document.getElementById("sync-op0");
    var op1 = document.getElementById("sync-op1");
    var codeRoot = document.getElementById("sync-code");
    var codeNote = document.getElementById("sync-code-note");
    if (!counterEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var counter = 0;
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

    function setCounter(n) {
      counter = n;
      counterEl.textContent = String(n);
      if (countMeta) countMeta.textContent = String(n);
    }

    function setOp(tid, text) {
      var el = tid === 0 ? op0 : op1;
      if (el) el.textContent = text;
      var node = document.querySelector('.sync-thread[data-tid="' + tid + '"]');
      if (node) node.classList.toggle("is-active", text !== "idle" && text !== "done");
    }

    function updateLockUi(held) {
      var on = useLock && useLock.checked;
      if (lockEl) {
        lockEl.textContent = !on ? "unlocked" : held ? "held" : "free";
        lockEl.classList.toggle("is-held", !!held);
        lockEl.classList.toggle("is-off", !on);
      }
      setBadge(!on ? "unlocked" : held ? "locked" : "mutex on");
    }

    function sleep(ms) {
      return new Promise(function (resolve) {
        window.setTimeout(resolve, reduceMotion ? 0 : ms);
      });
    }

    function runRace() {
      if (busy) return;
      busy = true;
      setCounter(0);
      var locked = useLock && useLock.checked;
      var expected = 20;
      var local = [0, 0];
      var mutex = false;

      async function critical(tid) {
        if (locked) {
          while (mutex) {
            setOp(tid, "wait lock");
            highlight("lock");
            await sleep(80);
          }
          mutex = true;
          updateLockUi(true);
          highlight("lock");
          setOp(tid, "lock");
          await sleep(120);
        }

        highlight("read");
        setOp(tid, "read " + counter);
        var tmp = counter;
        await sleep(140);

        if (!locked) {
          // allow the other thread's write to interleave → lost update
          await sleep(60);
        }

        highlight("mod");
        setOp(tid, "tmp+1");
        tmp = tmp + 1;
        await sleep(100);

        highlight("write");
        setOp(tid, "write " + tmp);
        counter = tmp;
        setCounter(counter);
        local[tid]++;
        await sleep(100);

        if (locked) {
          highlight("unlock");
          setOp(tid, "unlock");
          mutex = false;
          updateLockUi(false);
          await sleep(80);
        }
        setOp(tid, "idle");
      }

      (async function () {
        try {
          setStatus(locked ? "Running with mutex — expect 20." : "Running unlocked — expect lost updates.");
          updateLockUi(false);
          var tasks = [];
          for (var round = 0; round < 10; round++) {
            if (locked) {
              await critical(0);
              await critical(1);
            } else {
              // Interleave: both read before either writes (classic race)
              highlight("read");
              setOp(0, "read " + counter);
              setOp(1, "read " + counter);
              var t0 = counter;
              var t1 = counter;
              await sleep(160);
              highlight("mod");
              setOp(0, "tmp+1");
              setOp(1, "tmp+1");
              t0++;
              t1++;
              await sleep(120);
              highlight("write");
              setOp(0, "write " + t0);
              counter = t0;
              setCounter(counter);
              await sleep(100);
              setOp(1, "write " + t1);
              counter = t1;
              setCounter(counter);
              local[0]++;
              local[1]++;
              await sleep(120);
              setOp(0, "idle");
              setOp(1, "idle");
            }
          }
          setOp(0, "done");
          setOp(1, "done");
          var ok = counter === expected;
          setBadge(ok ? "correct" : "race!");
          setStatus(
            "Final counter = " +
              counter +
              " (expected " +
              expected +
              "). " +
              (ok ? "Lock prevented the race." : "Lost updates from the race.")
          );
          setCodeNote(ok ? "Mutual exclusion kept increments atomic." : "Interleaved writes overwrote each other.");
        } catch (err) {
          console.error("[learn-synchronization] race failed", err);
          setStatus("Demo error — see console.");
        } finally {
          busy = false;
          updateLockUi(false);
        }
      })();
    }

    function reset() {
      try {
        busy = false;
        setCounter(0);
        setOp(0, "idle");
        setOp(1, "idle");
        highlight(null);
        updateLockUi(false);
        setCodeNote("Run the race — watch read / write interleave or lock serialize.");
        setStatus(
          useLock && useLock.checked
            ? "Lock on: increments should reach 20."
            : "Lock off: interleaved read-modify-write can lose increments."
        );
      } catch (err) {
        console.error("[learn-synchronization] reset failed", err);
      }
    }

    if (useLock) {
      useLock.addEventListener("change", function () {
        updateLockUi(false);
        setStatus(
          useLock.checked
            ? "Lock on: increments should reach 20."
            : "Lock off: interleaved read-modify-write can lose increments."
        );
      });
    }

    document.querySelectorAll("[data-sync-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-sync-action");
          if (action === "run") runRace();
          else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-synchronization] action failed", err);
        }
      });
    });

    renderCode();
    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSync);
  } else {
    initSync();
  }
})();
