/**
 * CAP theorem: pick 2 of Consistency / Availability / Partition tolerance.
 */
(function () {
  var LABELS = {
    C: "Consistency — reads see the latest write",
    A: "Availability — every request gets a timely response",
    P: "Partition tolerance — survive network splits"
  };

  var PRESETS = {
    CA: { C: true, A: true, P: false },
    CP: { C: true, A: false, P: true },
    AP: { C: false, A: true, P: true }
  };

  function initCap() {
    var nodes = document.querySelectorAll("[data-cap]");
    var verdict = document.getElementById("cap-verdict");
    var status = document.getElementById("cap-status");
    var meta = document.getElementById("cap-meta");
    var phase = document.getElementById("cap-phase");
    var codeRoot = document.getElementById("cap-code");
    var codeNote = document.getElementById("cap-code-note");
    if (!nodes.length) return;

    var state = { C: true, A: true, P: false };

    function selectedKeys() {
      return ["C", "A", "P"].filter(function (k) {
        return state[k];
      });
    }

    function comboName(keys) {
      return keys.join("") || "—";
    }

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
      var keys = selectedKeys();
      nodes.forEach(function (btn) {
        var k = btn.getAttribute("data-cap");
        var on = !!state[k];
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });

      if (meta) meta.textContent = String(keys.length);
      var name = comboName(keys);
      if (phase) phase.textContent = name || "none";

      var msg;
      var lines;
      if (keys.length === 3) {
        msg = "Impossible under partition — drop C or A.";
        lines = [
          "C + A + P selected",
          "network split ⇒ cannot serve latest data AND stay up everywhere"
        ];
        if (verdict) verdict.textContent = "CAP forbids all three during a partition.";
        if (codeNote) {
          codeNote.innerHTML = "Pick a <strong>2-of-3</strong> corner instead.";
        }
      } else if (name === "CA") {
        msg = "CA — works when the network is healthy; partitions break the model.";
        lines = [
          "Consistency + Availability",
          "assumes no partition (single site / ignored P)"
        ];
        if (verdict) verdict.textContent = "CA — fine without a network split.";
        if (codeNote) codeNote.textContent = "Classic single-node SQL often looks CA.";
      } else if (name === "CP") {
        msg = "CP — prefer correct data; may refuse requests on the minority side.";
        lines = [
          "Consistency + Partition tolerance",
          "on split: reject or block until quorum"
        ];
        if (verdict) verdict.textContent = "CP — consistent, may be unavailable.";
        if (codeNote) codeNote.textContent = "Many consensus / quorum systems lean CP.";
      } else if (name === "AP") {
        msg = "AP — stay up on both sides; replicas may diverge until healed.";
        lines = [
          "Availability + Partition tolerance",
          "on split: serve possibly stale answers"
        ];
        if (verdict) verdict.textContent = "AP — available, eventually consistent.";
        if (codeNote) codeNote.textContent = "DNS-like and many KV stores lean AP.";
      } else if (keys.length === 1) {
        msg = "Only " + keys[0] + " — add one more property.";
        lines = [LABELS[keys[0]], "need a second guarantee"];
        if (verdict) verdict.textContent = "Choose a second property.";
        if (codeNote) codeNote.textContent = "Useful corners are CA, CP, or AP.";
      } else {
        msg = "Select two properties to form CA, CP, or AP.";
        lines = ["# toggle C, A, P", "# or use the CP / AP / CA presets"];
        if (verdict) verdict.textContent = "No pair selected.";
        if (codeNote) {
          codeNote.textContent = "Real systems soften “C” and “A”; CAP is a forcing function.";
        }
      }

      if (status) status.textContent = msg;
      renderCode(lines);
    }

    function toggle(key) {
      var next = !state[key];
      var trial = { C: state.C, A: state.A, P: state.P };
      trial[key] = next;
      var count = ["C", "A", "P"].filter(function (k) {
        return trial[k];
      }).length;
      /* Allow momentarily selecting all three so the UI can explain impossibility */
      state[key] = next;
      if (count > 3) return;
      paint();
    }

    function applyPreset(name) {
      var p = PRESETS[name];
      if (!p) return;
      state = { C: p.C, A: p.A, P: p.P };
      paint();
    }

    nodes.forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          toggle(btn.getAttribute("data-cap"));
        } catch (err) {
          console.error("[learn-cap] Toggle failed", err);
        }
      });
    });

    document.querySelectorAll("[data-cap-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          applyPreset(btn.getAttribute("data-cap-preset"));
        } catch (err) {
          console.error("[learn-cap] Preset failed", err);
        }
      });
    });

    var resetBtn = document.querySelector("[data-cap-action='reset']");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        try {
          applyPreset("CA");
        } catch (err) {
          console.error("[learn-cap] Reset failed", err);
        }
      });
    }

    paint();
  }

  try {
    initCap();
  } catch (err) {
    console.error("[learn-cap] Init failed", err);
  }
})();
