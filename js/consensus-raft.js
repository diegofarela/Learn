/**
 * Consensus (Raft): leader election + log replicate on 3 nodes.
 */
(function () {
  function init() {
    var nodesEl = document.getElementById("raft-nodes");
    var logEl = document.getElementById("raft-log");
    var status = document.getElementById("raft-status");
    var phase = document.getElementById("raft-phase");
    var meta = document.getElementById("raft-meta");
    var codeRoot = document.getElementById("raft-code");
    var codeNote = document.getElementById("raft-code-note");
    if (!nodesEl) return;

    var term = 1;
    var leader = null;
    var roles = { N1: "follower", N2: "follower", N3: "follower" };
    var logs = { N1: [], N2: [], N3: [] };
    var commit = 0;
    var pending = null;

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lines.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className = "code-line" + (i === lines.length - 1 ? " is-active" : "");
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
      if (meta) meta.textContent = String(term);
      if (phase) {
        phase.textContent = leader ? "LEADER " + leader : "FOLLOWERS";
      }

      nodesEl.innerHTML = "";
      ["N1", "N2", "N3"].forEach(function (id) {
        var d = document.createElement("div");
        d.className =
          "raft-node is-" +
          roles[id] +
          (roles[id] === "down" ? " is-down" : "");
        d.innerHTML =
          '<span class="raft-node-n">' +
          id +
          '</span><span class="raft-node-r">' +
          roles[id] +
          '</span><span class="raft-node-l">log [' +
          logs[id].join(", ") +
          "]</span>";
        nodesEl.appendChild(d);
      });

      if (logEl) {
        logEl.innerHTML =
          '<span class="raft-log-l">commit=' +
          commit +
          "</span>" +
          (pending
            ? '<span class="raft-log-p">pending: ' + pending + "</span>"
            : "");
      }
    }

    function elect() {
      var live = ["N1", "N2", "N3"].filter(function (id) {
        return roles[id] !== "down";
      });
      if (live.length < 2) {
        if (status) status.textContent = "Need a majority alive to elect.";
        return;
      }
      term += 1;
      live.forEach(function (id) {
        roles[id] = "follower";
      });
      leader = live[0];
      roles[leader] = "leader";
      pending = null;
      if (status) {
        status.textContent =
          leader + " won term " + term + " with a majority of votes.";
      }
      renderCode([
        "term ← " + term,
        leader + " RequestVote → majority",
        leader + " becomes leader"
      ]);
      if (codeNote) codeNote.textContent = "At most one leader per term.";
      paint();
    }

    function append() {
      if (!leader || roles[leader] === "down") {
        if (status) status.textContent = "No living leader — elect first.";
        return;
      }
      var cmd = "x=" + (logs[leader].length + 1);
      logs[leader].push(cmd);
      pending = cmd;
      if (status) {
        status.textContent = "Leader appended " + cmd + " — not committed yet.";
      }
      renderCode([
        "client → " + leader + ": " + cmd,
        "leader.log.append(" + cmd + ")",
        "await majority AppendEntries"
      ]);
      if (codeNote) {
        codeNote.textContent = "Entry is uncommitted until replicated to a majority.";
      }
      paint();
    }

    function replicate() {
      if (!leader || !pending) {
        if (status) status.textContent = "Nothing pending to replicate.";
        return;
      }
      var cmd = pending;
      ["N1", "N2", "N3"].forEach(function (id) {
        if (id === leader) return;
        if (roles[id] === "down") return;
        if (logs[id].indexOf(cmd) < 0) logs[id].push(cmd);
      });
      var copies = ["N1", "N2", "N3"].filter(function (id) {
        return roles[id] !== "down" && logs[id].indexOf(cmd) >= 0;
      }).length;
      if (copies >= 2) {
        commit = logs[leader].length;
        pending = null;
        if (status) {
          status.textContent =
            cmd + " replicated to " + copies + "/3 — committed.";
        }
        renderCode([
          "AppendEntries → followers",
          "acks = " + copies,
          "commitIndex ← " + commit
        ]);
        if (codeNote) codeNote.textContent = "Majority (2 of 3) must ack before commit.";
      } else {
        if (status) {
          status.textContent = "Only " + copies + " copies — not a majority yet.";
        }
      }
      paint();
    }

    function crash() {
      if (!leader) {
        if (status) status.textContent = "No leader to crash.";
        return;
      }
      roles[leader] = "down";
      if (status) {
        status.textContent = leader + " crashed. Elect a new leader from survivors.";
      }
      renderCode([leader + " unavailable", "followers miss heartbeats", "start election"]);
      leader = null;
      pending = null;
      if (codeNote) {
        codeNote.textContent = "Election timeout triggers a new term.";
      }
      paint();
    }

    function reset() {
      term = 1;
      leader = null;
      roles = { N1: "follower", N2: "follower", N3: "follower" };
      logs = { N1: [], N2: [], N3: [] };
      commit = 0;
      pending = null;
      if (status) {
        status.textContent = "Three followers. Elect a leader to accept client commands.";
      }
      renderCode([
        "roles: follower × 3",
        "term = 1",
        "log = []"
      ]);
      if (codeNote) codeNote.textContent = "Majority (2 of 3) must ack before commit.";
      paint();
    }

    document.querySelectorAll("[data-raft-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var a = btn.getAttribute("data-raft-action");
          if (a === "elect") elect();
          else if (a === "append") append();
          else if (a === "replicate") replicate();
          else if (a === "crash") crash();
          else if (a === "reset") reset();
        } catch (err) {
          console.error("[learn-raft] Action failed", err);
        }
      });
    });

    reset();
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-raft] Init failed", err);
  }
})();
