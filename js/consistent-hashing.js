/**
 * Consistent hashing: ring; add/remove node; minimal key remap.
 */
(function () {
  var RING = 360;
  var KEYS = ["apple", "banana", "cherry", "date", "elder", "fig", "grape", "honey"];

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % RING + RING) % RING;
  }

  function init() {
    var ringEl = document.getElementById("chash-ring");
    var keysEl = document.getElementById("chash-keys");
    var status = document.getElementById("chash-status");
    var phase = document.getElementById("chash-phase");
    var meta = document.getElementById("chash-meta");
    var codeRoot = document.getElementById("chash-code");
    var codeNote = document.getElementById("chash-code-note");
    if (!ringEl) return;

    var nodes = [
      { id: "A", pos: 40 },
      { id: "B", pos: 160 },
      { id: "C", pos: 280 }
    ];
    var nextId = 68; /* 'D' */
    var prevAssign = {};

    function sortedNodes() {
      return nodes.slice().sort(function (a, b) {
        return a.pos - b.pos;
      });
    }

    function owner(keyHash) {
      var s = sortedNodes();
      if (!s.length) return null;
      for (var i = 0; i < s.length; i++) {
        if (keyHash <= s[i].pos) return s[i].id;
      }
      return s[0].id;
    }

    function assignments() {
      var map = {};
      KEYS.forEach(function (k) {
        map[k] = owner(hashStr(k));
      });
      return map;
    }

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

    function paint(moved) {
      if (meta) meta.textContent = String(nodes.length);
      if (phase) phase.textContent = nodes.length + " NODES";

      ringEl.innerHTML = "";
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 220 220");
      svg.setAttribute("class", "chash-svg");
      var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "110");
      circle.setAttribute("cy", "110");
      circle.setAttribute("r", "88");
      circle.setAttribute("class", "chash-circle");
      svg.appendChild(circle);

      function polar(deg, r) {
        var rad = ((deg - 90) * Math.PI) / 180;
        return { x: 110 + r * Math.cos(rad), y: 110 + r * Math.sin(rad) };
      }

      nodes.forEach(function (n) {
        var p = polar(n.pos, 88);
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", String(p.x));
        c.setAttribute("cy", String(p.y));
        c.setAttribute("r", "10");
        c.setAttribute("class", "chash-node");
        var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", String(p.x));
        t.setAttribute("y", String(p.y + 4));
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("class", "chash-node-t");
        t.textContent = n.id;
        g.appendChild(c);
        g.appendChild(t);
        svg.appendChild(g);
      });

      KEYS.forEach(function (k) {
        var h = hashStr(k);
        var p = polar(h, 70);
        var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", String(p.x));
        c.setAttribute("cy", String(p.y));
        c.setAttribute("r", "4");
        c.setAttribute(
          "class",
          "chash-keydot" + (moved && moved[k] ? " is-moved" : "")
        );
        svg.appendChild(c);
      });

      ringEl.appendChild(svg);

      var assign = assignments();
      if (keysEl) {
        keysEl.innerHTML = "";
        KEYS.forEach(function (k) {
          var row = document.createElement("div");
          row.className =
            "chash-keyrow" + (moved && moved[k] ? " is-moved" : "");
          row.innerHTML =
            '<code>' +
            k +
            '</code><span>→ ' +
            assign[k] +
            "</span>";
          keysEl.appendChild(row);
        });
      }
    }

    function diff(prev, next) {
      var moved = {};
      var count = 0;
      KEYS.forEach(function (k) {
        if (prev[k] !== next[k]) {
          moved[k] = true;
          count += 1;
        }
      });
      return { moved: moved, count: count };
    }

    function addNode() {
      if (nodes.length >= 6) {
        if (status) status.textContent = "Demo caps at 6 nodes.";
        return;
      }
      var prev = assignments();
      var id = String.fromCharCode(nextId);
      nextId += 1;
      var pos = Math.floor(Math.random() * RING);
      nodes.push({ id: id, pos: pos });
      var next = assignments();
      var d = diff(prev, next);
      paint(d.moved);
      if (status) {
        status.textContent =
          "Added " + id + " @ " + pos + "° — " + d.count + " key(s) remapped.";
      }
      renderCode([
        "node " + id + " at " + pos,
        "remapped " + d.count + " / " + KEYS.length + " keys",
        "≈ 1/N of the keyspace moves"
      ]);
      if (codeNote) codeNote.textContent = "Only keys in the affected arc remapped.";
      prevAssign = next;
    }

    function removeNode() {
      if (nodes.length <= 2) {
        if (status) status.textContent = "Keep at least 2 nodes for the demo.";
        return;
      }
      var prev = assignments();
      var removed = nodes.pop();
      var next = assignments();
      var d = diff(prev, next);
      paint(d.moved);
      if (status) {
        status.textContent =
          "Removed " + removed.id + " — " + d.count + " key(s) remapped.";
      }
      renderCode([
        "remove " + removed.id,
        "remapped " + d.count + " / " + KEYS.length + " keys",
        "others stay put"
      ]);
      if (codeNote) codeNote.textContent = "Only keys in the affected arc remapped.";
      prevAssign = next;
    }

    function reset() {
      nodes = [
        { id: "A", pos: 40 },
        { id: "B", pos: 160 },
        { id: "C", pos: 280 }
      ];
      nextId = 68;
      prevAssign = assignments();
      paint(null);
      if (status) {
        status.textContent = "Keys map clockwise to the next node on the ring.";
      }
      renderCode([
        "nodes A@40 B@160 C@280",
        "lookup: clockwise successor",
        "hash(key) mod 360"
      ]);
      if (codeNote) codeNote.textContent = "Only keys in the affected arc remapped.";
    }

    document.querySelectorAll("[data-chash-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var a = btn.getAttribute("data-chash-action");
          if (a === "add") addNode();
          else if (a === "remove") removeNode();
          else if (a === "reset") reset();
        } catch (err) {
          console.error("[learn-chash] Action failed", err);
        }
      });
    });

    reset();
  }

  try {
    init();
  } catch (err) {
    console.error("[learn-chash] Init failed", err);
  }
})();
