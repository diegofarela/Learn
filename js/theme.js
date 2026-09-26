(function () {
  var KEY = "learnThemeModeV1";
  var root = document.documentElement;
  var select = document.getElementById("theme-mode");

  function systemTheme() {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch (err) {
      return "light";
    }
  }

  function apply(mode) {
    var resolved = mode === "light" || mode === "dark" ? mode : systemTheme();
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
  }

  function read() {
    try {
      return localStorage.getItem(KEY) || "dark";
    } catch (err) {
      return "dark";
    }
  }

  function save(mode) {
    try {
      localStorage.setItem(KEY, mode);
    } catch (err) {}
  }

  var mode = read();
  if (select) select.value = mode;
  apply(mode);

  if (select) {
    select.addEventListener("change", function () {
      var next = select.value;
      save(next);
      apply(next);
    });
  }

  try {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function () {
        if (read() === "auto") apply("auto");
      });
  } catch (err) {}
})();
