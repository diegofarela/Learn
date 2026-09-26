/**
 * Collapsible concept menu: left rail on desktop, hamburger drawer on mobile.
 */
(function () {
  var STORAGE_KEY = "learnSideNavCollapsedV1";
  var catalog = window.__LEARN_CATALOG__;
  if (!catalog || !catalog.topics) {
    console.error("[side-nav] Missing __LEARN_CATALOG__");
    return;
  }

  var header = document.querySelector(".site-header .nav-inner");
  if (!header) {
    console.error("[side-nav] Missing .site-header .nav-inner");
    return;
  }

  function inConceptsDir() {
    return /\/concepts\//.test(window.location.pathname.replace(/\\/g, "/"));
  }

  function conceptHref(id) {
    return inConceptsDir() ? id + ".html" : "concepts/" + id + ".html";
  }

  function hubHref() {
    return inConceptsDir() ? "../index.html" : "index.html";
  }

  function currentConceptId() {
    var path = window.location.pathname.replace(/\\/g, "/");
    var match = path.match(/\/concepts\/([^/]+?)(?:\.html)?\/?$/);
    return match ? match[1] : null;
  }

  function readCollapsed() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function saveCollapsed(collapsed) {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch (err) {}
  }

  var currentId = currentConceptId();
  var isHub = !currentId;

  var aside = document.createElement("aside");
  aside.className = "side-nav";
  aside.id = "side-nav";
  aside.setAttribute("aria-label", "Concept menu");

  var head = document.createElement("div");
  head.className = "side-nav-head";

  var titleLink = document.createElement("a");
  titleLink.className = "side-nav-title";
  titleLink.href = hubHref();
  titleLink.textContent = "Concepts";

  var collapseBtn = document.createElement("button");
  collapseBtn.type = "button";
  collapseBtn.className = "side-nav-collapse";
  collapseBtn.setAttribute("aria-controls", "side-nav");
  collapseBtn.setAttribute("aria-label", "Collapse menu");

  head.appendChild(titleLink);
  head.appendChild(collapseBtn);
  aside.appendChild(head);

  var scroll = document.createElement("div");
  scroll.className = "side-nav-scroll";

  var hubItem = document.createElement("a");
  hubItem.className = "side-nav-hub" + (isHub ? " is-current" : "");
  hubItem.href = hubHref();
  hubItem.textContent = "All topics";
  if (isHub) hubItem.setAttribute("aria-current", "page");
  scroll.appendChild(hubItem);

  catalog.topics.forEach(function (topic) {
    var ready = topic.concepts.filter(function (c) {
      return c.status === "ready";
    });
    if (!ready.length) return;

    var group = document.createElement("div");
    group.className = "side-nav-group";

    var label = document.createElement("p");
    label.className = "side-nav-group-label";
    label.textContent = topic.label;
    group.appendChild(label);

    var list = document.createElement("ul");
    list.className = "side-nav-list";

    ready.forEach(function (c) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = conceptHref(c.id);
      a.textContent = c.name;
      a.title = c.hint || c.name;
      if (c.id === currentId) {
        a.className = "is-current";
        a.setAttribute("aria-current", "page");
      }
      li.appendChild(a);
      list.appendChild(li);
    });

    group.appendChild(list);
    scroll.appendChild(group);
  });

  aside.appendChild(scroll);

  var backdrop = document.createElement("button");
  backdrop.type = "button";
  backdrop.className = "side-nav-backdrop";
  backdrop.setAttribute("aria-label", "Close menu");
  backdrop.hidden = true;

  var burger = document.createElement("button");
  burger.type = "button";
  burger.className = "side-nav-burger";
  burger.setAttribute("aria-controls", "side-nav");
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-label", "Open menu");
  burger.innerHTML = "<span></span><span></span><span></span>";

  document.body.insertBefore(aside, document.body.firstChild);
  document.body.insertBefore(backdrop, aside.nextSibling);
  header.appendChild(burger);

  var mqMobile = window.matchMedia("(max-width: 900px)");

  function setCollapsed(collapsed) {
    document.documentElement.classList.remove("side-nav-boot-collapsed");
    document.body.classList.toggle("side-nav-collapsed", collapsed);
    scroll.setAttribute("aria-hidden", collapsed ? "true" : "false");
    titleLink.setAttribute("aria-hidden", collapsed ? "true" : "false");
    titleLink.tabIndex = collapsed ? -1 : 0;
    collapseBtn.setAttribute(
      "aria-label",
      collapsed ? "Expand menu" : "Collapse menu"
    );
    collapseBtn.setAttribute("aria-expanded", String(!collapsed));
    if (!mqMobile.matches) saveCollapsed(collapsed);
  }

  function setMobileOpen(open) {
    document.body.classList.toggle("side-nav-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    backdrop.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }

  function syncViewport() {
    document.documentElement.classList.remove("side-nav-boot-collapsed");
    if (mqMobile.matches) {
      document.body.classList.remove("side-nav-collapsed");
      setMobileOpen(false);
    } else {
      setMobileOpen(false);
      setCollapsed(readCollapsed());
    }
  }

  collapseBtn.addEventListener("click", function () {
    if (mqMobile.matches) {
      setMobileOpen(false);
      return;
    }
    setCollapsed(!document.body.classList.contains("side-nav-collapsed"));
  });

  burger.addEventListener("click", function () {
    setMobileOpen(!document.body.classList.contains("side-nav-open"));
  });

  backdrop.addEventListener("click", function () {
    setMobileOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("side-nav-open")) {
      setMobileOpen(false);
    }
  });

  aside.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      if (mqMobile.matches) setMobileOpen(false);
    });
  });

  if (typeof mqMobile.addEventListener === "function") {
    mqMobile.addEventListener("change", syncViewport);
  } else if (typeof mqMobile.addListener === "function") {
    mqMobile.addListener(syncViewport);
  }

  syncViewport();

  var currentLink = aside.querySelector("a.is-current");
  if (currentLink && !mqMobile.matches) {
    try {
      currentLink.scrollIntoView({ block: "center", behavior: "instant" });
    } catch (err) {
      currentLink.scrollIntoView(false);
    }
  }
})();
