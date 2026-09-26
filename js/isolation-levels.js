/**
 * Isolation levels: dirty / nonrepeatable / phantom demos.
 */
(function () {
  var LEVELS = {
    ru: { label: "RU", name: "Read Uncommitted", dirty: true, nonrep: true, phantom: true },
    rc: { label: "RC", name: "Read Committed", dirty: false, nonrep: true, phantom: true },
    rr: { label: "RR", name: "Repeatable Read", dirty: false, nonrep: false, phantom: true },
    s: { label: "S", name: "Serializable", dirty: false, nonrep: false, phantom: false }
  };

  var DEMOS = {
    dirty: {
      title: "Dirty read",
      allowedKey: "dirty",
      allowNote: "T2 reads T1’s uncommitted write.",
      blockNote: "Level blocks reading uncommitted data.",
      schedule: [
        { html: "T1: BEGIN; UPDATE bal=50; <span class=\"code-cm\">/* uncommitted */</span>", id: "w" },
        { html: "T2: SELECT bal; <span class=\"code-cm\">/* sees 50? */</span>", id: "r" },
        { html: "T1: ROLLBACK;", id: "rb" }
      ],
      view: function (allowed) {
        return {
          t1: "wrote 50 (uncommitted)",
          t2: allowed ? "read 50 ★ dirty" : "blocked / sees 100",
          row: allowed ? "bal=50 (dirty)" : "bal=100 (committed)"
        };
      }
    },
    nonrep: {
      title: "Nonrepeatable read",
      allowedKey: "nonrep",
      allowNote: "T2’s second read sees T1’s committed update.",
      blockNote: "Same row stays stable for T2’s transaction.",
      schedule: [
        { html: "T2: SELECT bal → 100;", id: "r1" },
        { html: "T1: UPDATE bal=80; COMMIT;", id: "w" },
        { html: "T2: SELECT bal → ?;", id: "r2" }
      ],
      view: function (allowed) {
        return {
          t1: "committed bal=80",
          t2: allowed ? "1st 100, 2nd 80 ★" : "both reads 100",
          row: allowed ? "changed under T2" : "snapshot stable"
        };
      }
    },
    phantom: {
      title: "Phantom read",
      allowedKey: "phantom",
      allowNote: "T2’s range query picks up a new row T1 inserted.",
      blockNote: "Range is locked / predicate stable — no new row.",
      schedule: [
        { html: "T2: SELECT COUNT(*) WHERE age&gt;20 → 2;", id: "r1" },
        { html: "T1: INSERT row age=25; COMMIT;", id: "ins" },
        { html: "T2: SELECT COUNT(*) → ?;", id: "r2" }
      ],
      view: function (allowed) {
        return {
          t1: "inserted age=25",
          t2: allowed ? "count 2 → 3 ★ phantom" : "count stays 2",
          row: allowed ? "new row in range" : "predicate locked"
        };
      }
    }
  };

  function initIso() {
    var levelEl = document.getElementById("iso-level");
    var view = document.getElementById("iso-view");
    var status = document.getElementById("iso-status");
    var levelLabel = document.getElementById("iso-level-label");
    var codeRoot = document.getElementById("iso-code");
    var codeNote = document.getElementById("iso-code-note");
    if (!levelEl || !view) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var lineEls = {};
    var currentDemo = null;

    function level() {
      return LEVELS[levelEl.value] || LEVELS.rc;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function updateLevelLabel() {
      if (levelLabel) levelLabel.textContent = level().label;
    }

    function renderSchedule(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      (lines || [{ html: "<span class=\"code-cm\">/* pick an anomaly */</span>" }]).forEach(
        function (line, i) {
          var row = document.createElement("div");
          row.className = "code-line";
          row.dataset.line = String(i + 1);
          row.innerHTML = line.html || "&nbsp;";
          if (line.id) {
            row.dataset.id = line.id;
            lineEls[line.id] = row;
          }
          codeRoot.appendChild(row);
        }
      );
    }

    function highlightAll() {
      Object.keys(lineEls).forEach(function (k) {
        lineEls[k].classList.add("is-active");
      });
    }

    function paintIdle() {
      view.innerHTML =
        '<p class="iso-idle">T1 and T2 share a row. Pick Dirty / Nonrepeatable / Phantom.</p>';
      renderSchedule(null);
      setNote("Allowed anomalies depend on the selected level.");
      setStatus("Choose a level and an anomaly to see if it is allowed.");
      document.querySelectorAll("[data-iso-demo]").forEach(function (b) {
        b.classList.remove("is-selected");
      });
      currentDemo = null;
    }

    function runDemo(key) {
      var demo = DEMOS[key];
      if (!demo) return;
      currentDemo = key;
      var lvl = level();
      var allowed = !!lvl[demo.allowedKey];
      var v = demo.view(allowed);

      document.querySelectorAll("[data-iso-demo]").forEach(function (b) {
        b.classList.toggle("is-selected", b.getAttribute("data-iso-demo") === key);
      });

      view.innerHTML = "";
      view.className = "iso-view" + (allowed ? " is-anomaly" : " is-safe");
      if (!reduceMotion) view.classList.add("is-flash");

      var verdict = document.createElement("p");
      verdict.className = "iso-verdict" + (allowed ? " is-bad" : " is-ok");
      verdict.textContent = allowed
        ? demo.title + " ALLOWED under " + lvl.name
        : demo.title + " PREVENTED under " + lvl.name;
      view.appendChild(verdict);

      var grid = document.createElement("div");
      grid.className = "iso-grid";
      grid.innerHTML =
        '<div class="iso-card"><span class="iso-card-title">T1</span><span class="iso-card-body">' +
        v.t1 +
        '</span></div><div class="iso-card"><span class="iso-card-title">T2</span><span class="iso-card-body">' +
        v.t2 +
        '</span></div><div class="iso-card iso-card-wide"><span class="iso-card-title">Visible state</span><span class="iso-card-body">' +
        v.row +
        "</span></div>";
      view.appendChild(grid);

      renderSchedule(demo.schedule);
      highlightAll();
      setNote(allowed ? demo.allowNote : demo.blockNote);
      setStatus(
        allowed
          ? demo.title + " can happen at " + lvl.label + "."
          : demo.title + " cannot happen at " + lvl.label + "."
      );

      if (!reduceMotion) {
        window.setTimeout(function () {
          view.classList.remove("is-flash");
        }, 400);
      }
    }

    levelEl.addEventListener("change", function () {
      updateLevelLabel();
      if (currentDemo) runDemo(currentDemo);
      else {
        setStatus(level().name + " selected. Run an anomaly demo.");
      }
    });

    document.querySelectorAll("[data-iso-demo]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        runDemo(btn.getAttribute("data-iso-demo"));
      });
    });

    document.querySelectorAll("[data-iso-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("data-iso-action") === "reset") {
          updateLevelLabel();
          paintIdle();
        }
      });
    });

    updateLevelLabel();
    paintIdle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initIso);
  } else {
    initIso();
  }
})();
