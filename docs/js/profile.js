(function () {
  'use strict';

  // ── Auth guard ────────────────────────────────────────────────────────────────
  var token = localStorage.getItem('ada-token');
  if (!token) {
    window.location.replace('index.html');
    throw new Error('unauthenticated');
  }

  var user = (function () {
    try { return JSON.parse(localStorage.getItem('ada-user')); } catch (e) { return null; }
  }());

  // ── Panel references ──────────────────────────────────────────────────────────
  var panels   = Array.from(document.querySelectorAll('.settings-panel'));
  var navItems = Array.from(document.querySelectorAll('.settings-nav-item[data-panel]'));

  // ── Inject the "select a section" placeholder ─────────────────────────────────
  var contentArea = document.querySelector('.settings-content');
  var placeholder;
  if (contentArea) {
    placeholder = document.createElement('div');
    placeholder.className = 'settings-placeholder';
    placeholder.id = 'profile-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.innerHTML =
      '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
      '<circle cx="12" cy="7" r="4"></circle></svg>' +
      '<p>Select a section from the left</p>';
    contentArea.insertBefore(placeholder, contentArea.firstChild);
  }

  // ── Open / close panel ────────────────────────────────────────────────────────
  var activePanel = null;

  function openPanel(panelId) {
    var panel = document.getElementById('panel-' + panelId);
    if (!panel) return;

    // Hide all panels, show the target
    panels.forEach(function (p) { p.classList.remove('active'); });
    panel.classList.add('active');
    activePanel = panel;

    // Hide placeholder
    if (placeholder) placeholder.style.display = 'none';

    // Update nav active state
    navItems.forEach(function (btn) {
      var on = btn.dataset.panel === panelId;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', String(on));
    });

    // Lazy-init panel content
    if (panelId === 'payment-history') loadInvoices();
    if (panelId === 'account')         initAccount();
    if (panelId === 'security')        initSecurity();

    sessionStorage.setItem('profile-panel', panelId);
  }

  function closePanel() {
    panels.forEach(function (p) { p.classList.remove('active'); });
    activePanel = null;

    // Show placeholder again
    if (placeholder) placeholder.style.display = '';

    navItems.forEach(function (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });

    sessionStorage.removeItem('profile-panel');
  }

  // ── Nav button clicks (toggle) ────────────────────────────────────────────────
  navItems.forEach(function (btn) {
    btn.setAttribute('aria-selected', 'false');
    btn.addEventListener('click', function () {
      var panelId = btn.dataset.panel;
      if (btn.classList.contains('active')) {
        closePanel();
      } else {
        openPanel(panelId);
      }
    });
  });

  // Re-open the last-used panel (e.g. coming from settings quick-links)
  var savedPanel = sessionStorage.getItem('profile-panel');
  if (savedPanel) openPanel(savedPanel);

  // ── Account panel ─────────────────────────────────────────────────────────────
  var accountInited = false;
  function initAccount() {
    if (accountInited) return;
    accountInited = true;

    var avatarEl     = document.getElementById('profile-avatar-initials');
    var identityName = document.getElementById('profile-identity-name');
    var emailEl      = document.getElementById('profile-email-display');
    var sinceEl      = document.getElementById('profile-member-since');
    var planBadge    = document.getElementById('profile-plan-badge');
    var planName     = document.getElementById('profile-plan-name');
    var planDesc     = document.getElementById('profile-plan-desc');
    var upgradeLink  = document.getElementById('profile-upgrade-link');
    var nameInput    = document.getElementById('profile-display-name');
    var saveBtn      = document.getElementById('save-name-btn');
    var saveMsg      = document.getElementById('save-name-msg');

    var plan        = localStorage.getItem('ada-plan') || 'free';
    var displayName = localStorage.getItem('ada-profile-name') || '';

    var planMeta = {
      free:       { label: 'Free Plan',      desc: '10 checks every 4 hours · Basic accessibility checks' },
      pro:        { label: 'Pro Plan',        desc: 'Unlimited checks · URL checking · PDF reports' },
      enterprise: { label: 'Enterprise Plan', desc: 'Everything in Pro · API access · Custom rules · Team collaboration' },
    };
    var meta = planMeta[plan] || planMeta.free;

    if (user) {
      var initial = (user.email || '?')[0].toUpperCase();
      if (avatarEl)     avatarEl.textContent     = initial;
      if (emailEl)      emailEl.textContent      = user.email || '';
      if (identityName) identityName.textContent = displayName || 'No display name set';
      if (sinceEl && user.created_at) {
        var d = new Date(user.created_at);
        sinceEl.textContent = 'Member since ' + d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      }
    }

    if (planBadge) planBadge.textContent = meta.label;
    if (planName)  planName.textContent  = meta.label;
    if (planDesc)  planDesc.textContent  = meta.desc;
    if (upgradeLink) upgradeLink.style.display = plan === 'enterprise' ? 'none' : '';
    if (nameInput)   nameInput.value = displayName;

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var name = nameInput ? nameInput.value.trim() : '';
        localStorage.setItem('ada-profile-name', name);
        if (identityName) identityName.textContent = name || 'No display name set';
        if (saveMsg) { saveMsg.style.display = ''; saveMsg.textContent = 'Name saved.'; }
        setTimeout(function () { if (saveMsg) saveMsg.style.display = 'none'; }, 3000);
      });
    }
  }

  // ── Payment History panel ─────────────────────────────────────────────────────
  var invoicesLoaded = false;

  var SAMPLE_INVOICES = [
    { date: 1743465600, amount: 1900, currency: 'usd', status: 'paid', description: 'Pro Plan — Monthly', pdf: null },
    { date: 1740873600, amount: 1900, currency: 'usd', status: 'paid', description: 'Pro Plan — Monthly', pdf: null },
    { date: 1738195200, amount: 1900, currency: 'usd', status: 'paid', description: 'Pro Plan — Monthly', pdf: null },
  ];

  function renderInvoices(list, isSample) {
    var listEl   = document.getElementById('invoices-list');
    var headerEl = document.getElementById('invoices-header');
    var loadEl   = document.getElementById('invoices-loading');
    var emptyEl  = document.getElementById('invoices-empty');
    var bannerEl = document.getElementById('invoices-demo-banner');

    if (loadEl)  loadEl.style.display  = 'none';
    if (emptyEl) emptyEl.style.display = 'none';
    if (!listEl) return;

    if (!list || list.length === 0) {
      if (emptyEl) emptyEl.style.display = '';
      return;
    }

    if (headerEl) headerEl.style.display = '';
    if (bannerEl) bannerEl.style.display = isSample ? '' : 'none';

    listEl.innerHTML = '';
    list.forEach(function (inv) {
      var date   = new Date(inv.date * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      var amount = (inv.amount / 100).toLocaleString('en-US', { style: 'currency', currency: (inv.currency || 'usd').toUpperCase() });
      var statusLabel = inv.status.charAt(0).toUpperCase() + inv.status.slice(1);
      var desc   = inv.description || 'Subscription';

      var row = document.createElement('div');
      row.className = 'invoice-row';
      row.innerHTML =
        '<span class="invoice-date">'   + date        + '</span>' +
        '<span class="invoice-desc">'   + desc        + '</span>' +
        '<span class="invoice-amount">' + amount      + '</span>' +
        '<span class="invoice-status invoice-status--' + inv.status + '">' + statusLabel + '</span>' +
        (inv.pdf
          ? '<a class="invoice-pdf-link" href="' + inv.pdf + '" target="_blank" rel="noopener noreferrer">Receipt ↗</a>'
          : '<span class="invoice-no-pdf">—</span>');
      listEl.appendChild(row);
    });
  }

  function loadInvoices() {
    if (invoicesLoaded) return;
    invoicesLoaded = true;

    fetch('/api/billing/invoices', {
      headers: { 'Authorization': 'Bearer ' + token },
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.invoices && data.invoices.length > 0) {
          renderInvoices(data.invoices, false);
        } else {
          renderInvoices(SAMPLE_INVOICES, true);
        }
      })
      .catch(function () {
        renderInvoices(SAMPLE_INVOICES, true);
      });
  }

  // ── Security panel ────────────────────────────────────────────────────────────
  var securityInited = false;
  function initSecurity() {
    if (securityInited) return;
    securityInited = true;

    // Active session info
    var deviceEl = document.getElementById('session-device');
    var metaEl   = document.getElementById('session-meta');

    if (deviceEl) {
      var ua = navigator.userAgent;
      var browser = 'Unknown browser';
      if      (ua.indexOf('Edg')     > -1)                              browser = 'Microsoft Edge';
      else if (ua.indexOf('OPR')     > -1)                              browser = 'Opera';
      else if (ua.indexOf('Chrome')  > -1)                              browser = 'Chrome';
      else if (ua.indexOf('Firefox') > -1)                              browser = 'Firefox';
      else if (ua.indexOf('Safari')  > -1 && ua.indexOf('Chrome') < 0) browser = 'Safari';

      var os = 'Unknown OS';
      if      (ua.indexOf('Windows') > -1)                              os = 'Windows';
      else if (ua.indexOf('Mac')     > -1)                              os = 'macOS';
      else if (ua.indexOf('Android') > -1)                              os = 'Android';
      else if (ua.indexOf('iPhone')  > -1 || ua.indexOf('iPad') > -1)  os = 'iOS';
      else if (ua.indexOf('Linux')   > -1)                              os = 'Linux';

      deviceEl.textContent = browser + ' on ' + os;
    }

    if (metaEl) {
      var now = new Date();
      metaEl.textContent = 'Signed in · ' + now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    // Password strength meter
    var newPassEl   = document.getElementById('new-password');
    var strengthBar = document.getElementById('password-strength-fill');
    var strengthLbl = document.getElementById('password-strength-label');

    function scorePassword(pw) {
      var score = 0;
      if (pw.length >= 8)           score++;
      if (pw.length >= 12)          score++;
      if (/[A-Z]/.test(pw))         score++;
      if (/[0-9]/.test(pw))         score++;
      if (/[^A-Za-z0-9]/.test(pw))  score++;
      return score;
    }

    if (newPassEl && strengthBar && strengthLbl) {
      newPassEl.addEventListener('input', function () {
        var pw = newPassEl.value;
        if (!pw) {
          strengthBar.style.width = '0';
          strengthBar.className   = 'password-strength-fill';
          strengthLbl.textContent = '';
          strengthLbl.className   = 'password-strength-label';
          return;
        }
        var score = scorePassword(pw);
        var pct = (score / 5) * 100;
        var cls = score <= 1 ? 'weak' : score <= 3 ? 'fair' : 'strong';
        var lbl = score <= 1 ? 'Weak' : score <= 3 ? 'Fair' : 'Strong';
        strengthBar.style.width = pct + '%';
        strengthBar.className   = 'password-strength-fill strength-' + cls;
        strengthLbl.textContent = lbl;
        strengthLbl.className   = 'password-strength-label strength-' + cls;
      });
    }

    // Change password form
    var form = document.getElementById('change-password-form');
    var msg  = document.getElementById('change-password-msg');

    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var currentEl = document.getElementById('current-password');
        var newEl     = document.getElementById('new-password');
        var confirmEl = document.getElementById('confirm-password');
        var submitBtn = document.getElementById('change-password-btn');

        if (msg) { msg.style.display = 'none'; msg.className = 'form-msg'; }

        if (newEl.value !== confirmEl.value) {
          if (msg) { msg.textContent = 'New passwords do not match.'; msg.className = 'form-msg form-msg--error'; msg.style.display = ''; }
          return;
        }

        submitBtn.disabled = true; submitBtn.textContent = 'Updating…';

        try {
          var res  = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ currentPassword: currentEl.value, newPassword: newEl.value }),
          });
          var data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Update failed');
          if (msg) { msg.textContent = 'Password updated successfully.'; msg.className = 'form-msg form-msg--success'; msg.style.display = ''; }
          form.reset();
          if (strengthBar) { strengthBar.style.width = '0'; strengthBar.className = 'password-strength-fill'; }
          if (strengthLbl) { strengthLbl.textContent = ''; strengthLbl.className = 'password-strength-label'; }
        } catch (err) {
          if (msg) { msg.textContent = err.message; msg.className = 'form-msg form-msg--error'; msg.style.display = ''; }
        } finally {
          submitBtn.disabled = false; submitBtn.textContent = 'Update Password';
        }
      });
    }

    // Delete account
    var deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        if (!window.confirm('Are you sure you want to delete your account?\n\nThis will permanently erase your account, subscription, and all data. This cannot be undone.')) return;
        deleteBtn.disabled = true; deleteBtn.textContent = 'Deleting…';
        fetch('/api/auth/delete-account', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token },
        })
          .then(function (res) {
            if (!res.ok) return res.json().then(function (d) { throw new Error(d.error || 'Delete failed'); });
            localStorage.clear(); sessionStorage.clear();
            window.location.replace('index.html');
          })
          .catch(function (err) {
            alert('Could not delete account: ' + err.message);
            deleteBtn.disabled = false; deleteBtn.textContent = 'Delete Account';
          });
      });
    }
  }

}());
