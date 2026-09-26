/**
 * File system demo: directory tree → inode → data blocks.
 */
(function () {
  var FILES = {
    "readme.txt": { ino: 12, size: "1.2 KB", blocks: [4, 5], type: "file" },
    "app.js": { ino: 18, size: "8.4 KB", blocks: [10, 11, 12], type: "file" },
    "notes.md": { ino: 21, size: "3.1 KB", blocks: [15, 16], type: "file" }
  };

  var TREE = [
    { name: "/", type: "dir", children: [
      { name: "home", type: "dir", children: [
        { name: "user", type: "dir", children: [
          { name: "readme.txt", type: "file", key: "readme.txt" },
          { name: "notes.md", type: "file", key: "notes.md" }
        ]}
      ]},
      { name: "src", type: "dir", children: [
        { name: "app.js", type: "file", key: "app.js" }
      ]}
    ]}
  ];

  var ALL_BLOCKS = 20;

  var CODE_LINES = [
    { html: '<span class="code-type">Inode</span> <span class="code-fn">lookup</span>(Path p) {', id: "sig" },
    { html: '  dir = root;', id: "root" },
    { html: '  <span class="code-kw">for</span> (name <span class="code-kw">in</span> p.components) {', id: "walk" },
    { html: '    dir = dir.find(name); <span class="code-cm">/* dirent → ino */</span>', id: "dirent" },
    { html: '  }' },
    { html: '  ino = read_inode(dir.ino);', id: "inode" },
    { html: '  <span class="code-kw">return</span> ino.blocks; <span class="code-cm">/* data */</span>', id: "blocks" },
    { html: '}' }
  ];

  function initFs() {
    var treeEl = document.getElementById("fs-tree");
    var inodeEl = document.getElementById("fs-inode");
    var blocksEl = document.getElementById("fs-blocks");
    var status = document.getElementById("fs-status");
    var badge = document.getElementById("fs-badge");
    var inodeLabel = document.getElementById("fs-inode-label");
    var codeRoot = document.getElementById("fs-code");
    var codeNote = document.getElementById("fs-code-note");
    if (!treeEl || !inodeEl || !blocksEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var selected = null;
    var lineEls = {};
    var stepTimers = [];
    var busy = false;

    function clearTimers() {
      stepTimers.forEach(function (t) {
        window.clearTimeout(t);
      });
      stepTimers = [];
    }

    function after(ms, fn) {
      if (reduceMotion) {
        fn();
        return;
      }
      stepTimers.push(window.setTimeout(fn, ms));
    }

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

    function renderTree(nodes, parent, depth) {
      nodes.forEach(function (n) {
        var row = document.createElement("button");
        row.type = "button";
        row.className = "fs-node fs-node--" + n.type;
        row.style.paddingLeft = 0.35 + depth * 0.85 + "rem";
        row.setAttribute("role", "treeitem");
        row.innerHTML =
          '<span class="fs-node-icon" aria-hidden="true">' +
          (n.type === "dir" ? "dir" : "file") +
          "</span> " +
          '<span class="fs-node-name">' +
          n.name +
          "</span>";
        if (n.type === "file" && n.key) {
          row.dataset.key = n.key;
          row.addEventListener("click", function () {
            selectFile(n.key, true);
          });
        } else {
          row.disabled = true;
          row.classList.add("is-dir");
        }
        parent.appendChild(row);
        if (n.children) renderTree(n.children, parent, depth + 1);
      });
    }

    function renderBlocks(active) {
      blocksEl.innerHTML = "";
      for (var i = 0; i < ALL_BLOCKS; i++) {
        var b = document.createElement("span");
        b.className = "fs-block";
        b.textContent = String(i);
        if (active && active.indexOf(i) !== -1) b.classList.add("is-owned");
        if (active && selected && FILES[selected].blocks.indexOf(i) !== -1) {
          b.classList.add("is-focus");
        }
        blocksEl.appendChild(b);
      }
    }

    function renderInode(key) {
      inodeEl.innerHTML = "";
      inodeEl.classList.remove("is-empty", "is-flash");
      if (!key || !FILES[key]) {
        inodeEl.classList.add("is-empty");
        inodeEl.textContent = "No inode selected";
        if (inodeLabel) inodeLabel.textContent = "—";
        return;
      }
      var meta = FILES[key];
      if (inodeLabel) inodeLabel.textContent = String(meta.ino);
      inodeEl.innerHTML =
        '<div class="fs-inode-row"><span>number</span><strong>' +
        meta.ino +
        "</strong></div>" +
        '<div class="fs-inode-row"><span>type</span><strong>' +
        meta.type +
        "</strong></div>" +
        '<div class="fs-inode-row"><span>size</span><strong>' +
        meta.size +
        "</strong></div>" +
        '<div class="fs-inode-row"><span>blocks</span><strong>[' +
        meta.blocks.join(", ") +
        "]</strong></div>";
    }

    function markTree(key) {
      treeEl.querySelectorAll(".fs-node").forEach(function (el) {
        el.classList.toggle("is-selected", el.dataset.key === key);
      });
    }

    function selectFile(key, animate) {
      if (busy && animate) return;
      selected = key;
      var meta = FILES[key];
      if (!meta) return;
      markTree(key);
      renderInode(key);
      renderBlocks(meta.blocks);
      setBadge(key);
      setStatus("Resolved " + key + " → inode " + meta.ino + " → blocks [" + meta.blocks.join(", ") + "]");

      if (!animate) {
        highlight("blocks");
        setCodeNote("Inode <strong>" + meta.ino + "</strong> points at the highlighted blocks.");
        return;
      }

      busy = true;
      clearTimers();
      highlight("sig");
      setCodeNote("Looking up path for <strong>" + key + "</strong>.");
      after(reduceMotion ? 0 : 280, function () {
        highlight("root");
        setCodeNote("Start at the root directory.");
      });
      after(reduceMotion ? 0 : 560, function () {
        highlight("walk");
        setCodeNote("Walk each path component in the directory tree.");
      });
      after(reduceMotion ? 0 : 840, function () {
        highlight("dirent");
        setCodeNote("Directory entry maps the name to an inode number.");
      });
      after(reduceMotion ? 0 : 1120, function () {
        highlight("inode");
        inodeEl.classList.add("is-flash");
        setCodeNote("Read inode <strong>" + meta.ino + "</strong> metadata.");
      });
      after(reduceMotion ? 0 : 1400, function () {
        highlight("blocks");
        setCodeNote("Follow block pointers to file data on disk.");
        busy = false;
      });
    }

    function demo() {
      selectFile("app.js", true);
    }

    function reset() {
      clearTimers();
      busy = false;
      selected = null;
      markTree(null);
      renderInode(null);
      renderBlocks(null);
      highlight(null);
      setBadge("pick a file");
      setStatus("Select a file to resolve name → inode → blocks.");
      setCodeNote("Click a file — path walk and inode read highlight.");
    }

    treeEl.innerHTML = "";
    renderTree(TREE, treeEl, 0);
    renderCode();
    renderBlocks(null);
    renderInode(null);

    document.querySelectorAll("[data-fs-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-fs-action");
        if (a === "demo") demo();
        else if (a === "reset") reset();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFs);
  } else {
    initFs();
  }
})();
