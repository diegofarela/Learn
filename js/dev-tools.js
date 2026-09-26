(function () {
  var DEV_TOOLS_KEY = "learnDevToolsV1";
  var VIEWPORT_PRESETS = [
    { id: "phone", label: "Phone", width: 390 },
    { id: "phablet", label: "700", width: 700 },
    { id: "nav", label: "820", width: 820 },
    { id: "tablet", label: "960", width: 960 },
    { id: "desktop", label: "1280", width: 1280 }
  ];

  function isLocalHost() {
    var host = location.hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  }

  function envAllowsDevTools() {
    try {
      var env = window.__LEARN_ENV__;
      if (env && Object.prototype.hasOwnProperty.call(env, "DEV_TOOLS")) {
        return env.DEV_TOOLS === true;
      }
    } catch (err) {
      console.warn("[learn-dev-tools] Could not read __LEARN_ENV__", err);
    }
    return true;
  }

  function isDevToolsEnabled() {
    try {
      if (!envAllowsDevTools()) return false;
      var params = new URLSearchParams(location.search);
      if (params.get("embed") === "1" || params.get("dev") === "0") return false;
      if (params.get("dev") === "1") {
        try {
          localStorage.setItem(DEV_TOOLS_KEY, "1");
        } catch (err) {
          console.warn("[learn-dev-tools] Could not persist flag", err);
        }
        return true;
      }
      if (localStorage.getItem(DEV_TOOLS_KEY) === "1") return true;
      return isLocalHost();
    } catch (err) {
      console.warn("[learn-dev-tools] Could not resolve gate", err);
      return false;
    }
  }

  function embedPreviewUrl() {
    try {
      var url = new URL(location.href);
      url.searchParams.set("embed", "1");
      url.searchParams.delete("dev");
      url.searchParams.set("pv", String(Date.now()));
      return url.toString();
    } catch (err) {
      console.warn("[learn-dev-tools] Could not build embed URL", err);
      return location.pathname + "?embed=1&pv=" + Date.now();
    }
  }

  function closeViewportPreview(presetsEl) {
    var stage = document.getElementById("dev-viewport-stage");
    if (stage) stage.remove();
    document.documentElement.classList.remove("has-dev-viewport");
    if (presetsEl) {
      presetsEl.querySelectorAll("[data-width]").forEach(function (btn) {
        btn.classList.remove("is-active");
      });
    }
  }

  function openViewportPreview(width, label, button, presetsEl) {
    closeViewportPreview(presetsEl);
    document.documentElement.classList.add("has-dev-viewport");
    button.classList.add("is-active");

    var stage = document.createElement("div");
    stage.id = "dev-viewport-stage";
    stage.className = "dev-viewport-stage";
    stage.innerHTML =
      '<div class="dev-viewport-chrome">' +
      '<span class="dev-viewport-chrome-label">' +
      label +
      " · " +
      width +
      "px</span>" +
      '<button type="button" class="dev-viewport-close" aria-label="Close viewport preview">Close</button>' +
      "</div>" +
      '<div class="dev-viewport-frame-wrap" style="width:' +
      width +
      'px">' +
      '<iframe class="dev-viewport-frame" title="Viewport preview at ' +
      width +
      'px" src="' +
      embedPreviewUrl() +
      '"></iframe>' +
      "</div>";
    document.body.appendChild(stage);
    stage
      .querySelector(".dev-viewport-close")
      .addEventListener("click", function () {
        closeViewportPreview(presetsEl);
      });
  }

  function ensureDevTools() {
    if (!isDevToolsEnabled()) return;

    if (document.getElementById("dev-tools")) return;

    var root = document.createElement("aside");
    root.id = "dev-tools";
    root.className = "dev-tools";
    root.setAttribute("data-collapsed", "false");
    root.innerHTML =
      '<div class="dev-tools-bar">' +
      '<strong class="dev-tools-title">Dev tools</strong>' +
      '<span class="dev-tools-viewport-live" id="dev-tools-viewport-live" aria-live="polite"></span>' +
      '<button type="button" class="dev-tools-toggle" id="dev-tools-toggle" aria-expanded="true">Hide</button>' +
      "</div>" +
      '<div class="dev-tools-body" id="dev-tools-body">' +
      '<section class="dev-tools-section" aria-label="Viewport preview">' +
      '<h2 class="dev-tools-heading">Viewport</h2>' +
      '<p class="dev-tools-note">Presets open an iframe so <code>@media</code> rules fire. Close to return.</p>' +
      '<div class="dev-tools-presets" id="dev-tools-presets"></div>' +
      '<p class="dev-tools-hint">Localhost / Docker only (or <code>?dev=1</code>). <button type="button" class="dev-tools-link" id="dev-tools-disable">Turn off &amp; forget</button></p>' +
      "</section>" +
      "</div>";
    document.body.appendChild(root);

    var toggle = root.querySelector("#dev-tools-toggle");
    var live = root.querySelector("#dev-tools-viewport-live");
    var presetsEl = root.querySelector("#dev-tools-presets");
    var disableBtn = root.querySelector("#dev-tools-disable");

    function refreshLiveSize() {
      if (!live) return;
      live.textContent = window.innerWidth + "×" + window.innerHeight;
    }

    refreshLiveSize();
    window.addEventListener("resize", refreshLiveSize, { passive: true });

    toggle.addEventListener("click", function () {
      var collapsed = root.getAttribute("data-collapsed") === "true";
      root.setAttribute("data-collapsed", collapsed ? "false" : "true");
      toggle.setAttribute("aria-expanded", collapsed ? "true" : "false");
      toggle.textContent = collapsed ? "Hide" : "Show";
    });

    disableBtn.addEventListener("click", function () {
      try {
        localStorage.removeItem(DEV_TOOLS_KEY);
      } catch (err) {
        console.warn("[learn-dev-tools] Could not clear flag", err);
      }
      closeViewportPreview(presetsEl);
      root.remove();
    });

    VIEWPORT_PRESETS.forEach(function (preset) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dev-tools-preset";
      btn.dataset.width = String(preset.width);
      btn.textContent = preset.label;
      btn.title = preset.width + "px wide";
      btn.addEventListener("click", function () {
        openViewportPreview(preset.width, preset.label, btn, presetsEl);
      });
      presetsEl.appendChild(btn);
    });

    var clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "dev-tools-preset dev-tools-preset-clear";
    clearBtn.textContent = "Exit";
    clearBtn.addEventListener("click", function () {
      closeViewportPreview(presetsEl);
    });
    presetsEl.appendChild(clearBtn);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureDevTools);
  } else {
    ensureDevTools();
  }
})();
