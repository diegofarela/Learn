/**
 * Canned SELECT / WHERE / JOIN with result-row highlighting.
 */
(function () {
  var USERS = [
    { id: 1, name: "Ada", city: "London" },
    { id: 2, name: "Grace", city: "Paris" },
    { id: 3, name: "Alan", city: "Paris" },
    { id: 4, name: "Edsger", city: "Amsterdam" }
  ];
  var ORDERS = [
    { id: 10, user_id: 1, item: "book" },
    { id: 11, user_id: 2, item: "pen" },
    { id: 12, user_id: 2, item: "lamp" },
    { id: 13, user_id: 3, item: "tea" }
  ];

  var QUERIES = {
    all: {
      sql: ["SELECT id, name, city", "FROM users;"],
      note: "Every user row is in the result.",
      status: "SELECT * — all four users match.",
      userIds: [1, 2, 3, 4],
      orderIds: [],
      result: function () {
        return USERS.map(function (u) {
          return u.id + " | " + u.name + " | " + u.city;
        });
      }
    },
    where: {
      sql: ["SELECT id, name, city", "FROM users", "WHERE city = 'Paris';"],
      note: "WHERE keeps only rows that pass the predicate.",
      status: "WHERE city = 'Paris' — Grace and Alan.",
      userIds: [2, 3],
      orderIds: [],
      result: function () {
        return USERS.filter(function (u) {
          return u.city === "Paris";
        }).map(function (u) {
          return u.id + " | " + u.name + " | " + u.city;
        });
      }
    },
    join: {
      sql: [
        "SELECT u.name, o.item",
        "FROM users u",
        "JOIN orders o ON o.user_id = u.id;"
      ],
      note: "JOIN pairs rows where the FK matches the PK.",
      status: "JOIN — each order glued to its user.",
      userIds: [1, 2, 3],
      orderIds: [10, 11, 12, 13],
      result: function () {
        return ORDERS.map(function (o) {
          var u = USERS.find(function (x) {
            return x.id === o.user_id;
          });
          return u.name + " | " + o.item;
        });
      }
    }
  };

  function initSql() {
    var queryEl = document.getElementById("sql-query");
    var usersBody = document.getElementById("sql-users");
    var ordersBody = document.getElementById("sql-orders");
    var resultEl = document.getElementById("sql-result");
    var status = document.getElementById("sql-status");
    var meta = document.getElementById("sql-meta");
    var codeRoot = document.getElementById("sql-code");
    var codeNote = document.getElementById("sql-code-note");
    if (!queryEl || !usersBody) return;

    var active = null;

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
          src +
          "</span>";
        codeRoot.appendChild(el);
      });
    }

    function paintTables() {
      var q = active ? QUERIES[active] : null;
      usersBody.innerHTML = "";
      USERS.forEach(function (u) {
        var tr = document.createElement("tr");
        if (q && q.userIds.indexOf(u.id) !== -1) tr.classList.add("is-hit");
        tr.innerHTML =
          "<td>" + u.id + "</td><td>" + u.name + "</td><td>" + u.city + "</td>";
        usersBody.appendChild(tr);
      });
      ordersBody.innerHTML = "";
      ORDERS.forEach(function (o) {
        var tr = document.createElement("tr");
        if (q && q.orderIds.indexOf(o.id) !== -1) tr.classList.add("is-hit");
        tr.innerHTML =
          "<td>" + o.id + "</td><td>" + o.user_id + "</td><td>" + o.item + "</td>";
        ordersBody.appendChild(tr);
      });
    }

    function run() {
      var key = queryEl.value;
      var q = QUERIES[key] || QUERIES.all;
      active = key;
      var rows = q.result();
      if (meta) meta.textContent = String(rows.length);
      if (status) status.textContent = q.status;
      if (codeNote) codeNote.textContent = q.note;
      renderCode(q.sql);
      if (resultEl) {
        resultEl.innerHTML =
          '<p class="sql-result-title">Result (' +
          rows.length +
          ")</p><pre>" +
          rows.join("\n") +
          "</pre>";
        resultEl.classList.add("is-ready");
      }
      paintTables();
    }

    function clear() {
      active = null;
      if (meta) meta.textContent = "0";
      if (status) {
        status.textContent = "Choose a query and press Run to highlight result rows.";
      }
      if (codeNote) {
        codeNote.textContent = "Declare the result set; the engine plans the scan.";
      }
      renderCode(["-- pick a query, then Run"]);
      if (resultEl) {
        resultEl.innerHTML = "";
        resultEl.classList.remove("is-ready");
      }
      paintTables();
    }

    queryEl.addEventListener("change", function () {
      try {
        renderCode((QUERIES[queryEl.value] || QUERIES.all).sql);
      } catch (err) {
        console.error("[learn-sql] Query change failed", err);
      }
    });

    document.querySelectorAll("[data-sql-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-sql-action");
          if (action === "run") run();
          else if (action === "reset") clear();
        } catch (err) {
          console.error("[learn-sql] Action failed", err);
        }
      });
    });

    clear();
  }

  try {
    initSql();
  } catch (err) {
    console.error("[learn-sql] Init failed", err);
  }
})();
