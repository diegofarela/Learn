/**
 * RPC stub → network → skeleton sequence vs REST contrast.
 */
(function () {
  var RPC_STEPS = [
    {
      note: "Ready — press Step to invoke the remote procedure.",
      active: null,
      edge: null,
      log: ["# result = stub.add(2, 3)"]
    },
    {
      note: "Client calls the local stub as if add were local.",
      active: "client",
      edge: null,
      log: ["client: add(2, 3)"]
    },
    {
      note: "Stub marshals arguments into a network message.",
      active: "stub",
      edge: "stub",
      log: ["stub: marshal(op=add, args=[2,3])"]
    },
    {
      note: "Bytes cross the network to the server.",
      active: "net",
      edge: "net",
      log: ["network: → {op:add, a:2, b:3}"]
    },
    {
      note: "Skeleton unmarshals and dispatches to the implementation.",
      active: "skel",
      edge: "skel",
      log: ["skeleton: unmarshal → impl.add(2, 3)"]
    },
    {
      note: "Implementation returns 5; reply travels back through the stub.",
      active: "impl",
      edge: "impl",
      log: ["impl: return 5", "stub: unmarshal reply → 5"]
    }
  ];

  var REST_STEPS = [
    {
      note: "Ready — REST models an operation as an HTTP verb on a resource.",
      active: null,
      edge: null,
      log: ["# POST /math/sum  {\"a\":2,\"b\":3}"]
    },
    {
      note: "Client builds an HTTP request to a resource URL.",
      active: "client",
      edge: null,
      log: ["client: POST /math/sum"]
    },
    {
      note: "No generated stub — the client speaks HTTP directly.",
      active: "stub",
      edge: "stub",
      log: ["http: Content-Type: application/json"]
    },
    {
      note: "Request crosses the network (often TLS).",
      active: "net",
      edge: "net",
      log: ["network: → POST /math/sum {a:2,b:3}"]
    },
    {
      note: "Server routes the path to a handler (no RPC skeleton).",
      active: "skel",
      edge: "skel",
      log: ["router: /math/sum → handler"]
    },
    {
      note: "Handler returns 201 + body; client parses JSON.",
      active: "impl",
      edge: "impl",
      log: ["← 201 {\"sum\":5}"]
    }
  ];

  function initRpc() {
    var styleEl = document.getElementById("rpc-style");
    var status = document.getElementById("rpc-status");
    var meta = document.getElementById("rpc-meta");
    var flow = document.getElementById("rpc-flow");
    var codeRoot = document.getElementById("rpc-code");
    var codeNote = document.getElementById("rpc-code-note");
    var codeLang = document.getElementById("rpc-code-lang");
    var midLabel = document.getElementById("rpc-mid-label");
    var midSub = document.getElementById("rpc-mid-sub");
    var skelLabel = document.getElementById("rpc-skel-label");
    var skelSub = document.getElementById("rpc-skel-sub");
    var clientSub = document.getElementById("rpc-client-sub");
    var implSub = document.getElementById("rpc-impl-sub");
    if (!styleEl || !flow) return;

    var step = 0;
    var playTimer = null;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function steps() {
      return styleEl.value === "rest" ? REST_STEPS : RPC_STEPS;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function clearPlay() {
      if (playTimer) {
        clearTimeout(playTimer);
        playTimer = null;
      }
    }

    function renderCode(s) {
      if (!codeRoot) return;
      codeRoot.innerHTML = "";
      (s.log || []).forEach(function (line) {
        var row = document.createElement("div");
        row.className = "code-line";
        row.textContent = line;
        codeRoot.appendChild(row);
      });
    }

    function labels() {
      var rest = styleEl.value === "rest";
      if (midLabel) midLabel.textContent = rest ? "HTTP client" : "Stub";
      if (midSub) midSub.textContent = rest ? "request" : "marshal";
      if (skelLabel) skelLabel.textContent = rest ? "Router" : "Skeleton";
      if (skelSub) skelSub.textContent = rest ? "dispatch" : "unmarshal";
      if (clientSub) clientSub.textContent = rest ? "POST /math/sum" : "add(2, 3)";
      if (implSub) implSub.textContent = rest ? '{"sum":5}' : "return 5";
      if (codeLang) codeLang.textContent = rest ? "REST" : "RPC";
      if (codeNote) {
        codeNote.textContent = rest
          ? "REST: verbs on resources, not local-looking calls."
          : "Stubs hide the network; the call still fails if the network does.";
      }
    }

    function apply(s) {
      setStatus(s.note);
      if (meta) meta.textContent = String(step) + "/" + String(steps().length - 1);
      labels();
      flow.querySelectorAll("[data-rpc-node]").forEach(function (el) {
        el.classList.toggle(
          "is-active",
          s.active === el.getAttribute("data-rpc-node")
        );
      });
      flow.querySelectorAll("[data-rpc-edge]").forEach(function (el) {
        el.classList.toggle(
          "is-active",
          s.edge === el.getAttribute("data-rpc-edge")
        );
      });
      renderCode(s);
    }

    function go(n) {
      var list = steps();
      step = Math.max(0, Math.min(n, list.length - 1));
      apply(list[step]);
    }

    function onStep() {
      var list = steps();
      if (step >= list.length - 1) {
        clearPlay();
        return;
      }
      go(step + 1);
    }

    function onPlay() {
      clearPlay();
      if (step >= steps().length - 1) go(0);
      function tick() {
        if (step >= steps().length - 1) {
          clearPlay();
          return;
        }
        onStep();
        playTimer = window.setTimeout(tick, reduceMotion ? 0 : 750);
      }
      tick();
    }

    document.querySelectorAll("[data-rpc-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-rpc-action");
        if (a === "step") {
          clearPlay();
          onStep();
        } else if (a === "play") onPlay();
        else if (a === "reset") {
          clearPlay();
          go(0);
        }
      });
    });

    styleEl.addEventListener("change", function () {
      clearPlay();
      go(0);
    });

    go(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRpc);
  } else {
    initRpc();
  }
})();
