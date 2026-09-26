/**
 * Toggle document / key-value / graph views of the same sample data.
 */
(function () {
  var MODELS = {
    document: {
      label: "document",
      lang: "JSON",
      status: "Document store: one JSON-like record embeds related fields.",
      note: "Embed what you read together; denormalize on purpose.",
      code: [
        '{',
        '  "_id": "user:1",',
        '  "name": "Ada",',
        '  "city": "London",',
        '  "orders": [',
        '    { "id": 10, "item": "book" },',
        '    { "id": 11, "item": "pen" }',
        '  ]',
        '}'
      ],
      view: "doc"
    },
    kv: {
      label: "key-value",
      lang: "KV",
      status: "Key-value: opaque blobs addressed by string keys.",
      note: "Great for caches and sessions; joins are your problem.",
      code: [
        'SET user:1:name   "Ada"',
        'SET user:1:city   "London"',
        'SET order:10      "user:1|book"',
        'SET order:11      "user:1|pen"',
        'SADD user:1:orders order:10 order:11'
      ],
      view: "kv"
    },
    graph: {
      label: "graph",
      lang: "Cypher-ish",
      status: "Graph: people and orders as nodes; PURCHASED as edges.",
      note: "Traverse relationships without rebuilding joins.",
      code: [
        '(Ada:User {id:1})',
        '(Book:Order {id:10})',
        '(Pen:Order {id:11})',
        '(Ada)-[:PURCHASED]->(Book)',
        '(Ada)-[:PURCHASED]->(Pen)'
      ],
      view: "graph"
    }
  };

  function initNosql() {
    var view = document.getElementById("nosql-view");
    var status = document.getElementById("nosql-status");
    var meta = document.getElementById("nosql-meta");
    var codeRoot = document.getElementById("nosql-code");
    var codeLang = document.getElementById("nosql-code-lang");
    var codeNote = document.getElementById("nosql-code-note");
    var buttons = document.querySelectorAll("[data-nosql-model]");
    if (!view || !buttons.length) return;

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lines.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className = "code-line is-active";
        el.innerHTML =
          '<span class="code-ln">' +
          (i + 1) +
          '</span><span class="code-src">' +
          src.replace(/</g, "&lt;") +
          "</span>";
        codeRoot.appendChild(el);
      });
    }

    function paintView(model) {
      view.className = "nosql-view nosql-view--" + model.view;
      view.innerHTML = "";
      if (model.view === "doc") {
        view.innerHTML =
          '<div class="nosql-card">' +
          '<span class="nosql-card-title">user:1</span>' +
          "<pre>name: Ada\ncity: London\norders: [book, pen]</pre>" +
          "</div>";
      } else if (model.view === "kv") {
        [
          ["user:1:name", "Ada"],
          ["user:1:city", "London"],
          ["order:10", "book"],
          ["order:11", "pen"]
        ].forEach(function (pair) {
          var row = document.createElement("div");
          row.className = "nosql-kv-row";
          row.innerHTML =
            '<span class="nosql-kv-key">' +
            pair[0] +
            '</span><span class="nosql-kv-val">' +
            pair[1] +
            "</span>";
          view.appendChild(row);
        });
      } else {
        view.innerHTML =
          '<div class="nosql-graph">' +
          '<span class="nosql-gnode" data-g="ada">Ada</span>' +
          '<span class="nosql-gedge">PURCHASED</span>' +
          '<span class="nosql-gnode" data-g="book">book</span>' +
          '<span class="nosql-gedge">PURCHASED</span>' +
          '<span class="nosql-gnode" data-g="pen">pen</span>' +
          "</div>";
      }
    }

    function select(id) {
      var model = MODELS[id] || MODELS.document;
      buttons.forEach(function (btn) {
        btn.classList.toggle(
          "is-selected",
          btn.getAttribute("data-nosql-model") === id
        );
      });
      if (meta) meta.textContent = model.label;
      if (status) status.textContent = model.status;
      if (codeLang) codeLang.textContent = model.lang;
      if (codeNote) codeNote.textContent = model.note;
      renderCode(model.code);
      paintView(model);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          select(btn.getAttribute("data-nosql-model"));
        } catch (err) {
          console.error("[learn-nosql] Model failed", err);
        }
      });
    });

    select("document");
  }

  try {
    initNosql();
  } catch (err) {
    console.error("[learn-nosql] Init failed", err);
  }
})();
