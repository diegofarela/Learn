/**
 * REST: map HTTP methods to collection/item resource paths.
 */
(function () {
  var CALLS = {
    GET: {
      path: "/books",
      highlight: "collection",
      status: "GET /books — list the collection (200 OK).",
      note: "Safe + idempotent: reading shouldn’t change state.",
      code: [
        "GET /books HTTP/1.1",
        "Host: api.example.com",
        "",
        "HTTP/1.1 200 OK",
        '[{"id":1,"title":"Ada"},{"id":2,"title":"Grace"}]'
      ]
    },
    POST: {
      path: "/books",
      highlight: "collection",
      status: "POST /books — create a new book (201 Created).",
      note: "POST to the collection; server assigns the id.",
      code: [
        "POST /books HTTP/1.1",
        'Content-Type: application/json',
        "",
        '{"title":"Alan"}',
        "",
        "HTTP/1.1 201 Created",
        "Location: /books/3"
      ]
    },
    PUT: {
      path: "/books/2",
      highlight: "item",
      itemId: "2",
      status: "PUT /books/2 — replace that resource (200 OK).",
      note: "Address the item; PUT is typically idempotent.",
      code: [
        "PUT /books/2 HTTP/1.1",
        'Content-Type: application/json',
        "",
        '{"title":"Grace Hopper"}',
        "",
        "HTTP/1.1 200 OK"
      ]
    },
    DELETE: {
      path: "/books/2",
      highlight: "item",
      itemId: "2",
      status: "DELETE /books/2 — remove that resource (204 No Content).",
      note: "Delete the named item; repeat is usually fine.",
      code: [
        "DELETE /books/2 HTTP/1.1",
        "",
        "HTTP/1.1 204 No Content"
      ]
    }
  };

  function initRest() {
    var pathEl = document.getElementById("rest-path");
    var tree = document.getElementById("rest-tree");
    var status = document.getElementById("rest-status");
    var meta = document.getElementById("rest-meta");
    var codeRoot = document.getElementById("rest-code");
    var codeNote = document.getElementById("rest-code-note");
    var buttons = document.querySelectorAll("[data-rest]");
    if (!pathEl || !buttons.length) return;

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lines.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className =
          "code-line" +
          (src === "" ? " is-dim" : i === 0 || src.indexOf("HTTP/1.1") === 0 ? " is-active" : "");
        el.innerHTML =
          '<span class="code-ln">' +
          (src ? i + 1 : "") +
          '</span><span class="code-src">' +
          src.replace(/</g, "&lt;") +
          "</span>";
        codeRoot.appendChild(el);
      });
    }

    function paintTree(call) {
      if (!tree) return;
      tree.innerHTML =
        '<div class="rest-node' +
        (call.highlight === "collection" ? " is-hit" : "") +
        '">' +
        '<span class="rest-node-path">/books</span>' +
        '<span class="rest-node-role">collection</span>' +
        "</div>" +
        '<div class="rest-node rest-node--child' +
        (call.highlight === "item" ? " is-hit" : "") +
        '">' +
        '<span class="rest-node-path">/books/' +
        (call.itemId || "id") +
        "</span>" +
        '<span class="rest-node-role">item</span>' +
        "</div>";
    }

    function select(method) {
      var call = CALLS[method] || CALLS.GET;
      buttons.forEach(function (btn) {
        btn.classList.toggle("is-selected", btn.getAttribute("data-rest") === method);
      });
      if (meta) meta.textContent = method;
      if (status) status.textContent = call.status;
      if (codeNote) codeNote.textContent = call.note;
      pathEl.innerHTML =
        '<span class="rest-method-tag">' +
        method +
        '</span><span class="rest-path-uri">' +
        call.path +
        "</span>";
      paintTree(call);
      renderCode(call.code);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          select(btn.getAttribute("data-rest"));
        } catch (err) {
          console.error("[learn-rest] Select failed", err);
        }
      });
    });

    select("GET");
  }

  try {
    initRest();
  } catch (err) {
    console.error("[learn-rest] Init failed", err);
  }
})();
