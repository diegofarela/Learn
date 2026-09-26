(function () {
  var root = document.getElementById("catalog-root");
  var catalog = window.__LEARN_CATALOG__;
  if (!root || !catalog) {
    console.error("[learn-hub] Missing catalog root or __LEARN_CATALOG__");
    return;
  }

  function render() {
    try {
      var html = "";
      var ready = 0;
      var total = 0;

      catalog.topics.forEach(function (topic) {
        html +=
          '<section class="topic" id="' +
          topic.id +
          '" aria-labelledby="topic-' +
          topic.id +
          '">';
        html +=
          '<h2 class="topic-label" id="topic-' +
          topic.id +
          '">' +
          topic.label +
          "</h2>";
        html += '<ul class="concept-list">';

        topic.concepts.forEach(function (c) {
          total += 1;
          var isReady = c.status === "ready";
          if (isReady) ready += 1;

          if (isReady) {
            html +=
              '<li class="is-ready">' +
              '<a href="concepts/' +
              c.id +
              '.html">' +
              '<span class="name">' +
              c.name +
              "</span>" +
              '<span class="hint">' +
              c.hint +
              "</span>" +
              "</a></li>";
          } else {
            html +=
              '<li class="soon">' +
              '<span class="row">' +
              '<span class="name">' +
              c.name +
              "</span>" +
              '<span class="hint">' +
              c.hint +
              "</span>" +
              "</span></li>";
          }
        });

        html += "</ul></section>";
      });

      html =
        '<p class="catalog-progress" aria-live="polite">' +
        ready +
        " ready · " +
        total +
        " concepts mapped</p>" +
        html;

      root.innerHTML = html;
    } catch (err) {
      console.error("[learn-hub] Render failed", err);
      root.innerHTML =
        '<p class="lede">Could not load the concept catalog. Check the console.</p>';
    }
  }

  render();
})();
