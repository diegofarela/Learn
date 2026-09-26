/**
 * Interactive DFA: step through input; accept strings ending in "ab".
 */
(function () {
  var STATES = [
    { id: "q0", label: "q₀", x: 12, y: 48, start: true },
    { id: "q1", label: "q₁", x: 42, y: 22 },
    { id: "q2", label: "q₂", x: 72, y: 48, accept: true },
    { id: "q3", label: "q₃", x: 42, y: 78 }
  ];

  /* Language: strings over {a,b} that end with "ab" */
  var DELTA = {
    q0: { a: "q1", b: "q0" },
    q1: { a: "q1", b: "q2" },
    q2: { a: "q1", b: "q0" },
    q3: { a: "q1", b: "q0" }
  };

  var EDGES = [
    { from: "q0", to: "q1", label: "a", path: "M 18% 42% Q 27% 22% 36% 26%" },
    { from: "q0", to: "q0", label: "b", loop: true },
    { from: "q1", to: "q1", label: "a", loop: true },
    { from: "q1", to: "q2", label: "b", path: "M 48% 28% Q 58% 35% 66% 42%" },
    { from: "q2", to: "q1", label: "a", path: "M 66% 40% Q 58% 18% 48% 20%" },
    { from: "q2", to: "q0", label: "b", path: "M 66% 54% Q 42% 62% 22% 54%" }
  ];

  var CODE_LINES = [
    { html: '<span class="code-cm">/* DFA: L = { w | w ends with ab }</span>', id: "sig" },
    { html: '<span class="code-type">state</span> q = q₀;', id: "start" },
    { html: '<span class="code-kw">for</span> each symbol σ in input {', id: "loop" },
    { html: '  q = δ(q, σ);', id: "delta" },
    { html: '}' },
    { html: '<span class="code-kw">return</span> q ∈ F; <span class="code-cm">/* F = {q₂} */</span>', id: "accept" }
  ];

  function initFa() {
    var inputEl = document.getElementById("fa-input");
    var tapeRoot = document.getElementById("fa-tape");
    var nodesRoot = document.getElementById("fa-nodes");
    var edgesSvg = document.getElementById("fa-edges");
    var status = document.getElementById("fa-status");
    var badge = document.getElementById("fa-badge");
    var posEl = document.getElementById("fa-pos");
    var lenEl = document.getElementById("fa-len");
    var codeRoot = document.getElementById("fa-code");
    var codeNote = document.getElementById("fa-code-note");
    if (!inputEl || !nodesRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var state = "q0";
    var pos = 0;
    var input = "";
    var playing = false;
    var playTimer = null;
    var lineEls = {};
    var nodeEls = {};
    var busy = false;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(label, kind) {
      if (!badge) return;
      badge.textContent = label;
      badge.dataset.phase = kind || label;
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

    function paintMachine() {
      nodesRoot.innerHTML = "";
      edgesSvg.innerHTML = "";
      nodeEls = {};

      EDGES.forEach(function (e) {
        if (e.loop) {
          var s = STATES.find(function (n) {
            return n.id === e.from;
          });
          if (!s) return;
          var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          var cx = s.x;
          var cy = s.y - 14;
          path.setAttribute(
            "d",
            "M " +
              (cx - 4) +
              "% " +
              (s.y - 6) +
              "% Q " +
              cx +
              "% " +
              (cy - 8) +
              "% " +
              (cx + 4) +
              "% " +
              (s.y - 6) +
              "%"
          );
          path.setAttribute("class", "fa-edge");
          path.dataset.from = e.from;
          path.dataset.to = e.to;
          path.dataset.sym = e.label;
          edgesSvg.appendChild(path);
          var lab = document.createElementNS("http://www.w3.org/2000/svg", "text");
          lab.setAttribute("x", cx + "%");
          lab.setAttribute("y", cy - 6 + "%");
          lab.setAttribute("class", "fa-edge-label");
          lab.textContent = e.label;
          edgesSvg.appendChild(lab);
          return;
        }
        var line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line.setAttribute("d", e.path);
        line.setAttribute("class", "fa-edge");
        line.dataset.from = e.from;
        line.dataset.to = e.to;
        line.dataset.sym = e.label;
        line.setAttribute("fill", "none");
        edgesSvg.appendChild(line);
        var mid = e.path.match(/Q\s+([\d.]+)%\s+([\d.]+)%/);
        if (mid) {
          var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
          t.setAttribute("x", mid[1] + "%");
          t.setAttribute("y", mid[2] + "%");
          t.setAttribute("class", "fa-edge-label");
          t.textContent = e.label;
          edgesSvg.appendChild(t);
        }
      });

      STATES.forEach(function (n) {
        var btn = document.createElement("div");
        btn.className =
          "fa-node" +
          (n.accept ? " is-accept" : "") +
          (n.start ? " is-start" : "");
        btn.style.left = n.x + "%";
        btn.style.top = n.y + "%";
        btn.textContent = n.label;
        btn.dataset.id = n.id;
        btn.setAttribute("role", "listitem");
        nodesRoot.appendChild(btn);
        nodeEls[n.id] = btn;
      });
    }

    function paintTape() {
      if (!tapeRoot) return;
      tapeRoot.innerHTML = "";
      if (!input.length) {
        var empty = document.createElement("span");
        empty.className = "fa-tape-empty";
        empty.textContent = "ε (empty)";
        tapeRoot.appendChild(empty);
        return;
      }
      input.split("").forEach(function (ch, i) {
        var cell = document.createElement("span");
        cell.className = "fa-cell";
        cell.setAttribute("role", "listitem");
        if (i < pos) cell.classList.add("is-read");
        if (i === pos && pos < input.length) cell.classList.add("is-head");
        cell.textContent = ch;
        tapeRoot.appendChild(cell);
      });
    }

    function syncMeta() {
      if (posEl) posEl.textContent = String(pos);
      if (lenEl) lenEl.textContent = String(input.length);
    }

    function paintState(activeEdge) {
      Object.keys(nodeEls).forEach(function (id) {
        var el = nodeEls[id];
        el.classList.toggle("is-current", id === state);
        el.classList.toggle("is-pulse", id === state && !reduceMotion);
      });
      var edges = edgesSvg.querySelectorAll(".fa-edge");
      edges.forEach(function (el) {
        var on =
          activeEdge &&
          el.dataset.from === activeEdge.from &&
          el.dataset.to === activeEdge.to &&
          el.dataset.sym === activeEdge.sym;
        el.classList.toggle("is-active", Boolean(on));
      });
      paintTape();
      syncMeta();
    }

    function resetRun(keepInput) {
      stopPlay();
      if (!keepInput) {
        /* keep current field value */
      }
      input = String(inputEl.value || "").replace(/[^ab]/gi, "").toLowerCase();
      inputEl.value = input;
      state = "q0";
      pos = 0;
      busy = false;
      paintState(null);
      highlight("start");
      setBadge("ready", "ready");
      if (codeNote) {
        codeNote.innerHTML = "Start in <strong>q₀</strong>. Accepting state is <strong>q₂</strong>.";
      }
      setStatus(
        input.length
          ? "Ready at q₀ with \"" + input + "\". Step to read the next symbol."
          : "Empty string: already done — q₀ is not accepting (reject)."
      );
      if (!input.length) {
        highlight("accept");
        setBadge("reject", "reject");
        setStatus("ε rejected — q₀ ∉ F.");
      }
    }

    function finish() {
      var ok = state === "q2";
      highlight("accept");
      setBadge(ok ? "accept" : "reject", ok ? "accept" : "reject");
      paintState(null);
      if (codeNote) {
        codeNote.innerHTML = ok
          ? "Ended in <strong>q₂ ∈ F</strong> — accept."
          : "Ended in <strong>" + state + " ∉ F</strong> — reject.";
      }
      setStatus(
        ok
          ? "Accept: \"" + input + "\" ends in an accepting state."
          : "Reject: \"" + input + "\" ended in " + state + "."
      );
    }

    function stepOnce() {
      if (busy) return;
      if (pos >= input.length) {
        finish();
        stopPlay();
        return;
      }
      busy = true;
      var sym = input.charAt(pos);
      var next = (DELTA[state] && DELTA[state][sym]) || state;
      var from = state;
      highlight("delta");
      setBadge("δ", "run");
      paintState({ from: from, to: next, sym: sym });
      if (codeNote) {
        codeNote.innerHTML =
          "δ(<strong>" + from + "</strong>, <strong>" + sym + "</strong>) → <strong>" + next + "</strong>.";
      }
      setStatus("Read '" + sym + "': " + from + " → " + next + ".");

      window.setTimeout(
        function () {
          state = next;
          pos += 1;
          paintState(null);
          highlight("loop");
          busy = false;
          if (pos >= input.length) {
            finish();
            stopPlay();
          } else {
            setStatus("At " + state + ". Next symbol at position " + pos + ".");
          }
        },
        reduceMotion ? 0 : 280
      );
    }

    function stopPlay() {
      playing = false;
      if (playTimer) {
        window.clearInterval(playTimer);
        playTimer = null;
      }
      var playBtn = document.querySelector('[data-fa-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function togglePlay() {
      if (playing) {
        stopPlay();
        return;
      }
      if (pos >= input.length && input.length >= 0) {
        resetRun(true);
      }
      playing = true;
      var playBtn = document.querySelector('[data-fa-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";
      playTimer = window.setInterval(
        function () {
          if (busy) return;
          if (pos >= input.length) {
            finish();
            stopPlay();
            return;
          }
          stepOnce();
        },
        reduceMotion ? 200 : 650
      );
    }

    renderCode();
    paintMachine();
    resetRun(true);

    inputEl.addEventListener("change", function () {
      resetRun(true);
    });
    inputEl.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        resetRun(true);
      }
    });

    document.querySelectorAll("[data-fa-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-fa-action");
        if (action === "step") stepOnce();
        else if (action === "play") togglePlay();
        else if (action === "reset") resetRun(true);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFa);
  } else {
    initFa();
  }
})();
