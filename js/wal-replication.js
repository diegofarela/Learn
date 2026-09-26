/**
 * WAL then replica catch-up demo.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-fn">append_WAL</span>(record); <span class="code-cm">/* fsync */</span>', id: "wal" },
    { html: '<span class="code-fn">update_page</span>(buffer);', id: "page" },
    { html: '<span class="code-kw">COMMIT</span>;', id: "commit" },
    { html: '<span class="code-fn">ship</span>(LSN…) → replica;', id: "ship" },
    { html: '<span class="code-fn">apply</span>(records); <span class="code-cm">/* catch up */</span>', id: "apply" }
  ];

  function initWal() {
    var layout = document.getElementById("wal-layout");
    var status = document.getElementById("wal-status");
    var badge = document.getElementById("wal-badge");
    var lsnLabel = document.getElementById("wal-lsn-label");
    var codeRoot = document.getElementById("wal-code");
    var codeNote = document.getElementById("wal-code-note");
    if (!layout) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var primaryLsn = 0;
    var replicaLsn = 0;
    var walRecords = [];
    var busy = false;
    var timers = [];
    var lineEls = {};

    function clearTimers() {
      timers.forEach(function (t) {
        window.clearTimeout(t);
      });
      timers = [];
    }

    function after(ms, fn) {
      if (reduceMotion) {
        fn();
        return;
      }
      timers.push(window.setTimeout(fn, ms));
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setLsn(n) {
      if (lsnLabel) lsnLabel.textContent = String(n);
    }

    function setNote(html) {
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

    function paint(focus) {
      layout.innerHTML = "";

      var primary = document.createElement("div");
      primary.className =
        "wal-node" + (focus === "primary" || focus === "wal" || focus === "page" ? " is-active" : "");
      primary.innerHTML =
        '<p class="wal-node-title">Primary</p>' +
        '<div class="wal-log" aria-label="WAL">' +
        (walRecords.length
          ? walRecords
              .map(function (r) {
                return (
                  '<span class="wal-rec' +
                  (r.lsn > replicaLsn ? " is-pending" : " is-shipped") +
                  '">LSN ' +
                  r.lsn +
                  ": " +
                  r.op +
                  "</span>"
                );
              })
              .join("")
          : '<span class="wal-empty">WAL empty</span>') +
        "</div>" +
        '<p class="wal-data">data pages · LSN ' +
        primaryLsn +
        "</p>";
      layout.appendChild(primary);

      var pipe = document.createElement("div");
      pipe.className = "wal-pipe" + (focus === "ship" ? " is-active" : "");
      pipe.setAttribute("aria-hidden", "true");
      pipe.textContent = "log ship →";
      layout.appendChild(pipe);

      var replica = document.createElement("div");
      replica.className = "wal-node" + (focus === "replica" ? " is-active" : "");
      var lag = primaryLsn - replicaLsn;
      replica.innerHTML =
        '<p class="wal-node-title">Replica</p>' +
        '<p class="wal-data">applied through LSN ' +
        replicaLsn +
        "</p>" +
        '<p class="wal-lag">' +
        (lag === 0 ? "in sync" : "lag " + lag + " record" + (lag === 1 ? "" : "s")) +
        "</p>";
      layout.appendChild(replica);
    }

    function updateButtons() {
      document.querySelectorAll("[data-wal-action]").forEach(function (btn) {
        var a = btn.getAttribute("data-wal-action");
        if (a === "replicate") {
          btn.disabled = busy || replicaLsn >= primaryLsn;
        } else if (a === "commit") {
          btn.disabled = busy;
        }
      });
    }

    function reset() {
      clearTimers();
      busy = false;
      primaryLsn = 0;
      replicaLsn = 0;
      walRecords = [];
      setLsn(0);
      setBadge("idle");
      setStatus("Primary and replica start empty. Commit writes the WAL first.");
      setNote("Log durable before data pages; replica applies shipped records.");
      renderCode();
      highlight(null);
      paint(null);
      updateButtons();
    }

    function commit() {
      if (busy) return;
      busy = true;
      clearTimers();
      updateButtons();
      var next = primaryLsn + 1;
      var op = next % 2 === 1 ? "SET x=1" : "SET y=" + next;

      setBadge("WAL append");
      setStatus("Append change to WAL and fsync (durability first).");
      setNote("<strong>WAL</strong> before touching durable data pages.");
      highlight("wal");
      paint("wal");

      after(reduceMotion ? 0 : 450, function () {
        walRecords.push({ lsn: next, op: op });
        paint("wal");
        highlight("page");
        setBadge("update page");
        setStatus("Update in-memory data page (flush can wait).");
        setNote("<strong>Data page</strong> may lag the log on disk.");
        paint("page");
      });

      after(reduceMotion ? 0 : 900, function () {
        primaryLsn = next;
        setLsn(primaryLsn);
        highlight("commit");
        setBadge("committed");
        setStatus("COMMIT ok on primary. Replica still at LSN " + replicaLsn + ".");
        setNote("<strong>COMMIT</strong> after WAL is durable.");
        paint("primary");
        busy = false;
        updateButtons();
      });
    }

    function replicate() {
      if (busy || replicaLsn >= primaryLsn) return;
      busy = true;
      clearTimers();
      updateButtons();

      highlight("ship");
      setBadge("shipping");
      setStatus("Ship WAL records LSN " + (replicaLsn + 1) + "…" + primaryLsn + " to replica.");
      setNote("<strong>Ship</strong> log stream over the network.");
      paint("ship");

      after(reduceMotion ? 0 : 500, function () {
        highlight("apply");
        setBadge("applying");
        setStatus("Replica replays WAL — catch-up redo.");
        setNote("<strong>Apply</strong> records in LSN order.");
        paint("replica");
      });

      after(reduceMotion ? 0 : 1000, function () {
        replicaLsn = primaryLsn;
        setBadge("in sync");
        setStatus("Replica caught up to LSN " + replicaLsn + ".");
        setNote("Replica matches primary’s durable history.");
        paint("replica");
        busy = false;
        updateButtons();
      });
    }

    document.querySelectorAll("[data-wal-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-wal-action");
        if (action === "reset") reset();
        else if (action === "commit") commit();
        else if (action === "replicate") replicate();
      });
    });

    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWal);
  } else {
    initWal();
  }
})();
