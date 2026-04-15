(function () {
  'use strict';

  // ─── Sidebar position → CSS custom property ──────────────────────────────
  // Panels are position:fixed and should start right where the sidebar ends.
  var sidebar = document.querySelector('.settings-sidebar');

  function syncSidebarRight() {
    if (!sidebar) return;
    var r = sidebar.getBoundingClientRect();
    document.documentElement.style.setProperty('--sidebar-right', r.right + 'px');
  }

  syncSidebarRight();
  window.addEventListener('resize', syncSidebarRight);

  // ─── Create and inject backdrop ──────────────────────────────────────────
  var backdrop = document.createElement('div');
  backdrop.className = 'panel-backdrop';
  backdrop.id = 'panel-backdrop';
  document.body.appendChild(backdrop);

  // ─── Element references ───────────────────────────────────────────────────
  var panels   = Array.from(document.querySelectorAll('.settings-panel'));
  var navItems = Array.from(document.querySelectorAll('.settings-nav-item'));

  // ─── Inject close buttons into each panel header ─────────────────────────
  var closeSVG =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="18" y1="6" x2="6" y2="18"></line>' +
    '<line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  panels.forEach(function (panel) {
    var heading = panel.querySelector('.panel-title');
    if (!heading) return;

    var header = document.createElement('div');
    header.className = 'panel-header';
    heading.parentNode.insertBefore(header, heading);
    header.appendChild(heading);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'panel-close-btn';
    closeBtn.setAttribute('aria-label', 'Close panel');
    closeBtn.innerHTML = closeSVG;
    header.appendChild(closeBtn);

    closeBtn.addEventListener('click', function () {
      closePanel(panel.id.replace('panel-', ''));
    });
  });

  // ─── Inject placeholder in the content area ──────────────────────────────
  var contentArea = document.querySelector('.settings-content');
  if (contentArea) {
    var placeholder = document.createElement('div');
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
    syncSidebarRight(); // refresh position before opening
    var panel = document.getElementById('panel-' + panelId);
    if (!panel) return;

    if (activePanel && activePanel !== panel) {
      activePanel.classList.remove('active');
      activePanel.removeAttribute('role');
      activePanel.removeAttribute('aria-modal');
    }

    panel.classList.add('active');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    backdrop.classList.add('visible');
    activePanel = panel;

    navItems.forEach(function (btn) {
      var on = btn.dataset.panel === panelId;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-expanded', String(on));
    });

    // Re-render history when the history panel is opened
    if (panelId === 'history' && typeof renderHistory === 'function') {
      renderHistory();
    }
    // Re-apply plan gates and rate UI when relevant panels open
    if (panelId === 'checker' && typeof updateCheckerRateUI === 'function') {
      updateCheckerRateUI();
    }
    if (panelId === 'api') {
      applyPlanGate('api-gate', 'api-content', 'enterprise');
    }
    if (panelId === 'custom-rules') {
      applyPlanGate('custom-rules-gate', 'custom-rules-content', 'enterprise');
      if (typeof window.renderCustomRules === 'function') window.renderCustomRules();
    }

    // Focus the close button
    var closeBtn = panel.querySelector('.panel-close-btn');
    if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
  }

  function closePanel(returnToPanelId) {
    panels.forEach(function (p) {
      p.classList.remove('active');
      p.removeAttribute('role');
      p.removeAttribute('aria-modal');
    });
    backdrop.classList.remove('visible');
    navItems.forEach(function (btn) {
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
    });

    // Return focus to the triggering nav button
    if (returnToPanelId) {
      var navBtn = document.querySelector('[data-panel="' + returnToPanelId + '"]');
      if (navBtn) navBtn.focus();
    }

    activePanel = null;
  }

  // ─── Nav button clicks ────────────────────────────────────────────────────
  navItems.forEach(function (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var panelId = btn.dataset.panel;
      if (btn.classList.contains('active')) {
        closePanel(panelId);
      } else {
        openPanel(panelId);
      }
    });
  });

  // ─── Backdrop click closes panel ──────────────────────────────────────────
  backdrop.addEventListener('click', function () {
    if (activePanel) {
      closePanel(activePanel.id.replace('panel-', ''));
    }
  });

  // ─── Escape key closes panel ──────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activePanel) {
      closePanel(activePanel.id.replace('panel-', ''));
    }
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

  // ─── Profile ──────────────────────────────────────────────────────────────
  var profileName   = document.getElementById('profile-name');
  var profileEmail  = document.getElementById('profile-email');
  var saveProfileBtn = document.getElementById('save-profile-btn');

  if (profileName)  profileName.value  = localStorage.getItem('ada-profile-name')  || '';
  if (profileEmail) profileEmail.value = localStorage.getItem('ada-profile-email') || '';

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', function () {
      if (profileName)  localStorage.setItem('ada-profile-name',  profileName.value);
      if (profileEmail) localStorage.setItem('ada-profile-email', profileEmail.value);
      saveProfileBtn.textContent = 'Saved!';
      setTimeout(function () { saveProfileBtn.textContent = 'Save Profile'; }, 2000);
    });
  }

  // ─── History ──────────────────────────────────────────────────────────────
  var historyList    = document.getElementById('history-list');
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

    // Update "Your Current Plan" badge
    var badges = { free: 'free-plan-badge', pro: 'pro-plan-badge', enterprise: 'ent-plan-badge' };
    ['free', 'pro', 'enterprise'].forEach(function (p) {
      var badge = document.getElementById(badges[p]);
      if (badge) badge.hidden = p !== plan;
    });

    // Re-apply all plan gates
    applyPlanGate('api-gate', 'api-content', 'enterprise');
    applyPlanGate('custom-rules-gate', 'custom-rules-content', 'enterprise');
    updateCheckerRateUI();
    if (typeof window.renderCustomRules === 'function') window.renderCustomRules();

    var label = plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Enterprise';
    alert('Plan set to ' + label + '. Features are now ' + (plan === 'free' ? 'restricted' : 'unlocked') + '. (Demo only — no real payment processed.)');
  };

  // Show correct "Your Current Plan" badge on load
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
      var sel = (ruleSelector  && ruleSelector.value.trim())  || '';
      var msg = (ruleMessage   && ruleMessage.value.trim())   || '';
      var sev = (ruleSeverity  && ruleSeverity.value)         || 'moderate';
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

  // Re-initialize settings when navigating to settings page via router
  window.addEventListener('ada-navigate', function (e) {
    if (e.detail.page !== 'settings') return;
    var newSidebar = document.querySelector('.settings-sidebar');
    if (newSidebar) {
      sidebar = newSidebar;
      syncSidebarRight();
    }
    if (typeof window.renderHistory === 'function') window.renderHistory();
    if (typeof window.renderCustomRules === 'function') window.renderCustomRules();
  });

}());
