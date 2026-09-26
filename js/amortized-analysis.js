/**
 * Amortized analysis: dynamic array doubling with token accounting.
 * Each push is charged 3: 1 for the write, 2 banked toward future copies.
 */
(function () {
  var CODE_LINES = [
    { html: '<span class="code-cm">/* accounting: charge 3 per push */</span>', id: "sig" },
    { html: '<span class="code-kw">if</span> (n == cap) {', id: "check" },
    { html: '  new = alloc(2 * cap);', id: "alloc" },
    { html: '  copy n elements; <span class="code-cm">/* pay from bank */</span>', id: "copy" },
    { html: '  cap = 2 * cap;', id: "grow" },
    { html: '}' },
    { html: 'a[n++] = x; <span class="code-cm">/* actual cost 1 */</span>', id: "write" },
    { html: 'bank += 2; <span class="code-cm">/* save for later copies */</span>', id: "bank" }
  ];

  function initAm() {
    var slotsRoot = document.getElementById("am-slots");
    var bankRoot = document.getElementById("am-bank");
    var status = document.getElementById("am-status");
    var badge = document.getElementById("am-badge");
    var opsEl = document.getElementById("am-ops");
    var nEl = document.getElementById("am-n");
    var capEl = document.getElementById("am-cap");
    var tokEl = document.getElementById("am-tokens");
    var actEl = document.getElementById("am-actual");
    var amEl = document.getElementById("am-amsum");
    var codeRoot = document.getElementById("am-code");
    var codeNote = document.getElementById("am-code-note");
    if (!slotsRoot) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var n = 0;
    var cap = 1;
    var tokens = 0;
    var actualSum = 0;
    var amSum = 0;
    var ops = 0;
    var busy = false;
    var lineEls = {};

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
        var ln = document.createElement("span");
        ln.className = "code-ln";
        ln.textContent = String(i + 1);
        var src = document.createElement("span");
        src.className = "code-src";
        src.innerHTML = line.html;
        row.appendChild(ln);
        row.appendChild(src);
        codeRoot.appendChild(row);
      });
    }

    function highlight(id) {
      Object.keys(lineEls).forEach(function (key) {
        var el = lineEls[key];
        el.classList.toggle("is-active", key === id);
        el.classList.toggle("is-dim", Boolean(id) && key !== id);
      });
    }

    function paint() {
      slotsRoot.innerHTML = "";
      for (var i = 0; i < cap; i++) {
        var slot = document.createElement("div");
        slot.className = "am-slot" + (i < n ? " is-filled" : " is-empty");
        slot.setAttribute("role", "listitem");
        slot.textContent = i < n ? String(i + 1) : "·";
        slotsRoot.appendChild(slot);
      }
      if (bankRoot) {
        bankRoot.innerHTML = "";
        for (var t = 0; t < tokens; t++) {
          var coin = document.createElement("span");
          coin.className = "am-token" + (!reduceMotion ? " is-pulse" : "");
          coin.setAttribute("role", "listitem");
          coin.textContent = "●";
          bankRoot.appendChild(coin);
        }
        if (!tokens) {
          var empty = document.createElement("span");
          empty.className = "am-bank-empty";
          empty.textContent = "empty";
          bankRoot.appendChild(empty);
        }
      }
      if (nEl) nEl.textContent = String(n);
      if (capEl) capEl.textContent = String(cap);
      if (tokEl) tokEl.textContent = String(tokens);
      if (actEl) actEl.textContent = String(actualSum);
      if (amEl) amEl.textContent = String(amSum);
      if (opsEl) opsEl.textContent = String(ops);
    }

    function reset() {
      n = 0;
      cap = 1;
      tokens = 0;
      actualSum = 0;
      amSum = 0;
      ops = 0;
      busy = false;
      paint();
      highlight("sig");
      if (badge) {
        badge.textContent = "ready";
        badge.dataset.phase = "ready";
      }
      if (codeNote) {
        codeNote.innerHTML = "Charge <strong>3</strong> per push; bank pays for copies.";
      }
      if (status) status.textContent = "Empty array, capacity 1. Push to insert and pay tokens.";
    }

    function pushOnce(done) {
      if (busy) return;
      busy = true;
      ops += 1;
      amSum += 3;
      var resized = n === cap;

      function finishWrite() {
        n += 1;
        actualSum += 1;
        tokens += 2;
        highlight("bank");
        if (badge) {
          badge.textContent = "push";
          badge.dataset.phase = "push";
        }
        paint();
        if (codeNote) {
          codeNote.innerHTML =
            "Wrote element · banked <strong>2</strong> tokens · amortized charge 3.";
        }
        if (status) {
          status.textContent =
            "Push #" +
            ops +
            ": actual " +
            (resized ? n - 1 + 1 : 1) +
            (resized ? " (incl. copy)" : "") +
            ", amortized 3. Avg actual=" +
            (actualSum / ops).toFixed(2);
        }
        busy = false;
        if (typeof done === "function") done();
      }

      if (resized) {
        highlight("check");
        if (badge) {
          badge.textContent = "resize";
          badge.dataset.phase = "resize";
        }
        if (status) status.textContent = "Capacity full — doubling…";
        window.setTimeout(
          function () {
            highlight("copy");
            var copyCost = n;
            actualSum += copyCost;
            tokens -= copyCost;
            if (tokens < 0) tokens = 0;
            cap = cap * 2;
            paint();
            if (codeNote) {
              codeNote.innerHTML =
                "Copied <strong>" +
                copyCost +
                "</strong> slots · paid from token bank.";
            }
            window.setTimeout(
              function () {
                highlight("write");
                finishWrite();
              },
              reduceMotion ? 0 : 220
            );
          },
          reduceMotion ? 0 : 280
        );
      } else {
        highlight("write");
        window.setTimeout(finishWrite, reduceMotion ? 0 : 120);
      }
    }

    function burst() {
      var left = 4;
      function next() {
        if (left <= 0) return;
        left -= 1;
        pushOnce(function () {
          window.setTimeout(next, reduceMotion ? 40 : 180);
        });
      }
      next();
    }

    renderCode();
    reset();

    document.querySelectorAll("[data-am-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-am-action");
        if (action === "push") pushOnce();
        else if (action === "burst") burst();
        else if (action === "reset") reset();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAm);
  } else {
    initAm();
  }
})();
