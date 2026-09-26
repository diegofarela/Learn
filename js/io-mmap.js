/**
 * Buffer I/O vs mmap interactive diagram.
 */
(function () {
  var BUFFER_STEPS = [
    {
      active: ["disk"],
      codeId: "open",
      status: "File on disk. Kernel will pull blocks into the page cache.",
      note: "Start from durable storage."
    },
    {
      active: ["disk", "cache"],
      codeId: "cache",
      status: "Blocks land in the kernel page cache.",
      note: "<strong>Page cache</strong> holds file pages in RAM."
    },
    {
      active: ["cache", "copy"],
      codeId: "copy",
      status: "read() copies from cache into a user buffer.",
      note: "<strong>Copy</strong> crosses the user/kernel boundary."
    },
    {
      active: ["buf", "app"],
      codeId: "use",
      status: "App uses bytes in its buffer.",
      note: "User buffer is a separate copy of the data."
    }
  ];

  var MMAP_STEPS = [
    {
      active: ["disk"],
      codeId: "mmap",
      status: "mmap asks the kernel to map the file into the address space.",
      note: "<strong>mmap</strong> creates a mapping, not an immediate full copy."
    },
    {
      active: ["disk", "cache", "map"],
      codeId: "fault",
      status: "First touch → page fault; kernel maps a cache page.",
      note: "<strong>Fault</strong> installs a PTE to a page-cache frame."
    },
    {
      active: ["cache", "map", "vas"],
      codeId: "pte",
      status: "Virtual pages now point at file-backed frames.",
      note: "Same physical pages; no extra user buffer copy."
    },
    {
      active: ["vas", "app"],
      codeId: "load",
      status: "App loads/stores the mapped region like ordinary memory.",
      note: "<strong>Load/store</strong> is the I/O API."
    }
  ];

  var BUFFER_CODE = [
    { html: 'fd = <span class="code-fn">open</span>("file");', id: "open" },
    { html: '<span class="code-cm">/* kernel fills page cache */</span>', id: "cache" },
    { html: '<span class="code-fn">read</span>(fd, buf, n); <span class="code-cm">/* copy */</span>', id: "copy" },
    { html: '<span class="code-fn">use</span>(buf);', id: "use" }
  ];

  var MMAP_CODE = [
    { html: 'p = <span class="code-fn">mmap</span>(…, fd, …);', id: "mmap" },
    { html: '<span class="code-cm">/* first touch → fault */</span>', id: "fault" },
    { html: 'PTE → page-cache frame;', id: "pte" },
    { html: 'byte = p[i]; <span class="code-cm">/* load */</span>', id: "load" }
  ];

  function initIo() {
    var diagram = document.getElementById("io-diagram");
    var modeEl = document.getElementById("io-mode");
    var status = document.getElementById("io-status");
    var pathLabel = document.getElementById("io-path-label");
    var codeRoot = document.getElementById("io-code");
    var codeNote = document.getElementById("io-code-note");
    if (!diagram || !modeEl) return;

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

    function mode() {
      return modeEl.value === "mmap" ? "mmap" : "buffer";
    }

    function steps() {
      return mode() === "mmap" ? MMAP_STEPS : BUFFER_STEPS;
    }

    function codeLines() {
      return mode() === "mmap" ? MMAP_CODE : BUFFER_CODE;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function updatePathLabel() {
      if (pathLabel) pathLabel.textContent = mode() === "mmap" ? "mmap" : "buffer";
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      codeLines().forEach(function (line, i) {
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

    function paint(activeKeys) {
      diagram.innerHTML = "";
      var isMmap = mode() === "mmap";
      var nodes = isMmap
        ? [
            { id: "disk", label: "Disk", sub: "file blocks" },
            { id: "cache", label: "Page cache", sub: "kernel RAM" },
            { id: "map", label: "Page table", sub: "PTEs" },
            { id: "vas", label: "Mapped VA", sub: "process pages" },
            { id: "app", label: "App", sub: "load / store" }
          ]
        : [
            { id: "disk", label: "Disk", sub: "file blocks" },
            { id: "cache", label: "Page cache", sub: "kernel RAM" },
            { id: "copy", label: "copy_to_user", sub: "syscall" },
            { id: "buf", label: "User buffer", sub: "heap / stack" },
            { id: "app", label: "App", sub: "uses buf" }
          ];

      nodes.forEach(function (n, i) {
        if (i > 0) {
          var arrow = document.createElement("div");
          arrow.className = "io-arrow";
          arrow.setAttribute("aria-hidden", "true");
          arrow.textContent = "→";
          diagram.appendChild(arrow);
        }
        var el = document.createElement("div");
        el.className =
          "io-node" + (activeKeys.indexOf(n.id) !== -1 ? " is-active" : "");
        el.innerHTML =
          '<span class="io-node-label">' +
          n.label +
          '</span><span class="io-node-sub">' +
          n.sub +
          "</span>";
        diagram.appendChild(el);
      });
    }

    function paintStep() {
      updatePathLabel();
      var list = steps();
      if (step <= 0) {
        step = 0;
        paint([]);
        renderCode();
        highlight(null);
        setStatus(
          mode() === "mmap"
            ? "mmap path: map file pages into the address space."
            : "Buffered path: disk → kernel cache → copy into user buffer."
        );
        setNote("Step to advance the active path.");
        return;
      }
      var s = list[Math.min(step, list.length) - 1];
      paint(s.active);
      renderCode();
      highlight(s.codeId);
      setStatus(s.status);
      setNote(s.note);
    }

    function reset() {
      clearPlay();
      step = 0;
      paintStep();
    }

    function stepOnce() {
      var list = steps();
      if (step >= list.length) {
        step = 0;
      }
      step += 1;
      paintStep();
    }

    function play() {
      clearPlay();
      function tick() {
        stepOnce();
        if (step < steps().length) {
          playTimer = window.setTimeout(tick, reduceMotion ? 0 : 700);
        } else {
          playTimer = null;
        }
      }
      if (step >= steps().length) step = 0;
      tick();
    }

    modeEl.addEventListener("change", function () {
      reset();
    });

    document.querySelectorAll("[data-io-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-io-action");
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
    document.addEventListener("DOMContentLoaded", initIo);
  } else {
    initIo();
  }
})();
