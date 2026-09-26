/**
 * Naive string search: slide pattern over text with mismatch highlight.
 */
(function () {
  var TEXT = "ABABCABAB";
  var PATTERN = "ABAB";

  function initSa() {
    var textRoot = document.getElementById("sa-text");
    var patRoot = document.getElementById("sa-pat");
    var status = document.getElementById("sa-status");
    var meta = document.getElementById("sa-meta");
    var phase = document.getElementById("sa-phase");
    var codeRoot = document.getElementById("sa-code");
    var codeNote = document.getElementById("sa-code-note");
    if (!textRoot || !patRoot) return;

    var offset = 0;
    var cmp = 0;
    var mode = "idle"; /* idle | comparing | mismatch | match | done */
    var playTimer = null;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var stepCount = 0;
    var logLines = [];

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function pushLog(line) {
      logLines.push(line);
      if (logLines.length > 8) logLines.shift();
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      logLines.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className = "code-line" + (i === logLines.length - 1 ? " is-active" : "");
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
      if (meta) meta.textContent = String(stepCount);
      textRoot.innerHTML = "";
      for (var t = 0; t < TEXT.length; t++) {
        var cell = document.createElement("span");
        cell.className = "sa-char";
        cell.textContent = TEXT[t];
        if (mode !== "idle" && t >= offset && t < offset + PATTERN.length) {
          cell.classList.add("is-window");
          var j = t - offset;
          if (mode === "comparing" && j === cmp) cell.classList.add("is-probe");
          if (mode === "mismatch" && j === cmp) cell.classList.add("is-miss");
          if (mode === "match" || (mode === "comparing" && j < cmp)) {
            cell.classList.add("is-ok");
          }
          if (mode === "match") cell.classList.add("is-hit");
        }
        textRoot.appendChild(cell);
      }

      patRoot.innerHTML = "";
      for (var p = 0; p < TEXT.length; p++) {
        var slot = document.createElement("span");
        slot.className = "sa-char sa-char--empty";
        if (p >= offset && p < offset + PATTERN.length) {
          var pj = p - offset;
          slot.className = "sa-char";
          slot.textContent = PATTERN[pj];
          if (mode === "comparing" && pj === cmp) slot.classList.add("is-probe");
          if (mode === "mismatch" && pj === cmp) slot.classList.add("is-miss");
          if (mode === "match" || (mode === "comparing" && pj < cmp)) {
            slot.classList.add("is-ok");
          }
          if (mode === "match") slot.classList.add("is-hit");
        } else {
          slot.textContent = "·";
        }
        patRoot.appendChild(slot);
      }

      if (phase) {
        phase.textContent =
          mode === "idle"
            ? "ready"
            : mode === "done"
              ? "done"
              : "i=" + offset + " j=" + cmp;
      }
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function reset() {
      clearPlay();
      offset = 0;
      cmp = 0;
      mode = "idle";
      stepCount = 0;
      logLines = [];
      if (codeRoot) codeRoot.innerHTML = "";
      setStatus("Ready — press Step to align the pattern at offset 0.");
      setNote("On mismatch, slide one cell right and try again.");
      paint();
    }

    function stepOnce() {
      if (mode === "done" || mode === "match") {
        reset();
        mode = "comparing";
        stepCount = 1;
        pushLog("align pattern at i=" + offset);
        setStatus("Comparing pattern[" + cmp + "] with text[" + (offset + cmp) + "].");
        setNote("Start at the leftmost alignment.");
        paint();
        return;
      }

      if (mode === "idle") {
        mode = "comparing";
        cmp = 0;
        stepCount += 1;
        pushLog("align pattern at i=" + offset);
        setStatus("Comparing pattern[0] with text[" + offset + "].");
        paint();
        return;
      }

      if (mode === "mismatch") {
        offset += 1;
        cmp = 0;
        if (offset > TEXT.length - PATTERN.length) {
          mode = "done";
          stepCount += 1;
          pushLog("no match found");
          setStatus("Scan finished — pattern not found.");
          setNote("Naive worst case is about O((n−m+1)·m) comparisons.");
          paint();
          return;
        }
        mode = "comparing";
        stepCount += 1;
        pushLog("slide → i=" + offset);
        setStatus("Slid to offset " + offset + ". Comparing again.");
        paint();
        return;
      }

      /* comparing */
      var tc = TEXT[offset + cmp];
      var pc = PATTERN[cmp];
      stepCount += 1;
      if (tc === pc) {
        pushLog("match '" + pc + "' at i+" + cmp);
        cmp += 1;
        if (cmp === PATTERN.length) {
          mode = "match";
          pushLog("FOUND at index " + offset);
          setStatus("Full match at index " + offset + ".");
          setNote("All <strong>" + PATTERN.length + "</strong> characters agreed.");
        } else {
          setStatus("Match so far — next compare j=" + cmp + ".");
          setNote("Partial match length " + cmp + ".");
        }
      } else {
        mode = "mismatch";
        pushLog("mismatch '" + pc + "'≠'" + tc + "' at i+" + cmp);
        setStatus("Mismatch at j=" + cmp + " — will slide right.");
        setNote("First differing character ends this alignment.");
      }
      paint();
    }

    function play() {
      clearPlay();
      if (mode === "done" || mode === "match") reset();
      function tick() {
        if (mode === "done" || mode === "match") {
          clearPlay();
          return;
        }
        stepOnce();
        playTimer = setTimeout(tick, reduceMotion ? 0 : 650);
      }
      tick();
    }

    document.querySelectorAll("[data-sa-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-sa-action");
          clearPlay();
          if (action === "reset") reset();
          else if (action === "step") stepOnce();
          else if (action === "play") play();
        } catch (err) {
          console.error("[learn-sa] Action failed", err);
        }
      });
    });

    reset();
  }

  try {
    initSa();
  } catch (err) {
    console.error("[learn-sa] Init failed", err);
  }
})();
