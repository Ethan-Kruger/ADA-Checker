// ── ADA Checker — frontend auth & plan management ────────────────────────────
//
// JWT is stored in an httpOnly cookie (set by the API, never readable by JS).
// User profile and plan are still cached in localStorage for fast UI rendering.
// Fetches the real plan from /api/auth/me on page load and caches it.

(function () {
  'use strict';

  var API = '/api';
  var PLAN_KEY  = 'ada-plan';   // still written so existing code keeps working
  var USER_KEY  = 'ada-user';

  function getUser()        { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e) { return null; } }
  function setUser(u)       { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
  function clearUser()      { localStorage.removeItem(USER_KEY); }

  // ── Auth API calls ───────────────────────────────────────────────────────────
  async function signup(email, password) {
    const res  = await fetch(API + '/auth/signup', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    // Token is stored in the httpOnly cookie set by the server — not in JS.
    setUser(data.user);
    localStorage.setItem(PLAN_KEY, data.plan || 'free');
    return data;
  }

  async function login(email, password) {
    const res  = await fetch(API + '/auth/login', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    // Token is stored in the httpOnly cookie set by the server — not in JS.
    setUser(data.user);
    localStorage.setItem(PLAN_KEY, data.plan || 'free');
    return data;
  }

  async function logout() {
    clearUser();
    localStorage.setItem(PLAN_KEY, 'free');
    try {
      await fetch(API + '/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // Best-effort — reload regardless
    }
    window.location.reload();
  }

  var PLAN_CACHE_KEY = 'ada-plan-synced-at';
  var PLAN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Fetches the latest plan from the API and syncs it to localStorage.
  // Skips the network call if the plan was synced less than 5 minutes ago,
  // unless ?upgrade=success is in the URL (forces a fresh fetch after Stripe).
  async function syncPlan() {
    // If no user profile is cached, we have no session — skip the request.
    if (!getUser()) return;

    const forceRefresh = new URLSearchParams(window.location.search).get('upgrade') === 'success';
    const lastSynced   = parseInt(localStorage.getItem(PLAN_CACHE_KEY) || '0', 10);
    const age          = Date.now() - lastSynced;

    if (!forceRefresh && age < PLAN_CACHE_TTL) return; // still fresh — skip network call

    try {
      const res  = await fetch(API + '/auth/me', { credentials: 'include' });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      if (data.plan) {
        localStorage.setItem(PLAN_KEY, data.plan);
        localStorage.setItem(PLAN_CACHE_KEY, String(Date.now()));
        if (data.user) setUser(data.user);
      }
    } catch (e) {
      // Network error — keep cached plan
    }
  }

  // ── Stripe checkout ──────────────────────────────────────────────────────────
  async function startCheckout(plan) {
    if (!getUser()) {
      showAuthModal('login');
      return;
    }
    try {
      const res  = await fetch(API + '/stripe/checkout', {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (!data.url) throw new Error('Could not create checkout session. Please try again.');
      window.location.href = data.url;
    } catch (e) {
      alert(e.message);
    }
  }

  // ── Auth modal ───────────────────────────────────────────────────────────────
  function buildModal() {
    if (document.getElementById('ada-auth-modal')) return;

    var modal = document.createElement('div');
    modal.id        = 'ada-auth-modal';
    modal.className = 'ada-auth-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'ada-auth-title');
    modal.innerHTML = [
      '<div class="ada-auth-box">',
        '<button class="ada-auth-close" id="ada-auth-close" aria-label="Close">&times;</button>',
        '<h2 class="ada-auth-title" id="ada-auth-title">Sign in</h2>',
        '<p  class="ada-auth-error" id="ada-auth-error" hidden></p>',
        '<form id="ada-auth-form" novalidate>',
          '<label for="ada-email">Email</label>',
          '<input id="ada-email" type="email" autocomplete="email" placeholder="you@example.com" required>',
          '<label for="ada-password">Password</label>',
          '<input id="ada-password" type="password" autocomplete="current-password" placeholder="Min 8 characters" required>',
          '<button type="submit" id="ada-auth-submit" class="ada-auth-btn">Sign in</button>',
        '</form>',
        '<p class="ada-auth-switch">',
          'Don\'t have an account? <button class="ada-auth-link" id="ada-auth-toggle">Create one</button>',
        '</p>',
      '</div>',
    ].join('');
    document.body.appendChild(modal);

    var isSignup = false;

    function setMode(signup) {
      isSignup = signup;
      document.getElementById('ada-auth-title').textContent  = signup ? 'Create account' : 'Sign in';
      document.getElementById('ada-auth-submit').textContent  = signup ? 'Create account' : 'Sign in';
      document.getElementById('ada-auth-toggle').textContent  = signup ? 'Sign in instead' : 'Create one';
      document.querySelector('.ada-auth-switch').firstChild.textContent =
        signup ? 'Already have an account? ' : "Don't have an account? ";
      document.getElementById('ada-auth-error').hidden = true;
      document.getElementById('ada-password').setAttribute('autocomplete', signup ? 'new-password' : 'current-password');
    }

    document.getElementById('ada-auth-toggle').addEventListener('click', function () {
      setMode(!isSignup);
    });

    document.getElementById('ada-auth-close').addEventListener('click', hideAuthModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) hideAuthModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideAuthModal();
    });

    document.getElementById('ada-auth-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var errorEl = document.getElementById('ada-auth-error');
      var email   = document.getElementById('ada-email').value.trim();
      var pass    = document.getElementById('ada-password').value;
      var btn     = document.getElementById('ada-auth-submit');

      errorEl.hidden  = true;
      btn.disabled    = true;
      btn.textContent = isSignup ? 'Creating account…' : 'Signing in…';

      try {
        if (isSignup) {
          await signup(email, pass);
        } else {
          await login(email, pass);
        }
        hideAuthModal();
        window.location.reload();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden      = false;
        btn.disabled        = false;
        btn.textContent     = isSignup ? 'Create account' : 'Sign in';
      }
    });
  }

  function showAuthModal(mode) {
    buildModal();
    var modal = document.getElementById('ada-auth-modal');
    modal.hidden = false;
    modal.classList.add('is-open');
    if (mode === 'signup') {
      document.getElementById('ada-auth-toggle').click();
    }
    document.getElementById('ada-email').focus();
  }

  function hideAuthModal() {
    var modal = document.getElementById('ada-auth-modal');
    if (modal) { modal.hidden = true; modal.classList.remove('is-open'); }
  }

  // ── Nav: profile bubble or sign-up button ────────────────────────────────────
  function updateNav() {
    var user    = getUser();
    var siteNav = document.querySelector('.site-nav');
    if (!siteNav) return;

    // Remove any existing auth element
    var existing = document.getElementById('nav-auth-widget');
    if (existing) existing.remove();

    var widget = document.createElement('div');
    widget.id = 'nav-auth-widget';

    if (user) {
      // Profile bubble — shows first letter of email
      var initial = (user.email || '?')[0].toUpperCase();
      widget.className = 'nav-profile-bubble';
      widget.setAttribute('aria-label', 'Account: ' + user.email);
      widget.setAttribute('title', user.email);
      widget.setAttribute('role', 'button');
      widget.setAttribute('tabindex', '0');
      widget.textContent = initial;

      // Clicking bubble shows a small dropdown — built with createElement to prevent XSS
      var menu = document.createElement('div');
      menu.className = 'nav-profile-menu';

      var emailSpan = document.createElement('span');
      emailSpan.className = 'nav-profile-email';
      emailSpan.textContent = user.email; // textContent is XSS-safe

      var editLink = document.createElement('a');
      editLink.href = '/settings';
      editLink.className = 'nav-profile-edit';
      editLink.textContent = 'Edit Profile';

      var signoutBtn = document.createElement('button');
      signoutBtn.className = 'nav-profile-signout';
      signoutBtn.id = 'nav-signout-btn';
      signoutBtn.textContent = 'Sign out';

      menu.appendChild(emailSpan);
      menu.appendChild(editLink);
      menu.appendChild(signoutBtn);
      widget.appendChild(menu);

      widget.addEventListener('click', function (e) {
        widget.classList.toggle('is-open');
        e.stopPropagation();
      });
      widget.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') widget.classList.toggle('is-open');
      });
      document.addEventListener('click', function () {
        widget.classList.remove('is-open');
      });
      menu.addEventListener('click', function (e) { e.stopPropagation(); });
      signoutBtn.addEventListener('click', logout);
    } else {
      // Sign Up button
      widget.className = 'nav-signup-btn';
      widget.setAttribute('role', 'button');
      widget.setAttribute('tabindex', '0');
      widget.textContent = 'Sign Up';

      widget.addEventListener('click', function () { showAuthModal('signup'); });
      widget.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') showAuthModal('signup');
      });
    }

    // Insert inside the hamburger wrapper, after the hamburger button
    var hamburger = document.getElementById('hamburger-wrapper');
    hamburger.appendChild(widget);
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  // Expose to other scripts
  window.adaAuth = { signup, login, logout, startCheckout, showAuthModal, syncPlan, getUser };

  // Sync plan from API — nav is handled by the React Nav component, skip updateNav()
  syncPlan();

  // Wire up any [data-checkout] buttons (e.g. on pricing page)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-checkout]');
    if (btn) {
      e.preventDefault();
      startCheckout(btn.dataset.checkout);
    }
  });

  // Handle ?upgrade=success — re-sync the plan after Stripe redirects back
  if (new URLSearchParams(window.location.search).get('upgrade') === 'success') {
    syncPlan().then(function () {
      // Small notification
      var note = document.createElement('div');
      note.className = 'upgrade-success-toast';
      note.textContent = '🎉 Upgrade successful! Your plan has been activated.';
      document.body.appendChild(note);
      setTimeout(function () { note.remove(); }, 5000);
    });
  }

}());
