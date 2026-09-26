/**
 * Test pyramid + failing unit test → fix → green.
 */
(function () {
  var LAYER_NOTES = {
    unit: "Unit: many fast checks of small pieces in isolation.",
    integration: "Integration: fewer tests wiring real modules together.",
    e2e: "E2E: thin tip — slow full-system paths through the UI."
  };

  function initTestpy() {
    var status = document.getElementById("testpy-status");
    var meta = document.getElementById("testpy-meta");
    var badge = document.getElementById("testpy-badge");
    var result = document.getElementById("testpy-result");
    var codeRoot = document.getElementById("testpy-code");
    var codeNote = document.getElementById("testpy-code-note");
    var pyramid = document.getElementById("testpy-pyramid");
    if (!result) return;

    var fixed = false;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function sum(a, b) {
      return fixed ? a + b : a + b + 1;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      var lines = fixed
        ? [
            "function sum(a, b) {",
            "  return a + b;  // fixed",
            "}",
            "",
            "test('adds', () => {",
            "  expect(sum(2, 3)).toBe(5);",
            "});"
          ]
        : [
            "function sum(a, b) {",
            "  return a + b + 1;  // bug",
            "}",
            "",
            "test('adds', () => {",
            "  expect(sum(2, 3)).toBe(5);",
            "});"
          ];
      lines.forEach(function (line) {
        var row = document.createElement("div");
        row.className = "code-line";
        if (line.indexOf("bug") !== -1 || line.indexOf("fixed") !== -1) {
          row.classList.add("is-active");
        }
        row.textContent = line;
        codeRoot.appendChild(row);
      });
    }

    function run() {
      var got = sum(2, 3);
      var pass = got === 5;
      if (result) {
        result.textContent = pass ? "PASS — got 5" : "FAIL — got " + got;
        result.classList.toggle("is-pass", pass);
        result.classList.toggle("is-fail", !pass);
      }
      if (meta) meta.textContent = pass ? "GREEN" : "RED";
      if (badge) badge.textContent = pass ? "passing" : "failing";
      var runEl = document.getElementById("testpy-run");
      if (runEl) {
        runEl.classList.toggle("is-pass", pass);
        runEl.classList.toggle("is-fail", !pass);
        if (!reduceMotion) {
          runEl.classList.remove("is-flash");
          void runEl.offsetWidth;
          runEl.classList.add("is-flash");
        }
      }
      setStatus(
        pass
          ? "Green — expectation matches implementation."
          : "Unit test is red — the implementation adds one too many."
      );
      if (codeNote) {
        codeNote.textContent = pass
          ? "Keep the suite green as you change code."
          : "Red → fix → green is the feedback loop.";
      }
      renderCode();
    }

    if (pyramid) {
      pyramid.querySelectorAll("[data-testpy-layer]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          pyramid.querySelectorAll("[data-testpy-layer]").forEach(function (b) {
            b.classList.remove("is-active");
          });
          btn.classList.add("is-active");
          var layer = btn.getAttribute("data-testpy-layer");
          setStatus(LAYER_NOTES[layer] || "");
        });
      });
    }

    document.querySelectorAll("[data-testpy-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-testpy-action");
        if (a === "fix") {
          fixed = true;
          run();
        } else if (a === "break") {
          fixed = false;
          run();
        } else if (a === "run") {
          run();
        }
      });
    });

    run();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTestpy);
  } else {
    initTestpy();
  }
})();
