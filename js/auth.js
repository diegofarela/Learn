/**
 * Auth demo: login → session token; authorization role check.
 */
(function () {
  var USERS = {
    alice: { role: "user", token: "tok_alice_7f3a" },
    bob: { role: "admin", token: "tok_bob_c91e" }
  };

  var CODE_LINES = [
    { html: '<span class="code-type">Session</span> <span class="code-fn">login</span>(user, pass) {', id: "login" },
    { html: '  <span class="code-kw">if</span> (!verify(user, pass)) <span class="code-kw">throw</span> AuthError;', id: "verify" },
    { html: '  <span class="code-kw">return</span> issueToken(user); <span class="code-cm">/* authn */</span>', id: "token" },
    { html: '}' },
    { blank: true },
    { html: '<span class="code-type">bool</span> <span class="code-fn">authorize</span>(token, action) {', id: "authz" },
    { html: '  user = resolve(token);', id: "resolve" },
    { html: '  <span class="code-kw">return</span> user.role <span class="code-kw">in</span> policy[action];', id: "role" },
    { html: '}' }
  ];

  function initAuth() {
    var userSel = document.getElementById("auth-user");
    var tokenEl = document.getElementById("auth-token");
    var sessionEl = document.getElementById("auth-session");
    var verdictEl = document.getElementById("auth-verdict");
    var status = document.getElementById("auth-status");
    var badge = document.getElementById("auth-badge");
    var roleLabel = document.getElementById("auth-role-label");
    var flow = document.getElementById("auth-flow");
    var codeRoot = document.getElementById("auth-code");
    var codeNote = document.getElementById("auth-code-note");
    if (!userSel || !tokenEl) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var session = null;
    var lineEls = {};
    var stepTimers = [];

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
        if (line.blank) row.innerHTML = "&nbsp;";
        else row.innerHTML = line.html || "&nbsp;";
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

    function flashStep(name) {
      if (!flow) return;
      flow.querySelectorAll(".auth-card").forEach(function (c) {
        c.classList.toggle("is-active", c.getAttribute("data-auth-step") === name);
      });
    }

    function renderSession() {
      if (!session) {
        tokenEl.textContent = "token: —";
        sessionEl.textContent = "No active session";
        verdictEl.textContent = "—";
        verdictEl.className = "auth-verdict";
        if (roleLabel) roleLabel.textContent = "guest";
        setBadge("logged out");
        return;
      }
      tokenEl.textContent = "token: " + session.token;
      sessionEl.innerHTML =
        "<strong>" +
        session.name +
        '</strong> · role <code>' +
        session.role +
        "</code>";
      if (roleLabel) roleLabel.textContent = session.role;
      setBadge(session.name + " · " + session.role);
    }

    function login() {
      clearTimers();
      var name = userSel.value;
      var u = USERS[name];
      if (!u) return;
      flashStep("login");
      highlight("login");
      setCodeNote("Authenticating <strong>" + name + "</strong>…");
      after(reduceMotion ? 0 : 320, function () {
        highlight("verify");
        setCodeNote("Verify credentials (password / IdP).");
      });
      after(reduceMotion ? 0 : 640, function () {
        highlight("token");
        session = { name: name, role: u.role, token: u.token };
        renderSession();
        flashStep("session");
        setCodeNote("Issue session token — identity established.");
        setStatus("Authenticated as " + name + " (" + u.role + "). Token issued.");
      });
    }

    function tryAction() {
      clearTimers();
      if (!session) {
        flashStep("authz");
        verdictEl.textContent = "401 Unauthorized";
        verdictEl.className = "auth-verdict is-deny";
        highlight("authz");
        setCodeNote("No token — reject before role check.");
        setStatus("Denied: not authenticated. Log in first.");
        return;
      }
      flashStep("authz");
      highlight("authz");
      setCodeNote("Authorization check for DELETE /admin/users.");
      after(reduceMotion ? 0 : 280, function () {
        highlight("resolve");
        setCodeNote("Resolve token → user <strong>" + session.name + "</strong>.");
      });
      after(reduceMotion ? 0 : 560, function () {
        highlight("role");
        var ok = session.role === "admin";
        if (ok) {
          verdictEl.textContent = "200 OK · allowed";
          verdictEl.className = "auth-verdict is-allow";
          setCodeNote("Role <strong>admin</strong> is in the policy — allow.");
          setStatus("Authorized: " + session.name + " may delete users.");
        } else {
          verdictEl.textContent = "403 Forbidden";
          verdictEl.className = "auth-verdict is-deny";
          setCodeNote("Role <strong>user</strong> is not permitted — deny.");
          setStatus("Authenticated but not authorized (need admin).");
        }
      });
    }

    function logout() {
      clearTimers();
      session = null;
      renderSession();
      flashStep("login");
      highlight(null);
      setCodeNote("Log in, then attempt the protected action.");
      setStatus("Logged out. Authenticate to receive a session token.");
    }

    renderCode();
    renderSession();

    document.querySelectorAll("[data-auth-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var a = btn.getAttribute("data-auth-action");
        if (a === "login") login();
        else if (a === "try") tryAction();
        else if (a === "logout") logout();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuth);
  } else {
    initAuth();
  }
})();
