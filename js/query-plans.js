/**
 * Query plans: SQL → operator tree with cost intuition.
 */
(function () {
  var PLANS = {
    scan: {
      total: 420,
      label: "seq",
      ops: [
        { id: "scan-o", name: "Seq Scan", detail: "orders", cost: 180, sql: "from" },
        { id: "filter", name: "Filter", detail: "city = 'NY'", cost: 40, sql: "where" },
        { id: "scan-c", name: "Seq Scan", detail: "customers", cost: 120, sql: "from" },
        { id: "join", name: "Hash Join", detail: "o.cid = c.id", cost: 80, sql: "join" }
      ],
      tree: function (active) {
        return [
          { id: "join", level: 0 },
          { id: "filter", level: 1 },
          { id: "scan-o", level: 2 },
          { id: "scan-c", level: 1 }
        ].map(function (n) {
          return { id: n.id, level: n.level, active: active === n.id };
        });
      }
    },
    index: {
      total: 95,
      label: "index",
      ops: [
        { id: "idx-c", name: "Index Scan", detail: "customers (city)", cost: 25, sql: "where" },
        { id: "idx-o", name: "Index Scan", detail: "orders (cid)", cost: 35, sql: "from" },
        { id: "join", name: "Nested Loop", detail: "o.cid = c.id", cost: 35, sql: "join" }
      ],
      tree: function (active) {
        return [
          { id: "join", level: 0 },
          { id: "idx-c", level: 1 },
          { id: "idx-o", level: 1 }
        ].map(function (n) {
          return { id: n.id, level: n.level, active: active === n.id };
        });
      }
    }
  };

  var SQL_LINES = [
    { html: '<span class="code-kw">SELECT</span> *', id: "select" },
    { html: '<span class="code-kw">FROM</span> orders o', id: "from" },
    { html: '<span class="code-kw">JOIN</span> customers c <span class="code-kw">ON</span> o.cid = c.id', id: "join" },
    { html: '<span class="code-kw">WHERE</span> c.city = <span class="code-str">\'NY\'</span>;', id: "where" }
  ];

  function initQp() {
    var tree = document.getElementById("qp-tree");
    var planEl = document.getElementById("qp-plan");
    var status = document.getElementById("qp-status");
    var costLabel = document.getElementById("qp-cost-label");
    var codeRoot = document.getElementById("qp-code");
    var codeNote = document.getElementById("qp-code-note");
    if (!tree || !planEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var step = 0;
    var playTimer = null;
    var lineEls = {};

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function plan() {
      return PLANS[planEl.value] || PLANS.scan;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      SQL_LINES.forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        row.innerHTML = line.html || "&nbsp;";
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        codeRoot.appendChild(row);
      });
    }

    function highlightSql(id) {
      Object.keys(lineEls).forEach(function (k) {
        lineEls[k].classList.remove("is-active");
      });
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function findOp(id) {
      var ops = plan().ops;
      for (var i = 0; i < ops.length; i++) {
        if (ops[i].id === id) return ops[i];
      }
      return null;
    }

    function paint(activeId) {
      var p = plan();
      var nodes = p.tree(activeId);
      tree.innerHTML = "";

      var sum = document.createElement("p");
      sum.className = "qp-total";
      sum.textContent = "est. cost " + p.total + (p.label === "index" ? " · cheaper" : " · baseline");
      tree.appendChild(sum);

      nodes.forEach(function (n) {
        var op = findOp(n.id);
        if (!op) return;
        var el = document.createElement("div");
        el.className =
          "qp-node" +
          (n.active ? " is-active" : "") +
          " qp-level-" +
          n.level;
        var pct = Math.round((op.cost / p.total) * 100);
        el.innerHTML =
          '<div class="qp-node-main">' +
          '<span class="qp-node-name">' +
          op.name +
          '</span><span class="qp-node-detail">' +
          op.detail +
          '</span></div><div class="qp-cost-bar" aria-hidden="true"><span style="width:' +
          pct +
          '%"></span></div><span class="qp-node-cost">cost ' +
          op.cost +
          "</span>";
        tree.appendChild(el);
      });

      if (costLabel) {
        costLabel.textContent = String(p.total);
      }
    }

    function paintStep() {
      var p = plan();
      if (step <= 0) {
        paint(null);
        highlightSql(null);
        setStatus("Query: orders ⋈ customers WHERE city = 'NY'. Step the plan.");
        setNote("Operators execute bottom-up; cost is relative intuition.");
        return;
      }
      var idx = Math.min(step, p.ops.length) - 1;
      var op = p.ops[idx];
      paint(op.id);
      highlightSql(op.sql);
      setStatus(op.name + " on " + op.detail + " · local cost " + op.cost + ".");
      setNote(
        "<strong>" +
          op.name +
          "</strong> contributes ~" +
          Math.round((op.cost / p.total) * 100) +
          "% of this plan’s cost."
      );
    }

    function reset() {
      clearPlay();
      step = 0;
      renderCode();
      paintStep();
    }

    function stepOnce() {
      var p = plan();
      if (step >= p.ops.length) step = 0;
      step += 1;
      paintStep();
    }

    function play() {
      clearPlay();
      function tick() {
        stepOnce();
        if (step < plan().ops.length) {
          playTimer = window.setTimeout(tick, reduceMotion ? 0 : 650);
        } else {
          playTimer = null;
        }
      }
      if (step >= plan().ops.length) step = 0;
      tick();
    }

    planEl.addEventListener("change", function () {
      reset();
      setStatus(
        planEl.value === "index"
          ? "Index plan: selective seeks + nested loop — lower est. cost."
          : "Seq-scan plan: read everything, then filter and hash-join."
      );
    });

    document.querySelectorAll("[data-qp-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-qp-action");
        if (action === "reset") reset();
        else if (action === "step") {
          clearPlay();
          stepOnce();
        } else if (action === "play") play();
      });
    });

    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initQp);
  } else {
    initQp();
  }
})();
