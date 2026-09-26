/**
 * Interactive backtracking demo: 4-Queens with try / fail / undo.
 */
(function () {
  var N = 4;

  var CODE_LINES = [
    { html: '<span class="code-type">int</span> board[N]; <span class="code-cm">/* col per row */</span>', id: "board" },
    { html: '<span class="code-type">bool</span> <span class="code-fn">solve</span>(<span class="code-type">int</span> row) {', id: "sig" },
    { html: '  <span class="code-kw">if</span> (row == N) <span class="code-kw">return</span> <span class="code-kw">true</span>;', id: "base" },
    { blank: true },
    { html: '  <span class="code-kw">for</span> (<span class="code-type">int</span> col = <span class="code-num">0</span>; col &lt; N; col++) {', id: "for" },
    { html: '    <span class="code-kw">if</span> (!safe(row, col)) <span class="code-kw">continue</span>;', id: "check" },
    { html: '    board[row] = col; <span class="code-cm">/* try */</span>', id: "place" },
    { html: '    <span class="code-kw">if</span> (solve(row + <span class="code-num">1</span>)) <span class="code-kw">return</span> <span class="code-kw">true</span>;', id: "recur" },
    { html: '    <span class="code-cm">/* fail → undo */</span>', id: "undo" },
    { html: '  }' },
    { html: '  <span class="code-kw">return</span> <span class="code-kw">false</span>;', id: "fail" },
    { html: '}' }
  ];

  function isSafe(board, row, col) {
    var r;
    for (r = 0; r < row; r++) {
      var c = board[r];
      if (c === col) return false;
      if (Math.abs(c - col) === Math.abs(r - row)) return false;
    }
    return true;
  }

  function buildScript() {
    var steps = [];
    var board = [-1, -1, -1, -1];

    function snapshot() {
      return board.slice();
    }

    function placedCount() {
      var n = 0;
      var i;
      for (i = 0; i < N; i++) if (board[i] >= 0) n += 1;
      return n;
    }

    function solve(row) {
      if (row === N) {
        steps.push({
          kind: "done",
          line: "base",
          phase: "done",
          note: "All four rows safe — solution found.",
          status: "Solved: " + board.map(function (c, r) {
            return "R" + r + "→C" + c;
          }).join(", ") + ".",
          board: snapshot(),
          tryCell: null,
          failCell: null,
          placed: N
        });
        return true;
      }

      steps.push({
        kind: "enter",
        line: "sig",
        phase: "row",
        note: "Place a queen in <strong>row " + row + "</strong>.",
        status: "Row " + row + ": try columns 0…" + (N - 1) + ".",
        board: snapshot(),
        tryCell: null,
        failCell: null,
        placed: placedCount(),
        row: row
      });

      var col;
      for (col = 0; col < N; col++) {
        steps.push({
          kind: "for",
          line: "for",
          phase: "try",
          note: "Try column <strong>" + col + "</strong> in row " + row + ".",
          status: "Consider (" + row + ", " + col + ").",
          board: snapshot(),
          tryCell: [row, col],
          failCell: null,
          placed: placedCount(),
          row: row
        });

        var safe = isSafe(board, row, col);
        steps.push({
          kind: "check",
          line: "check",
          phase: safe ? "safe" : "fail",
          note: safe
            ? "(" + row + ", " + col + ") is <strong>safe</strong>."
            : "(" + row + ", " + col + ") <strong>attacks</strong> an earlier queen — skip.",
          status: safe
            ? "Safe at (" + row + ", " + col + ")."
            : "Conflict at (" + row + ", " + col + ").",
          board: snapshot(),
          tryCell: [row, col],
          failCell: safe ? null : [row, col],
          placed: placedCount(),
          row: row
        });

        if (!safe) continue;

        board[row] = col;
        steps.push({
          kind: "place",
          line: "place",
          phase: "place",
          note: "Place queen at <strong>(" + row + ", " + col + ")</strong>.",
          status: "Place Q at (" + row + ", " + col + ").",
          board: snapshot(),
          tryCell: [row, col],
          failCell: null,
          placed: placedCount(),
          row: row,
          pulse: [row, col]
        });

        steps.push({
          kind: "recur",
          line: "recur",
          phase: "recur",
          note: "Recurse to row " + (row + 1) + ".",
          status: "solve(" + (row + 1) + ").",
          board: snapshot(),
          tryCell: null,
          failCell: null,
          placed: placedCount(),
          row: row
        });

        if (solve(row + 1)) return true;

        board[row] = -1;
        steps.push({
          kind: "undo",
          line: "undo",
          phase: "undo",
          note:
            "Backtrack: remove queen from <strong>(" +
            row +
            ", " +
            col +
            ")</strong>.",
          status: "Undo (" + row + ", " + col + "). Try next column.",
          board: snapshot(),
          tryCell: null,
          failCell: [row, col],
          placed: placedCount(),
          row: row
        });
      }

      steps.push({
        kind: "fail-row",
        line: "fail",
        phase: "fail",
        note: "No safe column in row " + row + " — return false.",
        status: "Row " + row + " exhausted. Backtrack further.",
        board: snapshot(),
        tryCell: null,
        failCell: null,
        placed: placedCount(),
        row: row
      });
      return false;
    }

    steps.push({
      kind: "init",
      line: "board",
      phase: "init",
      note: "Empty 4×4 board. Place one queen per row.",
      status: "Start solve(0).",
      board: snapshot(),
      tryCell: null,
      failCell: null,
      placed: 0
    });

    solve(0);
    return steps;
  }

  function initBacktracking() {
    var boardRoot = document.getElementById("bt-board");
    var status = document.getElementById("bt-status");
    var placedEl = document.getElementById("bt-placed");
    var phaseEl = document.getElementById("bt-phase");
    var codeRoot = document.getElementById("bt-code");
    var codeNote = document.getElementById("bt-code-note");
    if (!boardRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var steps = buildScript();
    var index = -1;
    var busy = false;
    var playing = false;
    var playTimer = null;
    var lineEls = {};
    var cells = [];

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

    function paintBoard() {
      boardRoot.innerHTML = "";
      cells = [];
      var r;
      var c;
      for (r = 0; r < N; r++) {
        cells[r] = [];
        for (c = 0; c < N; c++) {
          var cell = document.createElement("div");
          cell.className =
            "bt-cell" + ((r + c) % 2 === 0 ? " is-light" : " is-dark");
          cell.dataset.row = String(r);
          cell.dataset.col = String(c);
          boardRoot.appendChild(cell);
          cells[r][c] = cell;
        }
      }
    }

    function applyState(step) {
      var board = step.board || [-1, -1, -1, -1];
      var r;
      var c;
      for (r = 0; r < N; r++) {
        for (c = 0; c < N; c++) {
          var el = cells[r][c];
          var hasQueen = board[r] === c;
          var isTry =
            step.tryCell && step.tryCell[0] === r && step.tryCell[1] === c;
          var isFail =
            step.failCell && step.failCell[0] === r && step.failCell[1] === c;
          el.className =
            "bt-cell" + ((r + c) % 2 === 0 ? " is-light" : " is-dark");
          el.textContent = "";
          if (hasQueen) {
            el.classList.add("is-queen");
            el.textContent = "♛";
          }
          if (isTry && !hasQueen) el.classList.add("is-try");
          if (isFail) el.classList.add("is-fail");
          if (
            step.pulse &&
            step.pulse[0] === r &&
            step.pulse[1] === c &&
            !reduceMotion
          ) {
            el.classList.add("is-pulse");
          }
        }
      }
      if (placedEl) placedEl.textContent = String(step.placed || 0);
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
      var playBtn = document.querySelector('[data-bt-action="play"]');
      if (playBtn) playBtn.textContent = "Play";
    }

    function stepOnce() {
      if (busy) return false;
      if (index >= steps.length - 1) {
        stopPlay();
        setStatus("Finished. Reset to search again.");
        return false;
      }
      busy = true;
      try {
        index += 1;
        applyState(steps[index]);
      } catch (err) {
        console.error("[learn-backtracking] Step failed", {
          index: index,
          err: err
        });
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
      var playBtn = document.querySelector('[data-bt-action="play"]');
      if (playBtn) playBtn.textContent = "Pause";

      function tick() {
        if (!playing) return;
        var more = stepOnce();
        if (!more) {
          stopPlay();
          return;
        }
        playTimer = window.setTimeout(tick, reduceMotion ? 60 : 480);
      }
      tick();
    }

    function reset() {
      stopPlay();
      index = -1;
      paintBoard();
      if (placedEl) placedEl.textContent = "0";
      highlight(null);
      Object.keys(lineEls).forEach(function (key) {
        lineEls[key].classList.remove("is-active", "is-dim");
      });
      setPhase("ready");
      setCodeNote(
        "Press <strong>Step</strong> or <strong>Play</strong> — try, check, fail, undo light up on the board."
      );
      setStatus("Ready. Step to try placing a queen in row 0.");
    }

    document.querySelectorAll("[data-bt-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-bt-action");
        if (action === "step") {
          stopPlay();
          stepOnce();
        } else if (action === "play") play();
        else if (action === "reset") reset();
      });
    });

    renderCode();
    paintBoard();
    reset();
  }

  try {
    initBacktracking();
  } catch (err) {
    console.error("[learn-backtracking] Init failed", err);
  }
})();
