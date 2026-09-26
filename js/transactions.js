/**
 * BEGIN → updates → COMMIT/ROLLBACK with ACID checklist.
 */
(function () {
  function initTxn() {
    var endingEl = document.getElementById("txn-ending");
    var accounts = document.getElementById("txn-accounts");
    var acid = document.getElementById("txn-acid");
    var status = document.getElementById("txn-status");
    var meta = document.getElementById("txn-meta");
    var codeRoot = document.getElementById("txn-code");
    var codeNote = document.getElementById("txn-code-note");
    if (!endingEl || !accounts) return;

    var step = 0;
    var alice = 200;
    var bob = 100;
    var playTimer = null;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function ending() {
      return endingEl.value === "rollback" ? "rollback" : "commit";
    }

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lines.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className =
          "code-line" +
          (src.indexOf("--") === 0 ? " is-dim" : i === lines.length - 1 ? " is-active" : "");
        el.innerHTML =
          '<span class="code-ln">' +
          (i + 1) +
          '</span><span class="code-src">' +
          src +
          "</span>";
        codeRoot.appendChild(el);
      });
    }

    function setAcid(activeKeys) {
      if (!acid) return;
      acid.querySelectorAll("[data-acid]").forEach(function (li) {
        var key = li.getAttribute("data-acid");
        li.classList.toggle("is-on", activeKeys.indexOf(key) !== -1);
      });
    }

    function paintAccounts(a, b, dirty) {
      accounts.innerHTML = "";
      [
        { name: "Alice", bal: a, id: "alice" },
        { name: "Bob", bal: b, id: "bob" }
      ].forEach(function (acc) {
        var el = document.createElement("div");
        el.className = "txn-acct" + (dirty ? " is-dirty" : "");
        el.innerHTML =
          '<span class="txn-acct-name">' +
          acc.name +
          '</span><span class="txn-acct-bal">$' +
          acc.bal +
          "</span>";
        accounts.appendChild(el);
      });
      var sum = document.createElement("p");
      sum.className = "txn-sum";
      sum.textContent = "total $" + (a + b) + (dirty ? " (uncommitted)" : "");
      accounts.appendChild(sum);
    }

    function paint() {
      if (meta) meta.textContent = String(step);
      var end = ending();

      if (step === 0) {
        alice = 200;
        bob = 100;
        paintAccounts(alice, bob, false);
        setAcid([]);
        if (status) status.textContent = "Ready — press Step to BEGIN a $50 transfer.";
        renderCode(["-- accounts: Alice $200, Bob $100"]);
        if (codeNote) codeNote.textContent = "Either every statement sticks, or none do.";
      } else if (step === 1) {
        paintAccounts(alice, bob, false);
        setAcid(["I"]);
        if (status) status.textContent = "BEGIN — transaction open; isolation starts.";
        renderCode(["BEGIN;"]);
        if (codeNote) codeNote.innerHTML = "<strong>Isolation</strong>: changes are private for now.";
      } else if (step === 2) {
        alice = 150;
        paintAccounts(alice, bob, true);
        setAcid(["I"]);
        if (status) status.textContent = "Debit Alice $50 (not committed yet).";
        renderCode([
          "BEGIN;",
          "UPDATE accounts SET bal = bal - 50 WHERE name = 'Alice';"
        ]);
      } else if (step === 3) {
        bob = 150;
        paintAccounts(alice, bob, true);
        setAcid(["A", "C", "I"]);
        if (status) {
          status.textContent =
            "Credit Bob $50 — total still $300 (consistency). Atomicity pending end.";
        }
        renderCode([
          "BEGIN;",
          "UPDATE … Alice −50;",
          "UPDATE accounts SET bal = bal + 50 WHERE name = 'Bob';"
        ]);
        if (codeNote) {
          codeNote.innerHTML =
            "<strong>Consistency</strong>: conservation invariant still holds inside the txn.";
        }
      } else if (step === 4) {
        if (end === "commit") {
          paintAccounts(150, 150, false);
          setAcid(["A", "C", "I", "D"]);
          if (status) status.textContent = "COMMIT — changes durable; ACID satisfied.";
          renderCode([
            "BEGIN;",
            "UPDATE … Alice −50;",
            "UPDATE … Bob +50;",
            "COMMIT;"
          ]);
          if (codeNote) {
            codeNote.innerHTML =
              "<strong>Durability</strong>: committed state survives a crash.";
          }
        } else {
          alice = 200;
          bob = 100;
          paintAccounts(alice, bob, false);
          setAcid(["A", "C", "I"]);
          if (status) {
            status.textContent = "ROLLBACK — balances restored; atomicity preserved.";
          }
          renderCode([
            "BEGIN;",
            "UPDATE … Alice −50;",
            "UPDATE … Bob +50;",
            "ROLLBACK;"
          ]);
          if (codeNote) {
            codeNote.innerHTML =
              "<strong>Atomicity</strong>: none of the updates remain.";
          }
        }
      } else {
        if (end === "commit") {
          paintAccounts(150, 150, false);
          setAcid(["A", "C", "I", "D"]);
          if (status) status.textContent = "Done — Alice $150, Bob $150 after COMMIT.";
        } else {
          paintAccounts(200, 100, false);
          setAcid(["A", "C", "I"]);
          if (status) status.textContent = "Done — world unchanged after ROLLBACK.";
        }
        renderCode([end === "commit" ? "-- committed" : "-- rolled back"]);
      }
    }

    function go(next) {
      step = Math.max(0, Math.min(5, next));
      paint();
    }

    function stepOnce() {
      if (step >= 5) {
        go(0);
        go(1);
        return;
      }
      go(step + 1);
    }

    function play() {
      clearPlay();
      if (step >= 5) go(0);
      function tick() {
        if (step >= 5) {
          clearPlay();
          return;
        }
        stepOnce();
        playTimer = setTimeout(tick, reduceMotion ? 0 : 700);
      }
      tick();
    }

    endingEl.addEventListener("change", function () {
      try {
        clearPlay();
        if (step >= 4) go(4);
        else paint();
      } catch (err) {
        console.error("[learn-txn] Ending failed", err);
      }
    });

    document.querySelectorAll("[data-txn-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-txn-action");
          clearPlay();
          if (action === "reset") go(0);
          else if (action === "step") stepOnce();
          else if (action === "play") play();
        } catch (err) {
          console.error("[learn-txn] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    initTxn();
  } catch (err) {
    console.error("[learn-txn] Init failed", err);
  }
})();
