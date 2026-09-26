/**
 * Clickable TCP/IP or OSI stack layers with short role text.
 */
(function () {
  var MODELS = {
    tcpip: [
      {
        id: "app",
        name: "Application",
        role: "End-user protocols: HTTP, DNS, TLS APIs, SMTP…",
        examples: "HTTP · DNS · SSH"
      },
      {
        id: "transport",
        name: "Transport",
        role: "Process-to-process channels: ports, reliability (TCP) or datagrams (UDP).",
        examples: "TCP · UDP"
      },
      {
        id: "internet",
        name: "Internet",
        role: "Routing packets across networks with IP addresses.",
        examples: "IPv4 · IPv6 · ICMP"
      },
      {
        id: "link",
        name: "Link",
        role: "Frame delivery on a local network segment (MAC, Wi-Fi, Ethernet).",
        examples: "Ethernet · Wi-Fi"
      }
    ],
    osi: [
      {
        id: "l7",
        name: "7 Application",
        role: "Closest to the user — network services and APIs.",
        examples: "HTTP · DNS · FTP"
      },
      {
        id: "l6",
        name: "6 Presentation",
        role: "Syntax and encoding: encryption, compression, serialization.",
        examples: "TLS · MIME · codecs"
      },
      {
        id: "l5",
        name: "5 Session",
        role: "Dialogs and sessions between applications.",
        examples: "RPC · sockets (session)"
      },
      {
        id: "l4",
        name: "4 Transport",
        role: "End-to-end delivery, ports, segmentation.",
        examples: "TCP · UDP"
      },
      {
        id: "l3",
        name: "3 Network",
        role: "Path selection and logical addressing (IP).",
        examples: "IP · routers"
      },
      {
        id: "l2",
        name: "2 Data link",
        role: "Frames between nodes on a link; MAC addresses.",
        examples: "Ethernet · PPP"
      },
      {
        id: "l1",
        name: "1 Physical",
        role: "Bits on the wire — voltage, fiber, radio.",
        examples: "cables · radio"
      }
    ]
  };

  function initOsi() {
    var stackEl = document.getElementById("osi-stack");
    var status = document.getElementById("osi-status");
    var meta = document.getElementById("osi-meta");
    var codeRoot = document.getElementById("osi-code");
    var codeNote = document.getElementById("osi-code-note");
    var codeLang = document.getElementById("osi-code-lang");
    if (!stackEl) return;

    var model = "tcpip";
    var index = 0;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function layers() {
      return MODELS[model] || MODELS.tcpip;
    }

    function setStatus(msg) {
      if (status) status.textContent = msg;
    }

    function setCodeNote(html) {
      if (codeNote) codeNote.innerHTML = html;
    }

    function paint() {
      var list = layers();
      if (index < 0) index = 0;
      if (index >= list.length) index = list.length - 1;
      var layer = list[index];

      stackEl.innerHTML = "";
      list.forEach(function (L, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "osi-layer" + (i === index ? " is-active" : "");
        btn.setAttribute("role", "listitem");
        btn.setAttribute("aria-pressed", i === index ? "true" : "false");
        btn.dataset.osiIndex = String(i);
        btn.innerHTML =
          '<span class="osi-layer-name">' +
          L.name +
          '</span><span class="osi-layer-ex">' +
          L.examples +
          "</span>";
        btn.addEventListener("click", function () {
          try {
            index = i;
            paint();
          } catch (err) {
            console.error("[learn-osi] Layer click failed", err);
          }
        });
        stackEl.appendChild(btn);
      });

      if (!reduceMotion) {
        var active = stackEl.querySelector(".osi-layer.is-active");
        if (active) {
          active.classList.remove("is-flash");
          void active.offsetWidth;
          active.classList.add("is-flash");
        }
      }

      if (meta) meta.textContent = layer.name.replace(/^\d+\s+/, "");
      if (codeLang) codeLang.textContent = model === "tcpip" ? "TCP/IP" : "OSI";

      if (codeRoot) {
        codeRoot.innerHTML = "";
        var lines = [
          "model = " + (model === "tcpip" ? "TCP/IP" : "OSI"),
          "layer = " + layer.name,
          "role  = " + layer.role,
          "eg    = " + layer.examples
        ];
        lines.forEach(function (src, i) {
          var line = document.createElement("div");
          line.className = "code-line is-active";
          line.innerHTML =
            '<span class="code-ln">' +
            (i + 1) +
            '</span><span class="code-src">' +
            src +
            "</span>";
          codeRoot.appendChild(line);
        });
      }

      setStatus(layer.name + " — " + layer.role);
      setCodeNote(
        "Encapsulation: <strong>" +
          layer.name +
          "</strong> wraps the payload from above."
      );

      document.querySelectorAll("[data-osi-model]").forEach(function (btn) {
        btn.classList.toggle(
          "is-selected",
          btn.getAttribute("data-osi-model") === model
        );
      });
    }

    document.querySelectorAll("[data-osi-model]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          model = btn.getAttribute("data-osi-model") || "tcpip";
          index = 0;
          paint();
        } catch (err) {
          console.error("[learn-osi] Model change failed", err);
        }
      });
    });

    document.querySelectorAll("[data-osi-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-osi-action");
          if (action === "reset") {
            index = 0;
          } else if (action === "up") {
            index = Math.max(0, index - 1);
          } else if (action === "down") {
            index = Math.min(layers().length - 1, index + 1);
          }
          paint();
        } catch (err) {
          console.error("[learn-osi] Action failed", err);
        }
      });
    });

    paint();
  }

  try {
    initOsi();
  } catch (err) {
    console.error("[learn-osi] Init failed", err);
  }
})();
