/**
 * Compiler pipeline: source → tokens → AST → bytecode.
 */
(function () {
  var SOURCE = "x = 1 + 2";

  var STAGES = [
    {
      id: "source",
      label: "Source",
      badge: "source",
      code: "source",
      note: "Program text as characters.",
      render: function () {
        return '<pre class="comp-pane-pre">' + escapeHtml(SOURCE) + "</pre>";
      }
    },
    {
      id: "tokens",
      label: "Tokens",
      badge: "lex",
      code: "lex",
      note: "Lexer splits text into tokens.",
      render: function () {
        var toks = [
          { t: "IDENT", v: "x" },
          { t: "EQ", v: "=" },
          { t: "NUM", v: "1" },
          { t: "PLUS", v: "+" },
          { t: "NUM", v: "2" }
        ];
        return (
          '<div class="comp-tokens">' +
          toks
            .map(function (tok) {
              return (
                '<span class="comp-token"><span class="comp-token-t">' +
                tok.t +
                '</span><span class="comp-token-v">' +
                escapeHtml(tok.v) +
                "</span></span>"
              );
            })
            .join("") +
          "</div>"
        );
      }
    },
    {
      id: "ast",
      label: "AST",
      badge: "parse",
      code: "parse",
      note: "Parser builds an abstract syntax tree.",
      render: function () {
        return (
          '<div class="comp-ast" role="img" aria-label="Abstract syntax tree">' +
          '<div class="comp-ast-node is-root">Assign</div>' +
          '<div class="comp-ast-row">' +
          '<div class="comp-ast-node">Ident x</div>' +
          '<div class="comp-ast-node">BinOp +</div>' +
          "</div>" +
          '<div class="comp-ast-row comp-ast-row--leaf">' +
          '<div class="comp-ast-spacer"></div>' +
          '<div class="comp-ast-node">Num 1</div>' +
          '<div class="comp-ast-node">Num 2</div>' +
          "</div>" +
          "</div>"
        );
      }
    },
    {
      id: "bytecode",
      label: "Bytecode",
      badge: "codegen",
      code: "emit",
      note: "Codegen emits stack bytecode (or machine code).",
      render: function () {
        var lines = [
          "LOAD_CONST 1",
          "LOAD_CONST 2",
          "BINARY_ADD",
          "STORE_NAME  x"
        ];
        return (
          '<ol class="comp-bytecodes">' +
          lines
            .map(function (l) {
              return "<li><code>" + escapeHtml(l) + "</code></li>";
            })
            .join("") +
          "</ol>"
        );
      }
    }
  ];

  var CODE_LINES = [
    { html: '<span class="code-type">Code</span> <span class="code-fn">compile</span>(src) {', id: "sig" },
    { html: '  tokens = <span class="code-fn">lex</span>(src);', id: "lex" },
    { html: '  ast = <span class="code-fn">parse</span>(tokens);', id: "parse" },
    { html: '  <span class="code-cm">/* optional: typecheck / optimize */</span>', id: "opt" },
    { html: '  <span class="code-kw">return</span> <span class="code-fn">emit</span>(ast);', id: "emit" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-cm">/* source keeps the original text */</span>', id: "source" }
  ];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function initComp() {
    var pipeEl = document.getElementById("comp-pipeline");
    var outEl = document.getElementById("comp-output");
    var status = document.getElementById("comp-status");
    var badge = document.getElementById("comp-badge");
    var stageLabel = document.getElementById("comp-stage-label");
    var codeRoot = document.getElementById("comp-code");
    var codeNote = document.getElementById("comp-code-note");
    if (!pipeEl || !outEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var index = 0;
    var lineEls = {};
    var autoTimer = null;

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setCodeNote(html) {
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
        if (line.blank) row.innerHTML = "&nbsp;";
        else row.innerHTML = line.html || "&nbsp;";
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

    function stopAuto() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function show(i) {
      index = ((i % STAGES.length) + STAGES.length) % STAGES.length;
      var stage = STAGES[index];
      pipeEl.querySelectorAll(".comp-stage").forEach(function (el, j) {
        el.classList.toggle("is-active", j === index);
        el.classList.toggle("is-done", j < index);
        el.setAttribute("aria-selected", j === index ? "true" : "false");
      });
      outEl.innerHTML = stage.render();
      outEl.classList.remove("is-flash");
      if (!reduceMotion) {
        void outEl.offsetWidth;
        outEl.classList.add("is-flash");
      }
      setBadge(stage.badge);
      if (stageLabel) stageLabel.textContent = stage.id;
      highlight(stage.code);
      setCodeNote(stage.note);
      setStatus("Stage: " + stage.label + " — " + stage.note);
    }

    function renderPipeline() {
      pipeEl.innerHTML = "";
      STAGES.forEach(function (stage, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "comp-stage";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-selected", "false");
        btn.innerHTML =
          '<span class="comp-stage-num">' +
          (i + 1) +
          '</span><span class="comp-stage-label">' +
          stage.label +
          "</span>";
        if (i < STAGES.length - 1) {
          btn.innerHTML += '<span class="comp-stage-arrow" aria-hidden="true">→</span>';
        }
        btn.addEventListener("click", function () {
          stopAuto();
          show(i);
        });
        pipeEl.appendChild(btn);
      });
    }

    function next() {
      show(index + 1);
    }

    function auto() {
      if (autoTimer) {
        stopAuto();
        setStatus("Auto-play stopped.");
        return;
      }
      autoTimer = window.setInterval(function () {
        show(index + 1);
      }, reduceMotion ? 900 : 1400);
      setStatus("Auto-playing pipeline…");
    }

    function reset() {
      stopAuto();
      show(0);
      setStatus("Source ready. Advance through the compiler pipeline.");
    }

    renderCode();
    renderPipeline();
    show(0);

    document.querySelectorAll("[data-comp-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-comp-action");
        if (a === "next") {
          stopAuto();
          next();
        } else if (a === "auto") auto();
        else if (a === "reset") reset();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initComp);
  } else {
    initComp();
  }
})();
