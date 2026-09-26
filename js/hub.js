(function () {
  var root = document.getElementById("catalog-root");
  var catalog = window.__LEARN_CATALOG__;
  if (!root || !catalog) {
    console.error("[learn-hub] Missing catalog root or __LEARN_CATALOG__");
    return;
  }

  function renderPath(path) {
    var html =
      '<section class="learn-path" id="' +
      path.id +
      '" aria-labelledby="path-' +
      path.id +
      '">';
    html +=
      '<h2 class="topic-label" id="path-' +
      path.id +
      '">' +
      path.label +
      "</h2>";
    if (path.blurb) {
      html += '<p class="path-blurb">' + path.blurb + "</p>";
    }
    html += '<ol class="path-stages">';
    (path.stages || []).forEach(function (stage) {
      html +=
        '<li><h3 class="path-stage-name">' +
        stage.name +
        '</h3><ul class="path-concept-list">';
      (stage.ids || []).forEach(function (id) {
        var c = catalog.byId(id);
        if (!c) return;
        var href = catalog.hrefFor(id, false);
        if (c.status === "ready" && href) {
          html +=
            '<li><a href="' +
            href +
            '"><span class="name">' +
            c.name +
            "</span></a></li>";
        } else {
          html +=
            '<li class="soon"><span class="name">' +
            (c.name || id) +
            "</span></li>";
        }
      });
      html += "</ul></li>";
    });
    html += "</ol></section>";
    return html;
  }

  function render() {
    try {
      var html = "";
      var ready = 0;
      var total = 0;

      var paths = window.__LEARN_PATHS__ || [];
      paths.forEach(function (p) {
        html += renderPath(p);
      });

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
