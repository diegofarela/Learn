/**
 * Interactive virtual pages → physical frames with page-fault demo.
 */
(function () {
  var PAGE_COUNT = 6;
  var FRAME_COUNT = 4;
  var ACCESS_ORDER = [0, 1, 2, 4, 1, 5, 0, 3];

  var CODE_LINES = [
    { html: '<span class="code-type">phys</span> <span class="code-fn">translate</span>(virt_page p) {', id: "sig" },
    { html: '  entry = page_table[p];', id: "lookup" },
    { html: '  <span class="code-kw">if</span> (!entry.present) {', id: "check" },
    { html: '    <span class="code-fn">page_fault</span>(p); <span class="code-cm">/* trap to OS */</span>', id: "fault" },
    { html: '    entry = page_table[p];', id: "reload" },
    { html: '  }' },
    { html: '  <span class="code-kw">return</span> entry.frame;', id: "ok" },
    { html: '}' }
  ];

  function initVm() {
    var pagesEl = document.getElementById("vm-pages");
    var framesEl = document.getElementById("vm-frames");
    var status = document.getElementById("vm-status");
    var badge = document.getElementById("vm-badge");
    var mappedEl = document.getElementById("vm-mapped");
    var codeRoot = document.getElementById("vm-code");
    var codeNote = document.getElementById("vm-code-note");
    if (!pagesEl || !framesEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mapping = {};
    var frameOwner = new Array(FRAME_COUNT).fill(null);
    var nextAccess = 0;
    var focusPage = null;
    var faultPage = null;
    var busy = false;
    var stepTimers = [];
    var lineEls = {};

    function clearTimers() {
      stepTimers.forEach(function (t) {
        window.clearTimeout(t);
      });
      stepTimers = [];
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

    function mappedCount() {
      return Object.keys(mapping).length;
    }

    function renderCode() {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      CODE_LINES.forEach(function (line, i) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.dataset.line = String(i + 1);
        if (line.id) {
          row.dataset.id = line.id;
          lineEls[line.id] = row;
        }
        row.innerHTML = line.html || "&nbsp;";
        codeRoot.appendChild(row);
      });
    }

    function clearHighlights() {
      Object.keys(lineEls).forEach(function (id) {
        lineEls[id].classList.remove("is-active");
      });
    }

    function highlight(id) {
      clearHighlights();
      if (id && lineEls[id]) lineEls[id].classList.add("is-active");
    }

    function freeFrame() {
      for (var i = 0; i < FRAME_COUNT; i++) {
        if (frameOwner[i] === null) return i;
      }
      var victimPage = frameOwner[0];
      delete mapping[victimPage];
      frameOwner[0] = null;
      return 0;
    }

    function mapPage(page) {
      if (mapping[page] !== undefined) return mapping[page];
      var frame = freeFrame();
      mapping[page] = frame;
      frameOwner[frame] = page;
      return frame;
    }

    function render() {
      pagesEl.innerHTML = "";
      for (var p = 0; p < PAGE_COUNT; p++) {
        var page = document.createElement("button");
        page.type = "button";
        page.className = "vm-page";
        page.setAttribute("role", "listitem");
        page.dataset.page = String(p);
        page.textContent = "P" + p;
        if (mapping[p] !== undefined) {
          page.classList.add("is-mapped");
          var tip = document.createElement("span");
          tip.className = "vm-page-map";
          tip.textContent = "→ F" + mapping[p];
          page.appendChild(tip);
        } else {
          page.classList.add("is-unmapped");
        }
        if (focusPage === p) page.classList.add("is-focus");
        if (faultPage === p) page.classList.add("is-fault");
        page.addEventListener("click", (function (pageNum) {
          return function () {
            accessPage(pageNum);
          };
        })(p));
        pagesEl.appendChild(page);
      }

      framesEl.innerHTML = "";
      for (var f = 0; f < FRAME_COUNT; f++) {
        var frame = document.createElement("div");
        frame.className = "vm-frame";
        frame.setAttribute("role", "listitem");
        if (frameOwner[f] !== null) {
          frame.classList.add("is-used");
          frame.textContent = "F" + f;
          var owner = document.createElement("span");
          owner.className = "vm-frame-owner";
          owner.textContent = "P" + frameOwner[f];
          frame.appendChild(owner);
          if (focusPage === frameOwner[f]) frame.classList.add("is-focus");
        } else {
          frame.classList.add("is-free");
          frame.textContent = "F" + f;
        }
        framesEl.appendChild(frame);
      }

      if (mappedEl) mappedEl.textContent = String(mappedCount());
    }

    function runAccess(page, forceFault) {
      if (busy) return;
      busy = true;
      clearTimers();
      focusPage = page;
      faultPage = null;
      var present = mapping[page] !== undefined && !forceFault;
      var delay = reduceMotion ? 0 : 400;
      var steps;

      if (present) {
        steps = [
          { line: "sig", note: "Translate virtual page <strong>P" + page + "</strong>." },
          { line: "lookup", note: "Read page-table entry for P" + page + ".", visual: "probe" },
          { line: "check", note: "present = true — no fault." },
          {
            line: "ok",
            note: "Physical frame <strong>F" + mapping[page] + "</strong>.",
            visual: "ok"
          }
        ];
      } else {
        steps = [
          { line: "sig", note: "Translate virtual page <strong>P" + page + "</strong>." },
          { line: "lookup", note: "Read page-table entry for P" + page + ".", visual: "probe" },
          { line: "check", note: "present = false — <strong>page fault</strong>.", visual: "fault" },
          {
            line: "fault",
            note: "OS allocates/loads a frame and updates the page table.",
            visual: "map"
          },
          { line: "reload", note: "Retry translation with updated entry." },
          { line: "ok", note: "Now mapped — resume the access.", visual: "ok" }
        ];
      }

      var i = 0;
      function tick() {
        if (i >= steps.length) {
          busy = false;
          clearHighlights();
          faultPage = null;
          focusPage = null;
          render();
          return;
        }
        var step = steps[i];
        highlight(step.line);
        setCodeNote(step.note);

        if (step.visual === "probe") {
          render();
        } else if (step.visual === "fault") {
          faultPage = page;
          setBadge("FAULT");
          setStatus("Page fault on P" + page + " — trapping to the OS.");
          render();
        } else if (step.visual === "map") {
          var frame = mapPage(page);
          faultPage = page;
          setStatus("Mapped P" + page + " → F" + frame + ".");
          render();
        } else if (step.visual === "ok") {
          setBadge(present ? "hit" : "mapped");
          setStatus(
            "P" + page + " → F" + mapping[page] + ". Mapped pages: " + mappedCount() + "/" + PAGE_COUNT
          );
          render();
        }

        i++;
        if (reduceMotion) tick();
        else stepTimers.push(window.setTimeout(tick, delay));
      }
      tick();
    }

    function accessPage(page) {
      try {
        runAccess(page, false);
      } catch (err) {
        console.error("[learn-vm] access failed", page, err);
        busy = false;
      }
    }

    function accessNext() {
      var page = ACCESS_ORDER[nextAccess % ACCESS_ORDER.length];
      nextAccess++;
      accessPage(page);
    }

    function forceFault() {
      var unmapped = null;
      for (var p = 0; p < PAGE_COUNT; p++) {
        if (mapping[p] === undefined) {
          unmapped = p;
          break;
        }
      }
      if (unmapped === null) {
        var victim = Object.keys(mapping)[0];
        if (victim !== undefined) {
          var f = mapping[victim];
          frameOwner[f] = null;
          delete mapping[victim];
          unmapped = Number(victim);
          render();
        }
      }
      if (unmapped !== null) runAccess(unmapped, true);
      else setStatus("All pages mapped and frames full — reset to demo a fault.");
    }

    function reset() {
      try {
        clearTimers();
        busy = false;
        mapping = { 0: 0, 1: 1, 2: 2 };
        frameOwner = [0, 1, 2, null];
        nextAccess = 0;
        focusPage = null;
        faultPage = null;
        clearHighlights();
        setBadge("ready");
        setCodeNote("Access a page — translation or page-fault handling lights up.");
        setStatus("Three pages mapped. Access a page — or force a fault on an unmapped one.");
        render();
      } catch (err) {
        console.error("[learn-vm] reset failed", err);
      }
    }

    document.querySelectorAll("[data-vm-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-vm-action");
          if (action === "access") accessNext();
          else if (action === "fault") forceFault();
          else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-vm] action failed", err);
        }
      });
    });

    renderCode();
    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVm);
  } else {
    initVm();
  }
})();
