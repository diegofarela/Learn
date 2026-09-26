/**
 * Interactive threat-model checklist: assets / adversaries / entry points.
 */
(function () {
  var GROUPS = {
    assets: [
      { id: "user-data", label: "User PII & messages" },
      { id: "creds", label: "Password hashes / tokens" },
      { id: "uptime", label: "Service availability" },
      { id: "keys", label: "Signing / encryption keys" }
    ],
    adversaries: [
      { id: "external", label: "External attacker on the internet" },
      { id: "insider", label: "Malicious or careless insider" },
      { id: "scripted", label: "Automated scanners / bots" },
      { id: "partner", label: "Compromised third-party vendor" }
    ],
    entries: [
      { id: "login", label: "Login & password reset forms" },
      { id: "api", label: "Public HTTP API" },
      { id: "admin", label: "Admin dashboard" },
      { id: "upload", label: "File upload endpoint" }
    ]
  };

  var SAMPLE = {
    assets: ["user-data", "creds", "keys"],
    adversaries: ["external", "scripted"],
    entries: ["login", "api"]
  };

  function initTm() {
    var status = document.getElementById("tm-status");
    var meta = document.getElementById("tm-meta");
    var badge = document.getElementById("tm-badge");
    var summary = document.getElementById("tm-summary");
    var codeRoot = document.getElementById("tm-code");
    var codeNote = document.getElementById("tm-code-note");
    if (!document.getElementById("tm-assets")) return;

    var selected = { assets: {}, adversaries: {}, entries: {} };

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function count() {
      var n = 0;
      Object.keys(selected).forEach(function (g) {
        Object.keys(selected[g]).forEach(function (k) {
          if (selected[g][k]) n++;
        });
      });
      return n;
    }

    function renderLists() {
      [
        ["assets", "tm-assets"],
        ["adversaries", "tm-adversaries"],
        ["entries", "tm-entries"]
      ].forEach(function (pair) {
        var group = pair[0];
        var root = document.getElementById(pair[1]);
        if (!root) return;
        root.innerHTML = "";
        GROUPS[group].forEach(function (item) {
          var li = document.createElement("li");
          var label = document.createElement("label");
          label.className = "tm-check";
          var input = document.createElement("input");
          input.type = "checkbox";
          input.checked = !!selected[group][item.id];
          input.setAttribute("data-tm-group", group);
          input.setAttribute("data-tm-id", item.id);
          input.addEventListener("change", function () {
            selected[group][item.id] = input.checked;
            sync();
          });
          var span = document.createElement("span");
          span.textContent = item.label;
          label.appendChild(input);
          label.appendChild(span);
          li.appendChild(label);
          root.appendChild(li);
        });
      });
    }

    function labelsFor(group) {
      return GROUPS[group]
        .filter(function (i) {
          return selected[group][i.id];
        })
        .map(function (i) {
          return i.label;
        });
    }

    function sync() {
      var n = count();
      if (meta) meta.textContent = String(n);
      if (badge) {
        badge.textContent = n === 0 ? "empty" : n + " selected";
      }

      var a = labelsFor("assets");
      var d = labelsFor("adversaries");
      var e = labelsFor("entries");

      if (summary) {
        if (n === 0) {
          summary.textContent = "Check items to outline what you must defend.";
        } else {
          summary.textContent =
            "Protect " +
            (a.length ? a.join(", ") : "(no assets)") +
            " from " +
            (d.length ? d.join(", ") : "(no adversaries)") +
            " via " +
            (e.length ? e.join(", ") : "(no entry points)") +
            ".";
        }
      }

      if (codeRoot) {
        codeRoot.innerHTML = "";
        function add(line) {
          var row = document.createElement("div");
          row.className = "code-line";
          row.textContent = line;
          codeRoot.appendChild(row);
        }
        add("threat_model:");
        add("  assets: " + JSON.stringify(a));
        add("  adversaries: " + JSON.stringify(d));
        add("  entry_points: " + JSON.stringify(e));
        if (a.length && d.length && e.length) {
          add("  next: map controls → auth, TLS, input checks");
        }
      }

      setStatus(
        n === 0
          ? "No items selected — start with what you care about protecting."
          : "Model updated — " + n + " item(s) in scope."
      );
      if (codeNote) {
        codeNote.textContent =
          n === 0
            ? "Threat modeling is a conversation, not a checkbox ritual."
            : "Prioritize mitigations for the checked surface.";
      }
    }

    document.querySelectorAll("[data-tm-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-tm-action");
        if (a === "clear") {
          selected = { assets: {}, adversaries: {}, entries: {} };
        } else if (a === "sample") {
          selected = { assets: {}, adversaries: {}, entries: {} };
          Object.keys(SAMPLE).forEach(function (g) {
            SAMPLE[g].forEach(function (id) {
              selected[g][id] = true;
            });
          });
        }
        renderLists();
        sync();
      });
    });

    renderLists();
    sync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTm);
  } else {
    initTm();
  }
})();
