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
    if (!getUser()) return;

    const forceRefresh  = new URLSearchParams(window.location.search).get('upgrade') === 'success';
    const currentPlan   = localStorage.getItem(PLAN_KEY) || 'free';
    const lastSynced    = parseInt(localStorage.getItem(PLAN_CACHE_KEY) || '0', 10);
    const age           = Date.now() - lastSynced;

    // Always re-fetch if current plan is free (may have just paid) or cache expired
    const cacheValid = age < PLAN_CACHE_TTL && currentPlan !== 'free';
    if (!forceRefresh && cacheValid) return;

    try {
      const res  = await fetch(API + '/auth/me', { credentials: 'include' });
      if (res.status === 401) { logout(); return; }
      const data = await res.json();
      if (data.plan) {
        const oldPlan = localStorage.getItem(PLAN_KEY);
        localStorage.setItem(PLAN_KEY, data.plan);
        localStorage.setItem(PLAN_CACHE_KEY, String(Date.now()));
        if (data.user) setUser(data.user);

        // Always notify other scripts — even if plan didn't change.
        // app.js may have missed the event if it loaded after syncPlan completed,
        // so the event fires on every sync so all listeners can re-evaluate.
        window.dispatchEvent(new CustomEvent('ada:plan-updated', { detail: { plan: data.plan } }));
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
      // Show accessible error via live region instead of alert()
      var errEl = document.getElementById('ada-checkout-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'ada-checkout-error';
        errEl.setAttribute('role', 'alert');
        errEl.setAttribute('aria-live', 'assertive');
        errEl.style.cssText = 'position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#dc2626;color:#fff;padding:0.75rem 1.25rem;border-radius:8px;font-size:0.9375rem;z-index:9999;max-width:90vw;text-align:center;';
        document.body.appendChild(errEl);
      }
      errEl.textContent = e.message;
      errEl.hidden = false;
      clearTimeout(errEl._t);
      errEl._t = setTimeout(function () { errEl.hidden = true; }, 6000);
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
      widget.setAttribute('role', 'button');
      widget.setAttribute('tabindex', '0');
      widget.setAttribute('aria-haspopup', 'true');
      widget.setAttribute('aria-expanded', 'false');
      widget.textContent = initial;

      // Clicking bubble shows a small dropdown — built with createElement to prevent XSS
      var menu = document.createElement('div');
      menu.className = 'nav-profile-menu';
      menu.setAttribute('role', 'menu');

      var emailSpan = document.createElement('span');
      emailSpan.className = 'nav-profile-email';
      emailSpan.textContent = user.email; // textContent is XSS-safe

      var editLink = document.createElement('a');
      editLink.href = '/settings';
      editLink.className = 'nav-profile-edit';
      editLink.setAttribute('role', 'menuitem');
      editLink.textContent = 'Edit Profile';

      var signoutBtn = document.createElement('button');
      signoutBtn.className = 'nav-profile-signout';
      signoutBtn.id = 'nav-signout-btn';
      signoutBtn.setAttribute('role', 'menuitem');
      signoutBtn.textContent = 'Sign out';

      menu.appendChild(emailSpan);
      menu.appendChild(editLink);
      menu.appendChild(signoutBtn);
      widget.appendChild(menu);

      function toggleMenu(open) {
        widget.classList.toggle('is-open', open);
        widget.setAttribute('aria-expanded', String(open));
      }

      widget.addEventListener('click', function (e) {
        var next = !widget.classList.contains('is-open');
        toggleMenu(next);
        e.stopPropagation();
      });
      widget.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(!widget.classList.contains('is-open')); }
        if (e.key === 'Escape') toggleMenu(false);
      });
      document.addEventListener('click', function () { toggleMenu(false); });
      menu.addEventListener('click', function (e) { e.stopPropagation(); });
      signoutBtn.addEventListener('click', logout);
    } else {
      // Sign Up button — real <button> element for proper semantics
      var btn = document.createElement('button');
      btn.className = 'nav-signup-btn';
      btn.type = 'button';
      btn.textContent = 'Sign Up';
      btn.addEventListener('click', function () { showAuthModal('signup'); });
      widget.appendChild(btn);
      // widget itself is just a wrapper — no role needed
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

  // Handle ?upgrade=success — ask Stripe directly what plan the user is on.
  // This bypasses the webhook entirely so it works even if webhooks aren't wired up.
  if (new URLSearchParams(window.location.search).get('upgrade') === 'success') {
    var upgradeAttempts = 0;
    var maxAttempts = 8;

    function pollUntilUpgraded() {
      upgradeAttempts++;

      // Call sync-plan: hits Stripe directly and updates Supabase in one shot
      fetch(API + '/stripe/sync-plan', { method: 'POST', credentials: 'include' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          var resolvedPlan = (data && data.plan) ? data.plan : 'free';

          if (resolvedPlan !== 'free') {
            // Write confirmed plan to localStorage
            localStorage.setItem(PLAN_KEY, resolvedPlan);
            localStorage.removeItem(PLAN_CACHE_KEY);

            var note = document.createElement('div');
            note.className = 'upgrade-success-toast';
            note.setAttribute('role', 'status');
            note.textContent = 'Upgrade successful! Your plan has been activated.';
            document.body.appendChild(note);

            // Reload clean (no query string) so all plan gates re-evaluate
            setTimeout(function () {
              window.location.href = window.location.pathname;
            }, 1500);
          } else if (upgradeAttempts < maxAttempts) {
            // Stripe may not have finalised yet — retry in 2 s
            setTimeout(pollUntilUpgraded, 2000);
          } else {
            var note = document.createElement('div');
            note.className = 'upgrade-success-toast';
            note.setAttribute('role', 'alert');
            note.style.background = '#b45309';
            note.textContent = 'Payment received! Refresh in a moment if features are not yet unlocked.';
            document.body.appendChild(note);
            setTimeout(function () { note.remove(); }, 8000);
          }
        })
        .catch(function () {
          if (upgradeAttempts < maxAttempts) setTimeout(pollUntilUpgraded, 2000);
        });
    }

    pollUntilUpgraded();
  }

}());
