/**
 * Interactive regex match highlighter.
 */
(function () {
  var DEFAULT_PATTERN = "\\b\\w+@\\w+\\.\\w+\\b";
  var DEFAULT_FLAGS = "gi";
  var DEFAULT_TEXT = "Contact alice@example.com or bob@test.org today.";

  var CODE_LINES = [
    { html: '<span class="code-type">RegExp</span> re = <span class="code-kw">new</span> RegExp(pat, flags);', id: "compile" },
    { html: '<span class="code-type">Match</span>[] hits = [];', id: "init" },
    { html: '<span class="code-kw">while</span> ((m = re.exec(text)) !== null) {', id: "loop" },
    { html: '  hits.push({ start: m.index, end: m.index + m[0].length });', id: "push" },
    { html: '  <span class="code-kw">if</span> (m[0].length === 0) re.lastIndex++;', id: "empty" },
    { html: '}' },
    { html: 'highlight(text, hits);', id: "paint" }
  ];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function initRegex() {
    var patternEl = document.getElementById("regex-pattern");
    var flagsEl = document.getElementById("regex-flags");
    var textEl = document.getElementById("regex-text");
    var preview = document.getElementById("regex-preview");
    var status = document.getElementById("regex-status");
    var badge = document.getElementById("regex-badge");
    var countEl = document.getElementById("regex-count");
    var codeRoot = document.getElementById("regex-code");
    var codeNote = document.getElementById("regex-code-note");
    if (!patternEl || !textEl || !preview) return;

    var lineEls = {};
    var debounce = null;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setCodeNote(html) {
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

    function sanitizeFlags(raw) {
      var allowed = "gimsuy";
      var seen = {};
      var out = "";
      String(raw || "")
        .toLowerCase()
        .split("")
        .forEach(function (c) {
          if (allowed.indexOf(c) !== -1 && !seen[c]) {
            seen[c] = true;
            out += c;
          }
        });
      if (out.indexOf("g") === -1) out += "g";
      return out;
    }

    function run() {
      var pat = patternEl.value;
      var flags = sanitizeFlags(flagsEl.value);
      flagsEl.value = flags;
      var text = textEl.value;
      highlight("compile");

      var re;
      try {
        re = new RegExp(pat, flags);
      } catch (err) {
        preview.innerHTML =
          '<span class="regex-error">' + escapeHtml(String(err.message)) + "</span>";
        if (countEl) countEl.textContent = "0";
        setBadge("error");
        setStatus("Invalid pattern: " + err.message);
        setCodeNote("Fix the pattern — RegExp constructor threw.");
        highlight("compile");
        return;
      }

      highlight("loop");
      var hits = [];
      var m;
      var guard = 0;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        hits.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
        if (m[0].length === 0) {
          re.lastIndex++;
          highlight("empty");
        }
        if (++guard > text.length + 50) break;
      }

      highlight("paint");
      var html = "";
      var cursor = 0;
      hits.forEach(function (h, i) {
        if (h.start > cursor) {
          html += escapeHtml(text.slice(cursor, h.start));
        }
        html +=
          '<mark class="regex-hit" data-i="' +
          i +
          '">' +
          escapeHtml(text.slice(h.start, h.end)) +
          "</mark>";
        cursor = h.end;
      });
      if (cursor < text.length) html += escapeHtml(text.slice(cursor));
      if (!text.length) html = '<span class="regex-empty">(empty string)</span>';
      preview.innerHTML = html || "&nbsp;";

      if (countEl) countEl.textContent = String(hits.length);
      setBadge(hits.length ? hits.length + " hit(s)" : "no match");
      setStatus(
        hits.length
          ? "Found " + hits.length + " match(es)."
          : "No matches for this pattern."
      );
      setCodeNote(
        hits.length
          ? "Highlighted <strong>" + hits.length + "</strong> span(s)."
          : "exec() returned null — no spans."
      );
      highlight("push");
    }

    function sample() {
      patternEl.value = "\\d{3}-\\d{4}";
      flagsEl.value = "g";
      textEl.value = "Call 555-0199 or 555-0100 before noon.";
      run();
    }

    function reset() {
      patternEl.value = DEFAULT_PATTERN;
      flagsEl.value = DEFAULT_FLAGS;
      textEl.value = DEFAULT_TEXT;
      run();
    }

    function schedule() {
      if (debounce) window.clearTimeout(debounce);
      debounce = window.setTimeout(run, 120);
    }

    renderCode();
    run();

    patternEl.addEventListener("input", schedule);
    flagsEl.addEventListener("input", schedule);
    textEl.addEventListener("input", schedule);

    document.querySelectorAll("[data-regex-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-regex-action");
        if (a === "run") run();
        else if (a === "sample") sample();
        else if (a === "reset") reset();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRegex);
  } else {
    initRegex();
  }
})();
