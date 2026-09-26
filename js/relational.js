/**
 * Two tables with PK/FK — click or step to highlight relationships.
 */
(function () {
  var USERS = [
    { id: 1, name: "Ada" },
    { id: 2, name: "Grace" },
    { id: 3, name: "Alan" }
  ];
  var ORDERS = [
    { id: 10, user_id: 1, item: "book" },
    { id: 11, user_id: 1, item: "pen" },
    { id: 12, user_id: 2, item: "lamp" },
    { id: 13, user_id: 3, item: "tea" }
  ];

  function initRel() {
    var usersBody = document.getElementById("rel-users-body");
    var ordersBody = document.getElementById("rel-orders-body");
    var status = document.getElementById("rel-status");
    var meta = document.getElementById("rel-meta");
    var phase = document.getElementById("rel-phase");
    var link = document.getElementById("rel-link");
    var codeRoot = document.getElementById("rel-code");
    var codeNote = document.getElementById("rel-code-note");
    if (!usersBody || !ordersBody) return;

    var selectedUser = null;
    var selectedOrder = null;
    var cycleIdx = 0;

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lines.forEach(function (src, i) {
        var el = document.createElement("div");
        el.className = "code-line" + (i === lines.length - 1 ? " is-active" : "");
        el.innerHTML =
          '<span class="code-ln">' +
          (i + 1) +
          '</span><span class="code-src">' +
          src +
          "</span>";
        codeRoot.appendChild(el);
      });
    }

    function paint() {
      usersBody.innerHTML = "";
      USERS.forEach(function (u) {
        var tr = document.createElement("tr");
        tr.dataset.userId = String(u.id);
        if (selectedUser === u.id) tr.classList.add("is-pk-hit");
        if (
          selectedOrder !== null &&
          ORDERS.some(function (o) {
            return o.id === selectedOrder && o.user_id === u.id;
          })
        ) {
          tr.classList.add("is-pk-hit");
        }
        tr.innerHTML =
          '<td class="is-pk">' + u.id + "</td><td>" + u.name + "</td>";
        tr.addEventListener("click", function () {
          try {
            selectUser(u.id);
          } catch (err) {
            console.error("[learn-rel] Select user failed", err);
          }
        });
        usersBody.appendChild(tr);
      });

      ordersBody.innerHTML = "";
      ORDERS.forEach(function (o) {
        var tr = document.createElement("tr");
        tr.dataset.orderId = String(o.id);
        var linked =
          selectedUser === o.user_id || selectedOrder === o.id;
        if (linked) tr.classList.add("is-fk-hit");
        tr.innerHTML =
          '<td class="is-pk">' +
          o.id +
          '</td><td class="is-fk">' +
          o.user_id +
          "</td><td>" +
          o.item +
          "</td>";
        tr.addEventListener("click", function () {
          try {
            selectOrder(o.id);
          } catch (err) {
            console.error("[learn-rel] Select order failed", err);
          }
        });
        ordersBody.appendChild(tr);
      });

      if (link) link.classList.toggle("is-on", selectedUser !== null || selectedOrder !== null);
    }

    function selectUser(id) {
      selectedUser = id;
      selectedOrder = null;
      var name = USERS.find(function (u) {
        return u.id === id;
      }).name;
      var kids = ORDERS.filter(function (o) {
        return o.user_id === id;
      });
      if (meta) meta.textContent = "user " + id;
      if (phase) phase.textContent = "1 → N";
      if (status) {
        status.textContent =
          name +
          " (id=" +
          id +
          ") has " +
          kids.length +
          " order(s) via orders.user_id.";
      }
      renderCode([
        "users.id = " + id + "  -- PRIMARY KEY",
        "orders.user_id → users.id  -- FOREIGN KEY",
        "matched orders: " +
          kids
            .map(function (o) {
              return o.id;
            })
            .join(", ")
      ]);
      if (codeNote) {
        codeNote.innerHTML =
          "One user row → <strong>" + kids.length + "</strong> order row(s).";
      }
      paint();
    }

    function selectOrder(id) {
      var o = ORDERS.find(function (x) {
        return x.id === id;
      });
      selectedOrder = id;
      selectedUser = o.user_id;
      var u = USERS.find(function (x) {
        return x.id === o.user_id;
      });
      if (meta) meta.textContent = "order " + id;
      if (phase) phase.textContent = "N → 1";
      if (status) {
        status.textContent =
          "Order " + id + " (“" + o.item + "”) belongs to " + u.name + " via FK user_id.";
      }
      renderCode([
        "orders.id = " + id,
        "orders.user_id = " + o.user_id + "  -- FK",
        "→ users.id = " + u.id + " (" + u.name + ")  -- PK"
      ]);
      if (codeNote) {
        codeNote.innerHTML = "FK <strong>user_id</strong> must exist in users.id.";
      }
      paint();
    }

    function clear() {
      selectedUser = null;
      selectedOrder = null;
      if (meta) meta.textContent = "—";
      if (phase) phase.textContent = "pick a row";
      if (status) {
        status.textContent = "Click a user to see their orders via user_id → users.id.";
      }
      renderCode(["# click a row to see PK ↔ FK"]);
      if (codeNote) {
        codeNote.textContent = "Foreign keys enforce referential integrity across tables.";
      }
      paint();
    }

    document.querySelectorAll("[data-rel-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-rel-action");
          if (action === "reset") clear();
          else if (action === "next") {
            var o = ORDERS[cycleIdx % ORDERS.length];
            cycleIdx += 1;
            selectOrder(o.id);
          }
        } catch (err) {
          console.error("[learn-rel] Action failed", err);
        }
      });
    });

    clear();
  }

  try {
    initRel();
  } catch (err) {
    console.error("[learn-rel] Init failed", err);
  }
})();
