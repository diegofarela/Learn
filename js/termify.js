/**
 * Auto-wrap jargon in .concept-body:
 * - Catalog concept names → .concept-link (when not already linked)
 * - Glossary entries → .term with hover defs
 * Longest matches first; skips pre/code/abbr/a/script/style/svg.
 */
(function () {
  var SKIP = { A: 1, ABBR: 1, CODE: 1, PRE: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, SVG: 1, KBD: 1, SAMP: 1 };

  function conceptIdFromPath() {
    try {
      var path = String(window.location.pathname || "");
      var m = path.match(/\/concepts\/([^/]+)\.html$/i);
      if (m) return decodeURIComponent(m[1]);
    } catch (err) {}
    return null;
  }

  function buildMatchers() {
    var items = [];
    var glossary = window.__LEARN_GLOSSARY__ || {};
    Object.keys(glossary).forEach(function (term) {
      items.push({
        kind: "term",
        needle: term,
        def: glossary[term]
      });
    });

    var cat = window.__LEARN_CATALOG__;
    var selfId = conceptIdFromPath();
    if (cat && cat.topics) {
      cat.topics.forEach(function (topic) {
        (topic.concepts || []).forEach(function (c) {
          if (!c || !c.name || c.id === selfId) return;
          items.push({
            kind: "concept",
            needle: c.name,
            id: c.id,
            hint: c.hint || c.name
          });
          // Common short aliases embedded in clarity meta
        });
      });
    }

    var clarity = window.__LEARN_CLARITY__ || {};
    Object.keys(clarity).forEach(function (id) {
      if (id === selfId) return;
      var aliases = (clarity[id] && clarity[id].aliases) || [];
      aliases.forEach(function (alias) {
        if (!alias || alias.length < 4) return;
        // Skip parenthetical-heavy aliases for auto-link
        if (/\(/.test(alias)) return;
        items.push({
          kind: "concept",
          needle: alias,
          id: id,
          hint: "Same as " + (cat && cat.byId ? (cat.byId(id) || {}).name || id : id)
        });
      });
    });

    items.sort(function (a, b) {
      return b.needle.length - a.needle.length;
    });

    // Dedupe exact needles preferring concept over term
    var seen = {};
    var out = [];
    items.forEach(function (it) {
      var key = it.needle.toLowerCase();
      if (seen[key]) return;
      seen[key] = 1;
      out.push(it);
    });
    return out;
  }

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function isWordChar(ch) {
    return ch && /[A-Za-z0-9_\-]/.test(ch);
  }

  function findMatch(text, lower, matchers, from) {
    var best = null;
    for (var i = 0; i < matchers.length; i++) {
      var m = matchers[i];
      var idx = lower.indexOf(m.needle.toLowerCase(), from);
      if (idx < 0) continue;
      var end = idx + m.needle.length;
      var before = idx === 0 ? "" : text.charAt(idx - 1);
      var after = end >= text.length ? "" : text.charAt(end);
      // Prefer whole-word-ish boundaries
      if (isWordChar(before) || isWordChar(after)) continue;
      if (!best || idx < best.idx || (idx === best.idx && m.needle.length > best.m.needle.length)) {
        best = { idx: idx, end: end, m: m };
      }
    }
    return best;
  }

  function wrapTextNode(node, matchers, wrapped) {
    var text = node.nodeValue;
    if (!text || !/\S/.test(text)) return;
    var lower = text.toLowerCase();
    var frag = document.createDocumentFragment();
    var cursor = 0;
    var guard = 0;
    while (cursor < text.length && guard++ < 200) {
      var hit = findMatch(text, lower, matchers, cursor);
      if (!hit) {
        frag.appendChild(document.createTextNode(text.slice(cursor)));
        break;
      }
      if (hit.idx > cursor) {
        frag.appendChild(document.createTextNode(text.slice(cursor, hit.idx)));
      }
      var slice = text.slice(hit.idx, hit.end);
      var key = hit.m.kind + ":" + hit.m.needle.toLowerCase();
      // Only auto-wrap each needle once per page to avoid noise
      if (wrapped[key]) {
        frag.appendChild(document.createTextNode(slice));
      } else if (hit.m.kind === "concept") {
        var a = document.createElement("a");
        a.className = "concept-link";
        var cat = window.__LEARN_CATALOG__;
        a.href =
          cat && typeof cat.hrefFor === "function"
            ? cat.hrefFor(hit.m.id, true)
            : hit.m.id + ".html";
        a.textContent = slice;
        a.title = hit.m.hint || "";
        frag.appendChild(a);
        wrapped[key] = 1;
      } else {
        var abbr = document.createElement("abbr");
        abbr.className = "term";
        abbr.tabIndex = 0;
        abbr.textContent = slice;
        abbr.title = hit.m.def;
        abbr.setAttribute("data-def", hit.m.def);
        frag.appendChild(abbr);
        wrapped[key] = 1;
      }
      cursor = hit.end;
    }
    if (frag.childNodes.length) {
      node.parentNode.replaceChild(frag, node);
    }
  }

  function walk(root, matchers, wrapped) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (SKIP[p.tagName]) return NodeFilter.FILTER_REJECT;
        if (p.closest && (p.closest("pre, code, .code-panel, .aka, .confused, .mastery-label"))) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!/\S/.test(node.nodeValue || "")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      try {
        wrapTextNode(n, matchers, wrapped);
      } catch (err) {
        console.error("[learn-termify] wrap failed", err);
      }
    });
  }

  function enrichExistingLinks() {
    var cat = window.__LEARN_CATALOG__;
    if (!cat || typeof cat.byId !== "function") return;
    document.querySelectorAll("a.concept-link").forEach(function (a) {
      if (a.getAttribute("title")) return;
      var href = a.getAttribute("href") || "";
      var m = href.match(/(?:^|\/)([a-z0-9-]+)\.html$/i);
      if (!m) return;
      var c = cat.byId(m[1]);
      if (c && c.hint) a.setAttribute("title", c.hint);
    });
  }

  function run() {
    try {
      enrichExistingLinks();
      var body = document.querySelector(".concept-body");
      if (!body) return;
      var matchers = buildMatchers();
      if (!matchers.length) return;
      walk(body, matchers, Object.create(null));
    } catch (err) {
      console.error("[learn-termify] failed", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
