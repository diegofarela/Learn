/**
 * Interactive LRU cache over RAM + step/auto access sequence.
 */
(function () {
  var SEQUENCE = ["A", "B", "C", "A", "D", "E", "B", "A", "F", "B"];
  var CAPACITY = 4;
  var RAM = ["A", "B", "C", "D", "E", "F", "G", "H"];

  var CODE_LINES = [
    { html: '<span class="code-type">void</span> <span class="code-fn">access</span>(Addr a) {', id: "sig" },
    { html: '  <span class="code-kw">if</span> (cache.contains(a)) {', id: "check" },
    { html: '    cache.touch(a); <span class="code-cm">/* hit · refresh LRU */</span>', id: "hit" },
    { html: '    <span class="code-kw">return</span> cache.read(a);', id: "hit-ret" },
    { html: '  }' },
    { html: '  <span class="code-cm">/* miss */</span>', id: "miss" },
    { html: '  <span class="code-kw">if</span> (cache.full()) cache.evictLRU();', id: "evict" },
    { html: '  cache.insert(a, RAM[a]);', id: "insert" },
    { html: '}' }
  ];

  var STEPS_HIT = [
    { line: "sig", note: "Access address <strong>{a}</strong>." },
    { line: "check", note: "Look for a matching tag in the cache.", visual: "probe" },
    { line: "hit", note: "<strong>Hit</strong> — refresh LRU order.", visual: "hit" },
    { line: "hit-ret", note: "Serve data from the cache (no RAM trip).", visual: "commit" }
  ];

  var STEPS_MISS = [
    { line: "sig", note: "Access address <strong>{a}</strong>." },
    { line: "check", note: "Look for a matching tag in the cache.", visual: "probe" },
    { line: "miss", note: "<strong>Miss</strong> — not in cache.", visual: "miss" },
    { line: "evict", note: "If full, evict the least recently used line.", visual: "evict" },
    { line: "insert", note: "Fetch from RAM and insert into the cache.", visual: "commit" }
  ];

  function initCache() {
    var linesEl = document.getElementById("cache-lines");
    var ramEl = document.getElementById("cache-ram");
    var seqEl = document.getElementById("cache-seq");
    var status = document.getElementById("cache-status");
    var badge = document.getElementById("cache-badge");
    var hitsEl = document.getElementById("cache-hits");
    var missesEl = document.getElementById("cache-misses");
    var codeRoot = document.getElementById("cache-code");
    var codeNote = document.getElementById("cache-code-note");
    if (!linesEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var lines = [];
    var seqIndex = 0;
    var hits = 0;
    var misses = 0;
    var focus = null;
    var evicted = null;
    var busy = false;
    var autoTimer = null;
    var stepTimers = [];
    var lineEls = {};

    function clearTimers() {
      stepTimers.forEach(function (t) {
        window.clearTimeout(t);
      });
      stepTimers = [];
    }

    function stopAuto() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

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
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        row.innerHTML = line.html || "&nbsp;";
        codeRoot.appendChild(row);
      });
    }

    function clearHighlights() {
      Object.keys(lineEls).forEach(function (id) {
        lineEls[id].classList.remove("is-active");
      });
    }

    function highlight(id) {
      clearHighlights();
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function renderSeq() {
      if (!seqEl) return;
      seqEl.innerHTML = "";
      SEQUENCE.forEach(function (addr, i) {
        var chip = document.createElement("span");
        chip.className = "cache-seq-chip";
        if (i < seqIndex) chip.classList.add("is-done");
        if (i === seqIndex) chip.classList.add("is-next");
        chip.textContent = addr;
        seqEl.appendChild(chip);
      });
    }

    function render() {
      linesEl.innerHTML = "";
      for (var i = 0; i < CAPACITY; i++) {
        var slot = document.createElement("div");
        slot.className = "cache-line";
        if (i < lines.length) {
          var tag = lines[i];
          slot.textContent = tag;
          slot.classList.add("is-filled");
          if (focus === tag) slot.classList.add("is-focus");
          if (evicted === tag) slot.classList.add("is-evict");
          if (i === 0 && lines.length > 0) {
            var mru = document.createElement("span");
            mru.className = "cache-lru-tag";
            mru.textContent = "MRU";
            slot.appendChild(mru);
          }
          if (i === lines.length - 1 && lines.length === CAPACITY) {
            var lru = document.createElement("span");
            lru.className = "cache-lru-tag cache-lru-cold";
            lru.textContent = "LRU";
            slot.appendChild(lru);
          }
        } else {
          slot.classList.add("is-empty");
          slot.textContent = "—";
        }
        linesEl.appendChild(slot);
      }

      if (ramEl) {
        ramEl.innerHTML = "";
        RAM.forEach(function (addr) {
          var block = document.createElement("div");
          block.className = "cache-ram-block";
          block.textContent = addr;
          if (lines.indexOf(addr) !== -1) block.classList.add("is-cached");
          if (focus === addr) block.classList.add("is-focus");
          ramEl.appendChild(block);
        });
      }

      if (hitsEl) hitsEl.textContent = String(hits);
      if (missesEl) missesEl.textContent = String(misses);
      renderSeq();
    }

    function touch(addr) {
      var idx = lines.indexOf(addr);
      if (idx !== -1) lines.splice(idx, 1);
      lines.unshift(addr);
    }

    function runSteps(steps, addr, onDone) {
      clearTimers();
      busy = true;
      var delay = reduceMotion ? 0 : 420;
      var i = 0;

      function tick() {
        if (i >= steps.length) {
          busy = false;
          clearHighlights();
          if (onDone) onDone();
          return;
        }
        var step = steps[i];
        var note = (step.note || "").replace(/\{a\}/g, addr);
        highlight(step.line);
        setCodeNote(note);

        if (step.visual === "probe") {
          focus = addr;
          render();
        } else if (step.visual === "hit") {
          setBadge("HIT");
          touch(addr);
          hits++;
          focus = addr;
          render();
        } else if (step.visual === "miss") {
          setBadge("MISS");
          focus = addr;
          render();
        } else if (step.visual === "evict") {
          if (lines.length >= CAPACITY && lines.indexOf(addr) === -1) {
            evicted = lines[lines.length - 1];
            lines.pop();
            setStatus("Evicted " + evicted + " (LRU). Fetching " + addr + " from RAM.");
          }
          render();
        } else if (step.visual === "commit") {
          if (lines.indexOf(addr) === -1) {
            lines.unshift(addr);
            misses++;
          }
          evicted = null;
          focus = addr;
          render();
          setStatus(
            "Accessed " +
              addr +
              ". Hits " +
              hits +
              ", misses " +
              misses +
              ". Cache: [" +
              lines.join(", ") +
              "]"
          );
        }

        i++;
        if (reduceMotion) {
          tick();
        } else {
          stepTimers.push(window.setTimeout(tick, delay));
        }
      }

      tick();
    }

    function stepOnce() {
      if (busy) return;
      if (seqIndex >= SEQUENCE.length) {
        setStatus("Sequence finished. Reset to replay.");
        setBadge("done");
        stopAuto();
        return;
      }
      var addr = SEQUENCE[seqIndex];
      seqIndex++;
      evicted = null;
      var isHit = lines.indexOf(addr) !== -1;
      var steps = (isHit ? STEPS_HIT : STEPS_MISS).map(function (s) {
        return { line: s.line, note: s.note, visual: s.visual };
      });
      runSteps(steps, addr, function () {
        focus = null;
        render();
        setBadge(isHit ? "hit" : "miss");
      });
    }

    function reset() {
      try {
        stopAuto();
        clearTimers();
        busy = false;
        lines = [];
        seqIndex = 0;
        hits = 0;
        misses = 0;
        focus = null;
        evicted = null;
        clearHighlights();
        setBadge("ready");
        setCodeNote("Press <strong>Step access</strong> — hit, miss, and eviction light up.");
        setStatus("Sequence ready. Step to access the next address.");
        render();
      } catch (err) {
        console.error("[learn-caching] reset failed", err);
      }
    }

    document.querySelectorAll("[data-cache-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-cache-action");
          if (action === "step") stepOnce();
          else if (action === "auto") {
            if (autoTimer) {
              stopAuto();
              setBadge("paused");
              return;
            }
            if (seqIndex >= SEQUENCE.length) reset();
            autoTimer = window.setInterval(function () {
              if (busy) return;
              if (seqIndex >= SEQUENCE.length) {
                stopAuto();
                return;
              }
              stepOnce();
            }, reduceMotion ? 200 : 1100);
            setBadge("auto");
          } else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-caching] action failed", action, err);
        }
      });
    });

    renderCode();
    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCache);
  } else {
    initCache();
  }
})();
