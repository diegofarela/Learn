/**
 * Probability basics: sample space highlight + independent coin flips.
 */
(function () {
  var OUTCOMES = ["HH", "HT", "TH", "TT"];

  var EVENTS = {
    all: {
      label: "Ω",
      set: OUTCOMES.slice(),
      note: "Entire sample space — probability 1."
    },
    firstH: {
      label: "1st = H",
      set: ["HH", "HT"],
      note: "First coin heads. Independent of second: size 2/4 = 1/2."
    },
    bothH: {
      label: "HH",
      set: ["HH"],
      note: "Both heads. Independence: (1/2)·(1/2) = 1/4."
    },
    same: {
      label: "same",
      set: ["HH", "TT"],
      note: "Matching faces. |A|/|Ω| = 2/4 = 1/2."
    },
    atLeastOneH: {
      label: "≥1 H",
      set: ["HH", "HT", "TH"],
      note: "Complement of TT: 1 − 1/4 = 3/4."
    }
  };

  function initProb() {
    var space = document.getElementById("prob-space");
    var status = document.getElementById("prob-status");
    var badge = document.getElementById("prob-badge");
    var meta = document.getElementById("prob-meta");
    var codeRoot = document.getElementById("prob-code");
    var codeNote = document.getElementById("prob-code-note");
    var flipBtn = document.getElementById("prob-flip");
    var eventGroup = document.querySelector(".prob-events");
    if (!space) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var eventId = "all";
    var sample = null;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function activeSet() {
      return EVENTS[eventId] ? EVENTS[eventId].set : OUTCOMES;
    }

    function refresh() {
      var ev = EVENTS[eventId] || EVENTS.all;
      var set = ev.set;
      var p = set.length / OUTCOMES.length;

      if (meta) meta.textContent = String(p);
      if (badge) badge.textContent = "P=" + p + " · |A|=" + set.length;

      space.innerHTML = "";
      OUTCOMES.forEach(function (o) {
        var cell = document.createElement("button");
        cell.type = "button";
        cell.className = "prob-cell";
        cell.textContent = o;
        cell.setAttribute("aria-label", "Outcome " + o);
        if (set.indexOf(o) >= 0) cell.classList.add("is-event");
        if (sample === o) {
          cell.classList.add("is-sample");
          if (!reduceMotion) cell.classList.add("is-pulse");
        }
        space.appendChild(cell);
      });

      if (codeRoot) {
        var lines = [
          "Ω = {HH, HT, TH, TT}",
          "A = {" + set.join(", ") + "}",
          "P(A) = |A|/|Ω| = " + set.length + "/4 = " + p,
          "independent coins ⇒ product rule"
        ];
        codeRoot.innerHTML = "";
        lines.forEach(function (text, i) {
          var row = document.createElement("div");
          row.className = "code-line" + (i === 2 ? " is-active" : "");
          var ln = document.createElement("span");
          ln.className = "code-ln";
          ln.textContent = String(i + 1);
          var src = document.createElement("span");
          src.className = "code-src";
          src.textContent = text;
          row.appendChild(ln);
          row.appendChild(src);
          codeRoot.appendChild(row);
        });
      }

      if (codeNote) {
        codeNote.innerHTML = "<strong>" + ev.label + "</strong> — " + ev.note;
      }

      if (sample) {
        var inEvent = set.indexOf(sample) >= 0;
        setStatus(
          "Sampled " +
            sample +
            (inEvent ? " ∈ A" : " ∉ A") +
            ". P(A) = " +
            p +
            "."
        );
      } else {
        setStatus(
          "Ω = {HH, HT, TH, TT}. Event “" +
            ev.label +
            "” has P = " +
            p +
            "."
        );
      }
    }

    if (eventGroup) {
      eventGroup.addEventListener("click", function (ev) {
        try {
          var btn = ev.target.closest("[data-prob-event]");
          if (!btn) return;
          eventId = btn.getAttribute("data-prob-event") || "all";
          eventGroup.querySelectorAll("[data-prob-event]").forEach(function (b) {
            b.classList.toggle("is-selected", b === btn);
          });
          refresh();
        } catch (err) {
          console.error("[learn-prob] Event select failed", err);
        }
      });
    }

    if (flipBtn) {
      flipBtn.addEventListener("click", function () {
        try {
          var i = Math.floor(Math.random() * OUTCOMES.length);
          sample = OUTCOMES[i];
          refresh();
        } catch (err) {
          console.error("[learn-prob] Flip failed", err);
        }
      });
    }

    refresh();
  }

  try {
    initProb();
  } catch (err) {
    console.error("[learn-prob] Init failed", err);
  }
})();
