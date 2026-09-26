/**
 * Educational web-vulnerability simulations (conceptual diagrams only).
 * No real exploit payloads or attack recipes.
 */
(function () {
  var KINDS = {
    xss: {
      label: "XSS",
      steps: [
        {
          note: "XSS concept: untrusted text is later treated as HTML/JS in the browser.",
          boxes: [
            { id: "user", label: "User input", sub: "comment field" },
            { id: "store", label: "App stores", sub: "as-is (unsafe)" },
            { id: "page", label: "Page renders", sub: "into DOM" }
          ],
          log: [
            "# Conceptual failure (not a payload)",
            "input → stored → rendered without encoding",
            "defense: encode on output · CSP"
          ]
        },
        {
          note: "Step 1 — Attacker submits text that looks like markup (concept only).",
          highlight: "user",
          boxes: [
            { id: "user", label: "User input", sub: "[marked-up text]" },
            { id: "store", label: "App stores", sub: "as-is (unsafe)" },
            { id: "page", label: "Page renders", sub: "into DOM" }
          ],
          log: [
            "SIM: attacker types markup-like content",
            "(no executable payload shown)"
          ]
        },
        {
          note: "Step 2 — App persists the string without treating it as untrusted.",
          highlight: "store",
          boxes: [
            { id: "user", label: "User input", sub: "[marked-up text]" },
            { id: "store", label: "App stores", sub: "raw string" },
            { id: "page", label: "Page renders", sub: "into DOM" }
          ],
          log: ["SIM: DB/row contains untrusted string", "trust boundary not marked"]
        },
        {
          note: "Step 3 — Another user’s browser interprets it as code — diagram only.",
          highlight: "page",
          boxes: [
            { id: "user", label: "User input", sub: "[marked-up text]" },
            { id: "store", label: "App stores", sub: "raw string" },
            { id: "page", label: "Victim browser", sub: "runs as script ✕" }
          ],
          log: [
            "SIM: render path fails to encode",
            "fix: HTML-encode · sanitize · CSP"
          ]
        }
      ]
    },
    csrf: {
      label: "CSRF",
      steps: [
        {
          note: "CSRF concept: browser auto-sends cookies to a site on cross-origin requests.",
          boxes: [
            { id: "evil", label: "Evil page", sub: "triggers request" },
            { id: "browser", label: "Browser", sub: "attaches cookies" },
            { id: "bank", label: "Target app", sub: "sees “logged-in” user" }
          ],
          log: [
            "# Conceptual failure (not a recipe)",
            "cross-site request + cookie session",
            "defense: CSRF token · SameSite"
          ]
        },
        {
          note: "Step 1 — Victim is logged into the target app (session cookie set).",
          highlight: "bank",
          boxes: [
            { id: "evil", label: "Evil page", sub: "idle" },
            { id: "browser", label: "Browser", sub: "has session cookie" },
            { id: "bank", label: "Target app", sub: "session active" }
          ],
          log: ["SIM: victim authenticated earlier"]
        },
        {
          note: "Step 2 — A third-party page causes the browser to hit the target.",
          highlight: "evil",
          boxes: [
            { id: "evil", label: "Evil page", sub: "form/img/nav" },
            { id: "browser", label: "Browser", sub: "sends cookies" },
            { id: "bank", label: "Target app", sub: "…" }
          ],
          log: ["SIM: cross-origin navigation/request"]
        },
        {
          note: "Step 3 — App acts on cookie identity without proving user intent.",
          highlight: "bank",
          boxes: [
            { id: "evil", label: "Evil page", sub: "triggered" },
            { id: "browser", label: "Browser", sub: "cookies attached" },
            { id: "bank", label: "Target app", sub: "action accepted ✕" }
          ],
          log: [
            "SIM: state-changing action without anti-forgery check",
            "fix: synchronizer token · SameSite=Lax/Strict"
          ]
        }
      ]
    },
    sqli: {
      label: "SQLi",
      steps: [
        {
          note: "SQLi concept: untrusted input is concatenated into a SQL string.",
          boxes: [
            { id: "input", label: "Form input", sub: "username field" },
            { id: "build", label: "String-build SQL", sub: "unsafe" },
            { id: "db", label: "Database", sub: "executes text" }
          ],
          log: [
            "# Conceptual failure (not a payload)",
            "sql = \"…\" + userInput",
            "defense: parameterized queries"
          ]
        },
        {
          note: "Step 1 — Input is meant to be data (a name), not query structure.",
          highlight: "input",
          boxes: [
            { id: "input", label: "Form input", sub: "[attacker-controlled]" },
            { id: "build", label: "String-build SQL", sub: "unsafe" },
            { id: "db", label: "Database", sub: "executes text" }
          ],
          log: ["SIM: treat all input as untrusted data"]
        },
        {
          note: "Step 2 — App glues the string into the query (the bug).",
          highlight: "build",
          boxes: [
            { id: "input", label: "Form input", sub: "[attacker-controlled]" },
            { id: "build", label: "String-build SQL", sub: "structure changed" },
            { id: "db", label: "Database", sub: "executes text" }
          ],
          log: [
            "SIM: query text altered by input",
            "(no injection string shown)"
          ]
        },
        {
          note: "Step 3 — Database runs whatever structure resulted — diagram only.",
          highlight: "db",
          boxes: [
            { id: "input", label: "Form input", sub: "[attacker-controlled]" },
            { id: "build", label: "String-build SQL", sub: "structure changed" },
            { id: "db", label: "Database", sub: "unexpected query ✕" }
          ],
          log: [
            "SIM: engine executes altered statement",
            "fix: bound parameters · ORM safely"
          ]
        }
      ]
    }
  };

  function initWv() {
    var kindEl = document.getElementById("wv-kind");
    var status = document.getElementById("wv-status");
    var meta = document.getElementById("wv-meta");
    var diagram = document.getElementById("wv-diagram");
    var codeRoot = document.getElementById("wv-code");
    var codeNote = document.getElementById("wv-code-note");
    if (!kindEl || !diagram) return;

    var step = 0;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function current() {
      return KINDS[kindEl.value] || KINDS.xss;
    }

    function render(s) {
      setStatus(s.note);
      if (meta) meta.textContent = current().label;
      diagram.innerHTML = "";
      var row = document.createElement("div");
      row.className = "wv-boxes";
      (s.boxes || []).forEach(function (b, i) {
        if (i > 0) {
          var arrow = document.createElement("div");
          arrow.className = "wv-arrow";
          arrow.setAttribute("aria-hidden", "true");
          arrow.textContent = "→";
          row.appendChild(arrow);
        }
        var box = document.createElement("div");
        box.className = "wv-box";
        if (s.highlight === b.id) box.classList.add("is-active");
        box.innerHTML =
          '<span class="wv-box-label"></span><span class="wv-box-sub"></span>';
        box.querySelector(".wv-box-label").textContent = b.label;
        box.querySelector(".wv-box-sub").textContent = b.sub;
        row.appendChild(box);
      });
      diagram.appendChild(row);

      if (codeRoot) {
        codeRoot.innerHTML = "";
        (s.log || []).forEach(function (line) {
          var el = document.createElement("div");
          el.className = "code-line";
          el.textContent = line;
          codeRoot.appendChild(el);
        });
      }
      if (codeNote) {
        codeNote.textContent =
          "Fix the trust boundary — never copy “attack strings” from demos.";
      }
    }

    function go(n) {
      var list = current().steps;
      step = Math.max(0, Math.min(n, list.length - 1));
      render(list[step]);
    }

    document.querySelectorAll("[data-wv-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-wv-action");
        if (a === "step") {
          var list = current().steps;
          if (step < list.length - 1) go(step + 1);
          else go(0);
        } else if (a === "reset") go(0);
      });
    });

    kindEl.addEventListener("change", function () {
      go(0);
    });

    go(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWv);
  } else {
    initWv();
  }
})();
