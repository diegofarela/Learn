/**
 * Logical clocks: Lamport timestamps on send/recv.
 */
(function () {
  function init() {
    var procsEl = document.getElementById("lclock-procs");
    var msgEl = document.getElementById("lclock-msg");
    var status = document.getElementById("lclock-status");
    var phase = document.getElementById("lclock-phase");
    var meta = document.getElementById("lclock-meta");
    var codeRoot = document.getElementById("lclock-code");
    var codeNote = document.getElementById("lclock-code-note");
    if (!procsEl) return;

    var C = { A: 0, B: 0, C: 0 };
    var inflight = null; /* { from, to, t } */
    var last = "—";

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
      var maxC = Math.max(C.A, C.B, C.C);
      if (meta) meta.textContent = String(maxC);
      if (phase) phase.textContent = inflight ? "IN FLIGHT" : "READY";

      procsEl.innerHTML = "";
      ["A", "B", "C"].forEach(function (p) {
        var d = document.createElement("div");
        d.className =
          "lclock-proc" + (last === p ? " is-active" : "");
        d.innerHTML =
          '<span class="lclock-proc-n">P' +
          p +
          '</span><span class="lclock-proc-c">C=' +
          C[p] +
          "</span>";
        procsEl.appendChild(d);
      });

      if (msgEl) {
        msgEl.textContent = inflight
          ? "msg " +
            inflight.from +
            "→" +
            inflight.to +
            "  stamp=" +
            inflight.t
          : "no message in flight";
        msgEl.classList.toggle("is-on", !!inflight);
      }
    }

    function local(p) {
      C[p] += 1;
      last = p;
      if (status) status.textContent = "P" + p + " local event → C=" + C[p];
      renderCode([
        "P" + p + ": C = C + 1",
        "C_" + p + " = " + C[p]
      ]);
      if (codeNote) codeNote.textContent = "Local events always tick the clock.";
      paint();
    }

    function send(from, to) {
      if (inflight) {
        if (status) status.textContent = "Deliver the in-flight message first.";
        return;
      }
      C[from] += 1;
      inflight = { from: from, to: to, t: C[from] };
      last = from;
      if (status) {
        status.textContent =
          "P" + from + " send → stamp " + inflight.t + " (in flight to P" + to + ")";
      }
      renderCode([
        "P" + from + ": C = C + 1  // before send",
        "send(msg, t=" + inflight.t + ") → P" + to
      ]);
      if (codeNote) codeNote.textContent = "Timestamp is captured after the send tick.";
      paint();
    }

    function recv(to) {
      if (!inflight || inflight.to !== to) {
        if (status) {
          status.textContent = "No message waiting for P" + to + ".";
        }
        return;
      }
      var t = inflight.t;
      var from = inflight.from;
      var before = C[to];
      C[to] = Math.max(C[to], t) + 1;
      inflight = null;
      last = to;
      if (status) {
        status.textContent =
          "P" + to + " recv: max(" + before + ", " + t + ") + 1 = " + C[to];
      }
      renderCode([
        "(msg, t=" + t + ") from P" + from,
        "C = max(" + before + ", " + t + ") + 1",
        "C_" + to + " = " + C[to]
      ]);
      if (codeNote) {
        codeNote.textContent = "On recv: C = max(C_local, C_msg) + 1";
      }
      paint();
    }

    function reset() {
      C = { A: 0, B: 0, C: 0 };
      inflight = null;
      last = "—";
      if (status) {
        status.textContent =
          "Each process starts at C=0. Local events and sends increment first.";
      }
      renderCode([
        "C_A = C_B = C_C = 0",
        "send: C++; attach C",
        "recv: C = max(C, t) + 1"
      ]);
      if (codeNote) {
        codeNote.textContent = "On recv: C = max(C_local, C_msg) + 1";
      }
      paint();
    }

    document.querySelectorAll("[data-lclock-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var a = btn.getAttribute("data-lclock-action");
          if (a === "local-a") local("A");
          else if (a === "local-b") local("B");
          else if (a === "send-ab") send("A", "B");
          else if (a === "recv-b") recv("B");
          else if (a === "send-bc") send("B", "C");
          else if (a === "recv-c") recv("C");
          else if (a === "reset") reset();
        } catch (err) {
          console.error("[learn-lclock] Action failed", err);
        }
      });
    });

    reset();
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-lclock] Init failed", err);
  }
})();
