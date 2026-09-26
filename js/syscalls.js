/**
 * System-call demo: user → kernel trap on read()/write().
 */
(function () {
  var STEPS = {
    idle: {
      mode: "user",
      badge: "user mode",
      status: "App runs in user mode. Invoke a syscall to trap into the kernel.",
      note: "Press <strong>read()</strong> or <strong>write()</strong> — the trap path highlights.",
      highlight: null,
      layers: { user: "idle", trap: "", kernel: "", ret: "" }
    }
  };

  var CODE = {
    read: [
      { html: '<span class="code-cm">/* user space */</span>' },
      { html: 'n = <span class="code-fn">read</span>(fd, buf, len);', id: "call" },
      { html: '<span class="code-cm">/* CPU trap → kernel */</span>', id: "trap" },
      { html: '<span class="code-fn">sys_read</span>(fd, buf, len);', id: "handler" },
      { html: '<span class="code-cm">/* copy data into user buffer */</span>', id: "work" },
      { html: '<span class="code-kw">return</span> n; <span class="code-cm">/* back to user */</span>', id: "ret" }
    ],
    write: [
      { html: '<span class="code-cm">/* user space */</span>' },
      { html: 'n = <span class="code-fn">write</span>(fd, buf, len);', id: "call" },
      { html: '<span class="code-cm">/* CPU trap → kernel */</span>', id: "trap" },
      { html: '<span class="code-fn">sys_write</span>(fd, buf, len);', id: "handler" },
      { html: '<span class="code-cm">/* copy data out to device */</span>', id: "work" },
      { html: '<span class="code-kw">return</span> n; <span class="code-cm">/* back to user */</span>', id: "ret" }
    ]
  };

  function initSc() {
    var layers = document.getElementById("sc-layers");
    var status = document.getElementById("sc-status");
    var badge = document.getElementById("sc-badge");
    var modeLabel = document.getElementById("sc-mode-label");
    var codeRoot = document.getElementById("sc-code");
    var codeNote = document.getElementById("sc-code-note");
    if (!layers) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var busy = false;
    var timers = [];
    var lineEls = {};
    var kind = "read";

    function clearTimers() {
      timers.forEach(function (t) {
        window.clearTimeout(t);
      });
      timers = [];
    }

    function after(ms, fn) {
      if (reduceMotion) {
        fn();
        return;
      }
      timers.push(window.setTimeout(fn, ms));
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setBadge(text) {
      if (badge) badge.textContent = text;
    }

    function setMode(mode) {
      if (modeLabel) modeLabel.textContent = mode;
    }

    function setNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function renderCode(lines) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      lineEls = {};
      lines.forEach(function (line, i) {
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

    function paintLayers(state) {
      layers.innerHTML = "";
      var items = [
        { key: "user", label: "User space", sub: "app · libc" },
        { key: "trap", label: "Trap / syscall", sub: "mode switch" },
        { key: "kernel", label: "Kernel", sub: "sys_* handler" },
        { key: "ret", label: "Return", sub: "restore user" }
      ];
      items.forEach(function (item) {
        var el = document.createElement("div");
        el.className = "sc-layer";
        if (state[item.key]) el.classList.add("is-" + state[item.key]);
        el.innerHTML =
          '<span class="sc-layer-label">' +
          item.label +
          '</span><span class="sc-layer-sub">' +
          item.sub +
          "</span>";
        layers.appendChild(el);
      });
    }

    function setButtons(disabled) {
      document.querySelectorAll("[data-sc-action]").forEach(function (btn) {
        var action = btn.getAttribute("data-sc-action");
        if (action === "reset") {
          btn.disabled = false;
          return;
        }
        btn.disabled = disabled;
      });
    }

    function reset() {
      clearTimers();
      busy = false;
      setButtons(false);
      setMode("user");
      setBadge("user mode");
      setStatus(STEPS.idle.status);
      setNote(STEPS.idle.note);
      paintLayers({ user: "active", trap: "", kernel: "", ret: "" });
      renderCode(CODE.read);
      highlight(null);
    }

    function run(syscall) {
      if (busy) return;
      busy = true;
      clearTimers();
      setButtons(true);
      kind = syscall;
      renderCode(CODE[syscall]);
      var label = syscall + "()";

      paintLayers({ user: "active", trap: "", kernel: "", ret: "" });
      setMode("user");
      setBadge("user · " + label);
      setStatus("User calls " + label + ".");
      setNote("App invokes <strong>" + label + "</strong>.");
      highlight("call");

      after(reduceMotion ? 0 : 450, function () {
        paintLayers({ user: "dim", trap: "active", kernel: "", ret: "" });
        setMode("trap");
        setBadge("trapping…");
        setStatus("Syscall instruction traps into the kernel.");
        setNote("<strong>Trap</strong>: CPU switches to kernel mode.");
        highlight("trap");
      });

      after(reduceMotion ? 0 : 950, function () {
        paintLayers({ user: "dim", trap: "done", kernel: "active", ret: "" });
        setMode("kernel");
        setBadge("kernel mode");
        setStatus("Kernel runs sys_" + syscall + " — privileged work.");
        setNote("<strong>Handler</strong>: validate args and perform I/O.");
        highlight("handler");
      });

      after(reduceMotion ? 0 : 1450, function () {
        highlight("work");
        setStatus(
          syscall === "read"
            ? "Kernel copies bytes into the user buffer."
            : "Kernel copies bytes out to the device."
        );
      });

      after(reduceMotion ? 0 : 1950, function () {
        paintLayers({ user: "dim", trap: "done", kernel: "done", ret: "active" });
        setMode("return");
        setBadge("returning…");
        setStatus("Return to user mode with the result.");
        setNote("<strong>Return</strong>: restore user mode and resume.");
        highlight("ret");
      });

      after(reduceMotion ? 0 : 2450, function () {
        paintLayers({ user: "active", trap: "done", kernel: "done", ret: "done" });
        setMode("user");
        setBadge("user mode");
        setStatus(label + " completed — back in user space.");
        setNote("Syscall finished. Try the other call or reset.");
        busy = false;
        setButtons(false);
      });
    }

    document.querySelectorAll("[data-sc-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-sc-action");
        if (action === "reset") reset();
        else if (action === "read" || action === "write") run(action);
      });
    });

    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSc);
  } else {
    initSc();
  }
})();
