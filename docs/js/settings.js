(function () {
  'use strict';

  // ─── Element references ───────────────────────────────────────────────────
  var panels   = Array.from(document.querySelectorAll('.settings-panel'));
  var navItems = Array.from(document.querySelectorAll('.settings-nav-item'));

  // ─── Inject placeholder in the content area ──────────────────────────────
  var contentArea = document.querySelector('.settings-content');
  var placeholder;
  if (contentArea) {
    placeholder = document.createElement('div');
    placeholder.className = 'settings-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.innerHTML =
      '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="3"></circle>' +
      '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' +
      '</svg>' +
      '<p>Select a section from the left</p>';
    contentArea.insertBefore(placeholder, contentArea.firstChild);
  }

  // ─── Open / close panel ───────────────────────────────────────────────────
  var activePanel = null;

  function openPanel(panelId) {
    var panel = document.getElementById('panel-' + panelId);
    if (!panel) return;

    panels.forEach(function (p) { p.classList.remove('active'); });
    panel.classList.add('active');
    activePanel = panel;

    if (placeholder) placeholder.style.display = 'none';

    navItems.forEach(function (btn) {
      var on = btn.dataset.panel === panelId;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', String(on));
    });

    // Panel-specific side effects
    if (panelId === 'profile')          initProfilePanel();
    if (panelId === 'history')          renderHistory();
    if (panelId === 'checker')          updateCheckerRateUI();
    if (panelId === 'api')              applyPlanGate('api-gate', 'api-content', 'enterprise');
    if (panelId === 'custom-rules') {
      applyPlanGate('custom-rules-gate', 'custom-rules-content', 'enterprise');
      if (typeof window.renderCustomRules === 'function') window.renderCustomRules();
    }
  }

  function closePanel() {
    panels.forEach(function (p) { p.classList.remove('active'); });
    activePanel = null;
    if (placeholder) placeholder.style.display = '';
    navItems.forEach(function (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
  }

  // ─── Nav button clicks ────────────────────────────────────────────────────
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

  // ─── Text size ────────────────────────────────────────────────────────────
  var sizeButtons = Array.from(document.querySelectorAll('.font-size-option'));
  var savedSize   = localStorage.getItem('ada-font-size') || 'medium';

  function applyFontSize(size) {
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('ada-font-size', size);
    sizeButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.size === size));
    });
  }

  sizeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFontSize(btn.dataset.size); });
  });
  applyFontSize(savedSize);

  // ─── Font type ────────────────────────────────────────────────────────────
  var fontButtons = Array.from(document.querySelectorAll('.font-type-option'));
  var savedFont   = localStorage.getItem('ada-font') || 'system';

  function applyFont(font) {
    document.documentElement.setAttribute('data-font', font);
    localStorage.setItem('ada-font', font);
    fontButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.font === font));
    });
  }

  fontButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFont(btn.dataset.font); });
  });
  applyFont(savedFont);

  // ─── Reset text settings ─────────────────────────────────────────────────
  var resetBtn = document.getElementById('reset-text-settings');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      applyFontSize('medium');
      applyFont('system');
    });
  }

  // ─── Profile panel — inner sub-nav ───────────────────────────────────────
  var profileInited = false;
  function initProfilePanel() {
    if (profileInited) return;
    profileInited = true;

    var subPanels    = Array.from(document.querySelectorAll('.profile-sub-panel'));
    var subNavItems  = Array.from(document.querySelectorAll('.profile-sub-nav-item'));
    var subPlaceholder = document.getElementById('profile-sub-placeholder');

    function openSubPanel(id) {
      subPanels.forEach(function (p) { p.classList.remove('active'); });
      var p = document.getElementById('sub-panel-' + id);
      if (p) p.classList.add('active');
      if (subPlaceholder) subPlaceholder.style.display = 'none';
      subNavItems.forEach(function (b) {
        b.classList.toggle('active', b.dataset.subPanel === id);
      });
      if (id === 'account')          initAccount();
      if (id === 'payment-history')  loadInvoices();
      if (id === 'security')         initSecurity();
    }

    function closeSubPanel() {
      subPanels.forEach(function (p) { p.classList.remove('active'); });
      if (subPlaceholder) subPlaceholder.style.display = '';
      subNavItems.forEach(function (b) { b.classList.remove('active'); });
    }

    subNavItems.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.subPanel;
        if (btn.classList.contains('active')) {
          closeSubPanel();
        } else {
          openSubPanel(id);
        }
      });
    });
  }

  // ─── Account panel ────────────────────────────────────────────────────────
  var accountInited = false;
  function initAccount() {
    if (accountInited) return;
    accountInited = true;

    var user = (function () {
      try { return JSON.parse(localStorage.getItem('ada-user')); } catch (e) { return null; }
    }());

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

  // ─── Payment History panel ────────────────────────────────────────────────
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

    var token = localStorage.getItem('ada-token');
    if (!token) { renderInvoices(SAMPLE_INVOICES, true); return; }

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

  // ─── Security panel ───────────────────────────────────────────────────────
  var securityInited = false;
  function initSecurity() {
    if (securityInited) return;
    securityInited = true;

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
      if      (ua.indexOf('Windows') > -1)                             os = 'Windows';
      else if (ua.indexOf('Mac')     > -1)                             os = 'macOS';
      else if (ua.indexOf('Android') > -1)                             os = 'Android';
      else if (ua.indexOf('iPhone')  > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
      else if (ua.indexOf('Linux')   > -1)                             os = 'Linux';

      deviceEl.textContent = browser + ' on ' + os;
    }

    if (metaEl) {
      var now = new Date();
      metaEl.textContent = 'Signed in · ' + now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

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

    var form = document.getElementById('change-password-form');
    var msg  = document.getElementById('change-password-msg');

    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var token     = localStorage.getItem('ada-token');
        var currentEl = document.getElementById('current-password');
        var newEl     = document.getElementById('new-password');
        var confirmEl = document.getElementById('confirm-password');
        var submitBtn = document.getElementById('change-password-btn');

        if (msg) { msg.style.display = 'none'; msg.className = 'form-msg'; }

        if (newEl.value !== confirmEl.value) {
          if (msg) { msg.textContent = 'New passwords do not match.'; msg.className = 'form-msg form-msg--error'; msg.style.display = ''; }
          return;
        }

        if (!token) {
          if (msg) { msg.textContent = 'You must be signed in to change your password.'; msg.className = 'form-msg form-msg--error'; msg.style.display = ''; }
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

    var deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        if (!window.confirm('Are you sure you want to delete your account?\n\nThis will permanently erase your account, subscription, and all data. This cannot be undone.')) return;
        var token = localStorage.getItem('ada-token');
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

  // ─── History ──────────────────────────────────────────────────────────────
  var historyList     = document.getElementById('history-list');
  var clearHistoryBtn = document.getElementById('clear-history-btn');

  function escHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderHistory() {
    if (!historyList) return;
    var history = JSON.parse(localStorage.getItem('ada-history') || '[]');
    if (history.length === 0) {
      historyList.innerHTML =
        '<p class="history-empty">No checks recorded yet. Run an accessibility check to see your history here.</p>';
      return;
    }
    var html = '';
    history.slice().reverse().forEach(function (entry) {
      var count = entry.violations;
      var detailsHtml = '';
      if (entry.details && entry.details.length > 0) {
        detailsHtml = '<ul class="history-violation-list">';
        entry.details.forEach(function (v) {
          var extra = '';
          if (v.element) {
            extra += '<div class="history-violation-element"><code>' + escHTML(v.element) + '</code></div>';
          }
          if (v.remediation) {
            extra += '<div class="history-violation-remediation"><strong>How to fix:</strong> ' + escHTML(v.remediation) + '</div>';
          }
          if (v.wcag) {
            extra += '<div class="history-violation-wcag"><strong>WCAG:</strong> ' + escHTML(v.wcag) + '</div>';
          }
          detailsHtml +=
            '<li class="history-violation-item severity-' + escHTML(v.severity) + '">' +
              '<span class="history-violation-badge">' + escHTML(v.severity) + '</span>' +
              '<div class="history-violation-body">' +
                '<span class="history-violation-msg">' + escHTML(v.message) + '</span>' +
                extra +
              '</div>' +
            '</li>';
        });
        detailsHtml += '</ul>';
      } else {
        detailsHtml = '<p class="history-meta" style="padding:0.5rem 0">No violations recorded.</p>';
      }
      html +=
        '<details class="history-entry">' +
          '<summary class="history-summary">' +
            '<div class="history-summary-left">' +
              '<div class="history-score">' + escHTML(String(entry.score)) + '/100</div>' +
              '<div class="history-meta">' + escHTML(String(count)) +
                ' violation' + (count !== 1 ? 's' : '') + '</div>' +
            '</div>' +
            '<div class="history-summary-right">' +
              '<div class="history-meta">' + escHTML(entry.date) + '</div>' +
              '<svg class="history-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
            '</div>' +
          '</summary>' +
          '<div class="history-details-body">' + detailsHtml + '</div>' +
        '</details>';
    });
    historyList.innerHTML = html;
  }

  window.renderHistory = renderHistory;
  renderHistory();
  window.addEventListener('ada-check-history-updated', renderHistory);
  window.addEventListener('storage', function (e) {
    if (e.key === 'ada-history') renderHistory();
  });

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', function () {
      localStorage.removeItem('ada-history');
      renderHistory();
    });
  }

  // ─── Plan selection (sets ada-plan in localStorage) ──────────────────────
  window.selectPlan = function (plan) {
    localStorage.setItem('ada-plan', plan);

    var badges = { free: 'free-plan-badge', pro: 'pro-plan-badge', enterprise: 'ent-plan-badge' };
    ['free', 'pro', 'enterprise'].forEach(function (p) {
      var badge = document.getElementById(badges[p]);
      if (badge) badge.hidden = p !== plan;
    });

    applyPlanGate('api-gate', 'api-content', 'enterprise');
    applyPlanGate('custom-rules-gate', 'custom-rules-content', 'enterprise');
    updateCheckerRateUI();
    if (typeof window.renderCustomRules === 'function') window.renderCustomRules();

    var label = plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Enterprise';
    alert('Plan set to ' + label + '. Features are now ' + (plan === 'free' ? 'restricted' : 'unlocked') + '. (Demo only — no real payment processed.)');
  };

  (function () {
    var plan = typeof getUserPlan === 'function' ? getUserPlan() : 'free';
    var badges = { free: 'free-plan-badge', pro: 'pro-plan-badge', enterprise: 'ent-plan-badge' };
    ['free', 'pro', 'enterprise'].forEach(function (p) {
      var badge = document.getElementById(badges[p]);
      if (badge) badge.hidden = p !== plan;
    });
  }());

  // ─── Checker panel rate-limit overlay ────────────────────────────────────
  function updateCheckerRateUI() {
    var overlay = document.getElementById('settings-rate-overlay');
    var timerEl = document.getElementById('rate-overlay-timer');
    if (!overlay) return;

    var limited = typeof canRunCheck === 'function' && !canRunCheck();
    overlay.style.display = limited ? 'flex' : 'none';
    if (limited && timerEl && typeof formatResetTime === 'function') {
      timerEl.textContent = formatResetTime();
    }
  }

  window.updateCheckerRateUI = updateCheckerRateUI;
  updateCheckerRateUI();
  setInterval(updateCheckerRateUI, 60000);

  // ─── Enterprise plan gate helper ──────────────────────────────────────────
  function applyPlanGate(gateId, contentId, requiredTier) {
    var gate    = document.getElementById(gateId);
    var content = document.getElementById(contentId);
    if (!gate || !content) return;
    var allowed = typeof planAtLeast === 'function' ? planAtLeast(requiredTier) : false;
    gate.hidden    = allowed;
    content.hidden = !allowed;
  }

  // ─── API Access panel ─────────────────────────────────────────────────────
  applyPlanGate('api-gate', 'api-content', 'enterprise');

  function getOrCreateApiKey() {
    var key = localStorage.getItem('ada-api-key');
    if (!key) {
      var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      key = 'ada_ent_';
      for (var i = 0; i < 32; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
      }
      localStorage.setItem('ada-api-key', key);
    }
    return key;
  }

  var apiKeyDisplay = document.getElementById('api-key-display');
  var apiKeyCopyBtn = document.getElementById('api-key-copy-btn');

  if (apiKeyDisplay) {
    apiKeyDisplay.value = getOrCreateApiKey();
  }

  if (apiKeyCopyBtn) {
    apiKeyCopyBtn.addEventListener('click', function () {
      var key = getOrCreateApiKey();
      navigator.clipboard.writeText(key).then(function () {
        apiKeyCopyBtn.textContent = 'Copied!';
        setTimeout(function () { apiKeyCopyBtn.textContent = 'Copy'; }, 2000);
      }).catch(function () {
        if (apiKeyDisplay) {
          apiKeyDisplay.select();
          document.execCommand('copy');
          apiKeyCopyBtn.textContent = 'Copied!';
          setTimeout(function () { apiKeyCopyBtn.textContent = 'Copy'; }, 2000);
        }
      });
    });
  }

  // ─── Custom Rules panel ───────────────────────────────────────────────────
  applyPlanGate('custom-rules-gate', 'custom-rules-content', 'enterprise');

  var addRuleBtn       = document.getElementById('add-rule-btn');
  var ruleSelector     = document.getElementById('rule-selector');
  var ruleMessage      = document.getElementById('rule-message');
  var ruleSeverity     = document.getElementById('rule-severity');
  var ruleRemediation  = document.getElementById('rule-remediation');
  var customRulesList  = document.getElementById('custom-rules-list');
  var customRulesEmpty = document.getElementById('custom-rules-empty');

  function renderCustomRules() {
    if (!customRulesList) return;
    var rules = typeof getCustomRules === 'function' ? getCustomRules() : [];
    customRulesList.innerHTML = '';
    if (rules.length === 0) {
      if (customRulesEmpty) customRulesEmpty.hidden = false;
      return;
    }
    if (customRulesEmpty) customRulesEmpty.hidden = true;
    rules.forEach(function (rule, i) {
      var li = document.createElement('li');
      li.className = 'custom-rule-item';
      li.innerHTML =
        '<div class="custom-rule-info">' +
          '<span class="custom-rule-selector"><code>' + escHTML(rule.selector) + '</code></span>' +
          '<span class="custom-rule-msg">' + escHTML(rule.message) + '</span>' +
          '<span class="history-violation-badge sev-badge-' + escHTML(rule.severity) + '">' + escHTML(rule.severity) + '</span>' +
        '</div>' +
        '<button type="button" class="custom-rule-delete" data-index="' + i + '" aria-label="Delete rule: ' + escHTML(rule.message) + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4h6v2"></path></svg>' +
        '</button>';

      li.querySelector('.custom-rule-delete').addEventListener('click', function () {
        var rules = typeof getCustomRules === 'function' ? getCustomRules() : [];
        rules.splice(i, 1);
        if (typeof saveCustomRules === 'function') saveCustomRules(rules);
        renderCustomRules();
      });

      customRulesList.appendChild(li);
    });
  }

  window.renderCustomRules = renderCustomRules;
  renderCustomRules();

  if (addRuleBtn) {
    addRuleBtn.addEventListener('click', function () {
      var sel = (ruleSelector    && ruleSelector.value.trim())    || '';
      var msg = (ruleMessage     && ruleMessage.value.trim())     || '';
      var sev = (ruleSeverity    && ruleSeverity.value)           || 'moderate';
      var rem = (ruleRemediation && ruleRemediation.value.trim()) || '';

      if (!sel || !msg) {
        if (!sel && ruleSelector) { ruleSelector.setAttribute('aria-invalid', 'true'); ruleSelector.focus(); }
        else if (!msg && ruleMessage) { ruleMessage.setAttribute('aria-invalid', 'true'); ruleMessage.focus(); }
        return;
      }

      var rules = typeof getCustomRules === 'function' ? getCustomRules() : [];
      rules.push({
        id:          Date.now().toString(16),
        selector:    sel,
        message:     msg,
        severity:    sev,
        remediation: rem
      });
      if (typeof saveCustomRules === 'function') saveCustomRules(rules);

      if (ruleSelector)    { ruleSelector.value = ''; ruleSelector.removeAttribute('aria-invalid'); }
      if (ruleMessage)     { ruleMessage.value  = ''; ruleMessage.removeAttribute('aria-invalid'); }
      if (ruleRemediation) ruleRemediation.value = '';
      if (ruleSeverity)    ruleSeverity.value = 'moderate';

      renderCustomRules();
      addRuleBtn.textContent = 'Rule Added!';
      setTimeout(function () { addRuleBtn.textContent = 'Add Rule'; }, 1500);
    });
  }

  // ─── Re-init when SPA navigates to settings ───────────────────────────────
  window.addEventListener('ada-navigate', function (e) {
    if (e.detail.page !== 'settings') return;
    if (typeof window.renderHistory === 'function') window.renderHistory();
    if (typeof window.renderCustomRules === 'function') window.renderCustomRules();
  });

}());
