/**
 * Normalization walkthrough: raw → 1NF → 2NF → 3NF.
 */
(function () {
  var FORMS = [
    {
      id: "raw",
      badge: "raw table",
      label: "raw",
      status: "One wide table: repeating groups and redundant course data.",
      note: "Start messy — multi-valued cells and repeated facts.",
      codeId: "raw",
      tables: [
        {
          name: "StudentCourses",
          headers: ["Student", "Courses", "Instructor", "Office"],
          rows: [
            ["Ada", "CS101, CS201", "Turing", "B12"],
            ["Grace", "CS101", "Turing", "B12"]
          ],
          flag: "repeating courses · redundant instructor"
        }
      ]
    },
    {
      id: "1nf",
      badge: "1NF",
      label: "1NF",
      status: "1NF: one course per row — values are atomic.",
      note: "<strong>1NF</strong>: no repeating groups; atomic columns.",
      codeId: "nf1",
      tables: [
        {
          name: "Enrollments",
          headers: ["Student", "Course", "Instructor", "Office"],
          rows: [
            ["Ada", "CS101", "Turing", "B12"],
            ["Ada", "CS201", "Hopper", "A3"],
            ["Grace", "CS101", "Turing", "B12"]
          ],
          flag: "atomic · still partial & transitive deps"
        }
      ]
    },
    {
      id: "2nf",
      badge: "2NF",
      label: "2NF",
      status: "2NF: course facts depend on Course alone — split CourseInfo.",
      note: "<strong>2NF</strong>: non-key attrs depend on the whole key.",
      codeId: "nf2",
      tables: [
        {
          name: "Enrollments",
          headers: ["Student", "Course"],
          rows: [
            ["Ada", "CS101"],
            ["Ada", "CS201"],
            ["Grace", "CS101"]
          ],
          flag: "key = (Student, Course)"
        },
        {
          name: "CourseInfo",
          headers: ["Course", "Instructor", "Office"],
          rows: [
            ["CS101", "Turing", "B12"],
            ["CS201", "Hopper", "A3"]
          ],
          flag: "instructor still → office (transitive)"
        }
      ]
    },
    {
      id: "3nf",
      badge: "3NF",
      label: "3NF",
      status: "3NF: Instructor → Office moved to Instructors.",
      note: "<strong>3NF</strong>: remove transitive dependencies.",
      codeId: "nf3",
      tables: [
        {
          name: "Enrollments",
          headers: ["Student", "Course"],
          rows: [
            ["Ada", "CS101"],
            ["Ada", "CS201"],
            ["Grace", "CS101"]
          ]
        },
        {
          name: "Courses",
          headers: ["Course", "Instructor"],
          rows: [
            ["CS101", "Turing"],
            ["CS201", "Hopper"]
          ]
        },
        {
          name: "Instructors",
          headers: ["Instructor", "Office"],
          rows: [
            ["Turing", "B12"],
            ["Hopper", "A3"]
          ]
        }
      ]
    }
  ];

  var CODE_LINES = [
    { html: '<span class="code-cm">/* denormalized wide table */</span>', id: "raw" },
    { html: '<span class="code-fn">to_1NF</span>: atomic cells, one value/row', id: "nf1" },
    { html: '<span class="code-fn">to_2NF</span>: split partial key deps', id: "nf2" },
    { html: '<span class="code-fn">to_3NF</span>: split transitive deps', id: "nf3" }
  ];

  function initNf() {
    var tablesEl = document.getElementById("nf-tables");
    var status = document.getElementById("nf-status");
    var badge = document.getElementById("nf-badge");
    var formLabel = document.getElementById("nf-form-label");
    var codeRoot = document.getElementById("nf-code");
    var codeNote = document.getElementById("nf-code-note");
    if (!tablesEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var step = 0;
    var lineEls = {};

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setForm(text) {
      if (formLabel) formLabel.textContent = text;
    }

    function setNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE_LINES.forEach(function (line, i) {
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

    function highlight(id) {
      Object.keys(lineEls).forEach(function (k) {
        lineEls[k].classList.remove("is-active");
      });
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function paint() {
      var form = FORMS[step];
      tablesEl.innerHTML = "";
      tablesEl.className = "nf-tables" + (reduceMotion ? "" : " is-anim");
      form.tables.forEach(function (t) {
        var card = document.createElement("div");
        card.className = "nf-table";
        var head =
          '<p class="nf-table-name">' +
          t.name +
          "</p><table><thead><tr>" +
          t.headers
            .map(function (h) {
              return "<th>" + h + "</th>";
            })
            .join("") +
          "</tr></thead><tbody>" +
          t.rows
            .map(function (r) {
              return (
                "<tr>" +
                r
                  .map(function (c) {
                    return "<td>" + c + "</td>";
                  })
                  .join("") +
                "</tr>"
              );
            })
            .join("") +
          "</tbody></table>";
        if (t.flag) {
          head += '<p class="nf-flag">' + t.flag + "</p>";
        }
        card.innerHTML = head;
        tablesEl.appendChild(card);
      });
      setBadge(form.badge);
      setForm(form.label);
      setStatus(form.status);
      setNote(form.note);
      highlight(form.codeId);
    }

    function reset() {
      step = 0;
      paint();
    }

    function next() {
      step = (step + 1) % FORMS.length;
      paint();
    }

    document.querySelectorAll("[data-nf-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-nf-action");
        if (action === "reset") reset();
        else if (action === "step") next();
      });
    });

    renderCode();
    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNf);
  } else {
    initNf();
  }
})();
