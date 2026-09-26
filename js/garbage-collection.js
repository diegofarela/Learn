/**
 * Mark-and-sweep garbage collection visual.
 */
(function () {
  var INITIAL = {
    objects: [
      { id: "A", x: 18, y: 28, refs: ["B", "C"] },
      { id: "B", x: 48, y: 18, refs: ["D"] },
      { id: "C", x: 48, y: 48, refs: [] },
      { id: "D", x: 78, y: 18, refs: [] },
      { id: "E", x: 78, y: 55, refs: ["F"] },
      { id: "F", x: 48, y: 72, refs: [] }
    ],
    roots: ["A"]
  };

  var CODE_LINES = [
    { html: '<span class="code-type">void</span> <span class="code-fn">gc</span>() {', id: "sig" },
    { html: '  <span class="code-kw">for</span> (r <span class="code-kw">in</span> roots) mark(r);', id: "mark-roots" },
    { html: '  <span class="code-cm">/* mark: DFS / BFS via refs */</span>', id: "mark" },
    { html: '  <span class="code-kw">for</span> (obj <span class="code-kw">in</span> heap) {', id: "sweep-loop" },
    { html: '    <span class="code-kw">if</span> (!obj.marked) free(obj);', id: "sweep" },
    { html: '    <span class="code-kw">else</span> obj.marked = <span class="code-kw">false</span>;', id: "clear" },
    { html: '  }' },
    { html: '}' }
  ];

  function cloneState() {
    return {
      objects: INITIAL.objects.map(function (o) {
        return { id: o.id, x: o.x, y: o.y, refs: o.refs.slice(), marked: false, dead: false };
      }),
      roots: INITIAL.roots.slice()
    };
  }

  function initGc() {
    var heapEl = document.getElementById("gc-heap");
    var status = document.getElementById("gc-status");
    var badge = document.getElementById("gc-badge");
    var liveEl = document.getElementById("gc-live");
    var codeRoot = document.getElementById("gc-code");
    var codeNote = document.getElementById("gc-code-note");
    if (!heapEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var state = cloneState();
    var phase = "idle";
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

    function byId(id) {
      for (var i = 0; i < state.objects.length; i++) {
        if (state.objects[i].id === id) return state.objects[i];
      }
      return null;
    }

    function liveCount() {
      return state.objects.filter(function (o) {
        return !o.dead;
      }).length;
    }

    function render() {
      heapEl.innerHTML = "";
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "gc-edges");
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "none");

      state.objects.forEach(function (o) {
        if (o.dead) return;
        o.refs.forEach(function (rid) {
          var t = byId(rid);
          if (!t || t.dead) return;
          var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", String(o.x));
          line.setAttribute("y1", String(o.y));
          line.setAttribute("x2", String(t.x));
          line.setAttribute("y2", String(t.y));
          line.setAttribute(
            "class",
            "gc-edge" + (o.marked && t.marked ? " is-marked" : "")
          );
          svg.appendChild(line);
        });
      });
      heapEl.appendChild(svg);

      state.roots.forEach(function (rid) {
        var root = byId(rid);
        if (!root || root.dead) return;
        var r = document.createElement("div");
        r.className = "gc-root";
        r.style.left = root.x + "%";
        r.style.top = Math.max(4, root.y - 14) + "%";
        r.textContent = "root";
        heapEl.appendChild(r);
      });

      state.objects.forEach(function (o) {
        if (o.dead) return;
        var el = document.createElement("div");
        el.className = "gc-obj";
        if (o.marked) el.classList.add("is-marked");
        if (phase === "sweep" && !o.marked) el.classList.add("is-garbage");
        el.style.left = o.x + "%";
        el.style.top = o.y + "%";
        el.textContent = o.id;
        el.title = o.id + " → [" + o.refs.join(", ") + "]";
        heapEl.appendChild(el);
      });

      if (liveEl) liveEl.textContent = String(liveCount());
    }

    function doMark(done) {
      state.objects.forEach(function (o) {
        o.marked = false;
      });
      phase = "mark";
      setBadge("marking");
      highlight("mark-roots");
      setCodeNote("Mark from roots, then follow references.");

      var queue = state.roots.slice();
      var seen = {};

      function stepMark() {
        if (!queue.length) {
          highlight("mark");
          setStatus("Mark done. Unmarked objects are garbage.");
          setBadge("marked");
          render();
          if (done) done();
          return;
        }
        var id = queue.shift();
        if (seen[id]) {
          stepMark();
          return;
        }
        seen[id] = true;
        var obj = byId(id);
        if (!obj || obj.dead) {
          stepMark();
          return;
        }
        obj.marked = true;
        highlight("mark");
        setCodeNote("Marked <strong>" + id + "</strong>.");
        render();
        obj.refs.forEach(function (r) {
          if (!seen[r]) queue.push(r);
        });
        after(reduceMotion ? 0 : 320, stepMark);
      }

      render();
      after(reduceMotion ? 0 : 200, stepMark);
    }

    function doSweep(done) {
      phase = "sweep";
      setBadge("sweeping");
      highlight("sweep-loop");
      setCodeNote("Free every unmarked object.");
      render();

      var garbage = state.objects.filter(function (o) {
        return !o.dead && !o.marked;
      });
      var i = 0;

      function stepSweep() {
        if (i >= garbage.length) {
          state.objects.forEach(function (o) {
            if (!o.dead) o.marked = false;
          });
          phase = "idle";
          highlight("clear");
          setBadge("idle");
          setStatus("Sweep done. Freed " + garbage.length + " object(s). Live: " + liveCount() + ".");
          setCodeNote("Clear marks for the next collection.");
          render();
          if (done) done();
          return;
        }
        var g = garbage[i++];
        highlight("sweep");
        setCodeNote("Free unreachable <strong>" + g.id + "</strong>.");
        g.dead = true;
        render();
        after(reduceMotion ? 0 : 360, stepSweep);
      }

      after(reduceMotion ? 0 : 280, stepSweep);
    }

    function mark() {
      if (busy) return;
      busy = true;
      clearTimers();
      doMark(function () {
        busy = false;
      });
    }

    function sweep() {
      if (busy) return;
      var anyMarked = state.objects.some(function (o) {
        return o.marked;
      });
      if (!anyMarked) {
        setStatus("Run Mark first so reachable objects are tagged.");
        return;
      }
      busy = true;
      clearTimers();
      doSweep(function () {
        busy = false;
      });
    }

    function cycle() {
      if (busy) return;
      busy = true;
      clearTimers();
      highlight("sig");
      setCodeNote("Full GC: mark, then sweep.");
      doMark(function () {
        after(reduceMotion ? 0 : 400, function () {
          doSweep(function () {
            busy = false;
          });
        });
      });
    }

    function reset() {
      clearTimers();
      busy = false;
      state = cloneState();
      phase = "idle";
      highlight(null);
      setBadge("idle");
      setStatus("Heap ready. Mark reachable objects from roots, then sweep.");
      setCodeNote("Run Mark, then Sweep — or Full GC for both.");
      render();
    }

    renderCode();
    render();

    document.querySelectorAll("[data-gc-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-gc-action");
        if (a === "mark") mark();
        else if (a === "sweep") sweep();
        else if (a === "cycle") cycle();
        else if (a === "reset") reset();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGc);
  } else {
    initGc();
  }
})();
