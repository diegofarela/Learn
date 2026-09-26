/**
 * Renders "Also called" + "Not to be confused with" on concept pages.
 * Reads window.__LEARN_CLARITY__[id] and catalog for link targets.
 */
(function () {
  function conceptIdFromPath() {
    try {
      var path = String(window.location.pathname || "");
      var m = path.match(/\/concepts\/([^/]+)\.html$/i);
      if (m) return decodeURIComponent(m[1]);
      var parts = path.split("/");
      var last = parts[parts.length - 1] || "";
      if (/\.html$/i.test(last)) return last.replace(/\.html$/i, "");
    } catch (err) {
      console.error("[learn-clarity] path parse failed", err);
    }
    return null;
  }

  function hrefFor(id) {
    var cat = window.__LEARN_CATALOG__;
    if (cat && typeof cat.hrefFor === "function") {
      var href = cat.hrefFor(id, true);
      if (href) return href;
    }
    return id + ".html";
  }

  function nameFor(id) {
    var cat = window.__LEARN_CATALOG__;
    if (cat && typeof cat.byId === "function") {
      var c = cat.byId(id);
      if (c && c.name) return c.name;
    }
    return id;
  }

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function renderAka(aliases) {
    if (!aliases || !aliases.length) return null;
    var p = el("p", "aka");
    p.appendChild(el("span", "aka-label", "Also called"));
    var list = el("span", "aka-list");
    aliases.forEach(function (name, i) {
      if (i) list.appendChild(document.createTextNode(" · "));
      var abbr = document.createElement("abbr");
      abbr.className = "term aka-term";
      abbr.tabIndex = 0;
      abbr.textContent = name;
      abbr.title =
        "Another name for this same concept — not a different idea.";
      abbr.setAttribute(
        "data-def",
        "Another name for this same concept — not a different idea."
      );
      list.appendChild(abbr);
    });
    p.appendChild(list);
    return p;
  }

  function renderConfused(items) {
    if (!items || !items.length) return null;
    var section = el("section", "confused");
    section.setAttribute("aria-label", "Not to be confused with");
    section.appendChild(el("h2", null, "Not to be confused with"));
    var ul = el("ul", "confused-list");
    items.forEach(function (item) {
      if (!item || !item.note) return;
      var li = document.createElement("li");
      if (item.id) {
        var a = document.createElement("a");
        a.className = "concept-link";
        a.href = hrefFor(item.id);
        a.textContent = nameFor(item.id);
        li.appendChild(a);
      } else if (item.term) {
        var abbr = document.createElement("abbr");
        abbr.className = "term";
        abbr.tabIndex = 0;
        abbr.textContent = item.term;
        var def = item.termDef || item.note;
        abbr.title = def;
        abbr.setAttribute("data-def", def);
        li.appendChild(abbr);
      } else {
        return;
      }
      li.appendChild(document.createTextNode(" — " + item.note));
      ul.appendChild(li);
    });
    if (!ul.children.length) return null;
    section.appendChild(ul);
    return section;
  }

  function mount() {
    try {
      var id = conceptIdFromPath();
      if (!id) return;
      var metaAll = window.__LEARN_CLARITY__ || {};
      var meta = metaAll[id];
      if (!meta) {
        console.warn("[learn-clarity] No clarity meta for", id);
        return;
      }

      var aka = renderAka(meta.aliases);
      var confused = renderConfused(meta.confusedWith);

      var conceptMeta = document.querySelector(".concept-meta");
      if (aka && conceptMeta && conceptMeta.parentNode) {
        conceptMeta.parentNode.insertBefore(aka, conceptMeta.nextSibling);
      }

      if (confused) {
        var body = document.querySelector(".concept-body");
        var literature = body && body.querySelector(".verbatim");
        var mastery = body && body.querySelector(".mastery");
        var anchor = mastery || literature;
        if (body && anchor) {
          body.insertBefore(confused, anchor);
        } else if (body) {
          body.appendChild(confused);
        } else {
          var nav = document.querySelector(".concept-nav");
          if (nav && nav.parentNode) {
            nav.parentNode.insertBefore(confused, nav);
          }
        }
      }
    } catch (err) {
      console.error("[learn-clarity] mount failed", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
