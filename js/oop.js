/**
 * OOP: class → instances + Animal → Dog inheritance highlight.
 */
(function () {
  var NAMES = ["Rex", "Bella", "Max", "Luna", "Cooper"];
  var BREEDS = ["Lab", "Beagle", "Poodle", "Husky", "Corgi"];

  var CODE_LINES = [
    { html: '<span class="code-kw">class</span> Animal {', id: "animal" },
    { html: '  name;', id: "field" },
    { html: '  speak() { <span class="code-kw">return</span> "..."; }', id: "speak-base" },
    { html: '}' },
    { html: '<span class="code-kw">class</span> Dog <span class="code-kw">extends</span> Animal {', id: "dog" },
    { html: '  breed;', id: "breed" },
    { html: '  speak() { <span class="code-kw">return</span> "woof"; }', id: "speak" },
    { html: '}' },
    { html: 'dog = <span class="code-kw">new</span> Dog(...);', id: "new" },
    { html: 'dog.speak();', id: "call" }
  ];

  function initOop() {
    var instancesEl = document.getElementById("oop-instances");
    var status = document.getElementById("oop-status");
    var badge = document.getElementById("oop-badge");
    var countEl = document.getElementById("oop-count");
    var codeRoot = document.getElementById("oop-code");
    var codeNote = document.getElementById("oop-code-note");
    var animalNode = document.getElementById("oop-animal");
    var dogNode = document.getElementById("oop-dog");
    if (!instancesEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var objects = [];
    var lineEls = {};
    var inheritTimer = null;

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

    function clearTreeHighlight() {
      if (animalNode) animalNode.classList.remove("is-hot");
      if (dogNode) dogNode.classList.remove("is-hot");
    }

    function renderInstances() {
      instancesEl.innerHTML = "";
      objects.forEach(function (obj, i) {
        var card = document.createElement("div");
        card.className = "oop-obj" + (obj.speaking ? " is-speaking" : "");
        card.dataset.tone = String(i % 3);
        card.innerHTML =
          '<span class="oop-obj-type">Dog</span>' +
          '<span class="oop-obj-field">name: ' +
          obj.name +
          "</span>" +
          '<span class="oop-obj-field">breed: ' +
          obj.breed +
          "</span>" +
          '<span class="oop-obj-method">speak()</span>' +
          (obj.bubble
            ? '<span class="oop-obj-bubble">' + obj.bubble + "</span>"
            : "");
        instancesEl.appendChild(card);
      });
      if (countEl) countEl.textContent = String(objects.length);
    }

    function newDog() {
      try {
        if (objects.length >= 4) {
          setStatus("Max 4 instances — reset to spawn more.");
          return;
        }
        clearTreeHighlight();
        var i = objects.length;
        var obj = {
          name: NAMES[i % NAMES.length],
          breed: BREEDS[i % BREEDS.length],
          speaking: false,
          bubble: null
        };
        objects.push(obj);
        highlight("new");
        if (dogNode) dogNode.classList.add("is-hot");
        setBadge("instance");
        setCodeNote("new Dog — fields filled from the class blueprint.");
        setStatus("Created " + obj.name + " (" + obj.breed + ").");
        renderInstances();
        window.setTimeout(function () {
          highlight("field");
        }, reduceMotion ? 0 : 280);
      } catch (err) {
        console.error("[learn-oop] newDog failed", err);
      }
    }

    function highlightInherit() {
      try {
        if (inheritTimer) window.clearTimeout(inheritTimer);
        clearTreeHighlight();
        highlight("animal");
        if (animalNode) animalNode.classList.add("is-hot");
        setBadge("inherits");
        setCodeNote("Dog extends Animal — subclass reuses fields and methods.");
        setStatus("Highlighting inheritance: Animal → Dog.");
        inheritTimer = window.setTimeout(function () {
          highlight("dog");
          if (dogNode) dogNode.classList.add("is-hot");
        }, reduceMotion ? 0 : 500);
      } catch (err) {
        console.error("[learn-oop] inherit failed", err);
      }
    }

    function speak() {
      try {
        if (!objects.length) {
          setStatus("Create a Dog first.");
          return;
        }
        clearTreeHighlight();
        objects.forEach(function (o) {
          o.speaking = true;
          o.bubble = "woof";
        });
        highlight("call");
        if (dogNode) dogNode.classList.add("is-hot");
        setBadge("polymorphism");
        setCodeNote("speak() resolves to Dog’s override — polymorphism.");
        setStatus("All dogs speak() → \"woof\" (Dog overrides Animal).");
        renderInstances();
        window.setTimeout(function () {
          objects.forEach(function (o) {
            o.speaking = false;
            o.bubble = null;
          });
          renderInstances();
        }, reduceMotion ? 0 : 1200);
      } catch (err) {
        console.error("[learn-oop] speak failed", err);
      }
    }

    function reset() {
      try {
        if (inheritTimer) window.clearTimeout(inheritTimer);
        objects = [];
        clearTreeHighlight();
        highlight(null);
        setBadge("class");
        setCodeNote("Spawn objects — watch the class blueprint light up.");
        setStatus("Class Dog extends Animal. Create instances to see fields and methods.");
        renderInstances();
      } catch (err) {
        console.error("[learn-oop] reset failed", err);
      }
    }

    document.querySelectorAll("[data-oop-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try {
          var action = btn.getAttribute("data-oop-action");
          if (action === "new") newDog();
          else if (action === "inherit") highlightInherit();
          else if (action === "speak") speak();
          else if (action === "reset") reset();
        } catch (err) {
          console.error("[learn-oop] action failed", err);
        }
      });
    });

    renderCode();
    reset();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOop);
  } else {
    initOop();
  }
})();
