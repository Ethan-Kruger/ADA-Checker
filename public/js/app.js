(function () {
  'use strict';

  // ─── Escape user-supplied strings before inserting into innerHTML ────────────
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── Spinner helpers ─────────────────────────────────────────────────────────
  function showSpinner() {
    if (scanSpinner) { scanSpinner.hidden = false; scanSpinner.removeAttribute('aria-hidden'); }
    if (liveRegion) { liveRegion.textContent = 'Checking accessibility, please wait.'; }
  }
  function hideSpinner() {
    if (scanSpinner) { scanSpinner.hidden = true; scanSpinner.setAttribute('aria-hidden', 'true'); }
    // Do NOT clear liveRegion here — displayResults() overwrites it immediately after,
    // and clearing first can cause some AT to miss the result announcement.
  }

  // ─── Element references ──────────────────────────────────────────────────────
  var checkBtn       = document.getElementById('check-btn');
  var scanSpinner    = document.getElementById('scan-spinner');
  var htmlInput      = document.getElementById('html-input');
  var urlInput       = document.getElementById('url-input');
  var wcagSelect     = document.getElementById('main-wcag-level');
  var resultsSection = document.getElementById('results');
  var resultsHeading = document.getElementById('results-heading');
  var scoreGauge     = document.getElementById('score-gauge');
  var scoreNumber    = document.getElementById('score-number');
  var violationList  = document.getElementById('violation-list');
  var noViolations   = document.getElementById('no-violations');
  var liveRegion     = document.getElementById('live-region');
  var usageCounter   = document.getElementById('usage-counter');
  var tabs           = Array.from(document.querySelectorAll('[role="tab"]'));
  var filterBtns     = Array.from(document.querySelectorAll('.filter-btn'));

  // ─── Server-side gate ────────────────────────────────────────────────────────
  // Last server response — used to keep the counter accurate without extra fetches.
  var serverRemaining = null; // number | null (null = pro/enterprise or unknown)
  var serverResetAt   = null; // ISO string

  /**
   * POST /api/check/run — authoritative plan + rate-limit check.
   * Returns true when the check may proceed, false when it should be blocked.
   * Side-effects: updates serverRemaining/serverResetAt, updates usage counter.
   */
  async function requestServerGate() {
    try {
      var res = await fetch('/api/check/run', { method: 'POST', credentials: 'include' });
      if (res.status === 401) {
        if (window.adaAuth && window.adaAuth.showAuthModal) window.adaAuth.showAuthModal('login');
        return false;
      }
      var data = await res.json();
      if (res.status === 402) {
        serverRemaining = 0;
        if (data.resetAt) serverResetAt = data.resetAt;
        updateUsageCounter();
        return false;
      }
      if (!res.ok) return false;
      // 200 — allowed
      serverRemaining = typeof data.remaining === 'number' ? data.remaining : null;
      if (data.resetAt) serverResetAt = data.resetAt;
      updateUsageCounter();
      return true;
    } catch (e) {
      // Network error — fall through to client-side check rather than hard-blocking
      console.warn('Check gate unavailable, using client-side limit:', e);
      return canRunCheck();
    }
  }

  function serverResetMs() {
    if (!serverResetAt) return null;
    return Math.max(0, new Date(serverResetAt).getTime() - Date.now());
  }

  function serverFormatReset() {
    var ms = serverResetMs();
    if (ms === null) return formatResetTime();
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return h + 'h ' + m + 'm';
    return (m + 1) + 'm';
  }

  // ─── Usage counter display ───────────────────────────────────────────────────
  function updateUsageCounter() {
    if (!usageCounter) return;
    if (getUserPlan() !== 'free') { usageCounter.hidden = true; return; }
    // Prefer server data when available, fall back to client-side estimate
    var remaining = serverRemaining !== null ? serverRemaining : getRemainingChecks();
    usageCounter.hidden = false;
    if (remaining <= 0) {
      usageCounter.textContent = 'Limit reached \u2014 resets in ' + serverFormatReset();
      usageCounter.classList.add('limit-reached');
      checkBtn.disabled = true;
      checkBtn.setAttribute('aria-label', 'Check limit reached. Resets in ' + serverFormatReset());
    } else {
      usageCounter.textContent = remaining + '\u202f/\u202f' + FREE_CHECK_LIMIT + ' checks remaining (resets every 4 hours)';
      usageCounter.classList.remove('limit-reached');
      checkBtn.disabled = false;
      checkBtn.removeAttribute('aria-label');
    }
  }

  // Tick the counter every minute so the reset time stays accurate
  setInterval(updateUsageCounter, 60000);
  updateUsageCounter();

  // ─── WCAG level selector ──────────────────────────────────────────────────────
  if (wcagSelect) {
    wcagSelect.addEventListener('change', function () {
      var chosen = wcagSelect.value;
      if (!levelAllowed(chosen)) {
        showUpgradeToast(chosen, wcagSelect);
        wcagSelect.value = 'A';
      }
    });
  }

  function getSelectedLevel() {
    if (!wcagSelect) return 'A';
    var v = wcagSelect.value;
    return levelAllowed(v) ? v : 'A';
  }

  // ─── Track which tab ran the last check ─────────────────────────────────────
  var lastCheckedTabId = null;

  // ─── Tab switching (ARIA tablist pattern) ────────────────────────────────────
  function activateTab(tab) {
    tabs.forEach(function (t) {
      var active = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.setAttribute('tabindex', active ? '0' : '-1');
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
    });
    tab.focus();
    // Hide results when switching to a tab that didn't run the check
    if (resultsSection && lastCheckedTabId && tab.id !== lastCheckedTabId) {
      resultsSection.hidden = true;
    } else if (resultsSection && lastCheckedTabId && tab.id === lastCheckedTabId) {
      resultsSection.hidden = false;
    }
    // Re-evaluate locks whenever the active tab changes so the check button
    // visibility stays in sync (URL tab locked → hide button; batch tab → always hide button)
    applyTabLocks();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { activateTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var idx = tabs.indexOf(tab);
      if (e.key === 'ArrowRight') { e.preventDefault(); activateTab(tabs[(idx + 1) % tabs.length]); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); activateTab(tabs[(idx - 1 + tabs.length) % tabs.length]); }
      if (e.key === 'Home')       { e.preventDefault(); activateTab(tabs[0]); }
      if (e.key === 'End')        { e.preventDefault(); activateTab(tabs[tabs.length - 1]); }
    });
  });

  // ─── URL tab & Batch tab locking ─────────────────────────────────────────────
  function applyTabLocks() {
    var urlTab   = document.getElementById('tab-url');
    var batchTab = document.getElementById('tab-batch');

    var locked = !planAtLeast('pro');

    if (urlTab) {
      urlTab.classList.toggle('tab-locked', locked);
      urlTab.setAttribute('aria-disabled', String(locked));
      var urlSrOnly = urlTab.querySelector('.sr-only');
      if (urlSrOnly) urlSrOnly.hidden = !locked;
    }

    if (batchTab) {
      batchTab.classList.toggle('tab-locked', locked);
      batchTab.setAttribute('aria-disabled', String(locked));
      var batchSrOnly = batchTab.querySelector('.sr-only');
      if (batchSrOnly) batchSrOnly.hidden = !locked;
    }

    var urlBanner    = document.getElementById('url-upgrade-banner');
    var batchBanner  = document.getElementById('batch-upgrade-banner');
    var urlContent   = document.getElementById('url-content');
    var batchContent = document.getElementById('batch-content');

    // Use style.display instead of hidden attribute so CSS (display:flex on
    // .tab-paywall) cannot override the visibility decision.
    if (urlBanner)    urlBanner.style.display    = locked ? '' : 'none';
    if (batchBanner)  batchBanner.style.display  = locked ? '' : 'none';

    // Hide/show the content areas entirely — no graying, just gone
    if (urlContent)   urlContent.style.display   = locked ? 'none' : '';
    if (batchContent) batchContent.style.display = locked ? 'none' : '';

    // Enable/disable the URL input and batch check button based on plan.
    // url-input is disabled in the server HTML by default; remove it for pro+.
    var urlInputEl      = document.getElementById('url-input');
    var batchCheckBtnEl = document.getElementById('batch-check-btn');
    if (urlInputEl)      urlInputEl.disabled      = locked;
    if (batchCheckBtnEl) batchCheckBtnEl.disabled = locked;

    // Update WCAG dropdown option labels to drop "(locked)" for users whose
    // plan actually allows those levels.
    var plan = getUserPlan();
    var wcagSel = document.getElementById('main-wcag-level');
    if (wcagSel) {
      var aaOpt  = wcagSel.querySelector('option[value="AA"]');
      var aaaOpt = wcagSel.querySelector('option[value="AAA"]');
      if (aaOpt)  aaOpt.textContent  = plan === 'pro' || plan === 'enterprise' ? 'AA \u2014 Pro' : 'AA \u2014 Pro (locked)';
      if (aaaOpt) aaaOpt.textContent = plan === 'enterprise' ? 'AAA \u2014 Enterprise' : 'AAA \u2014 Enterprise (locked)';
    }
    var wcagHint = document.getElementById('main-wcag-hint');
    if (wcagHint) {
      if (plan === 'enterprise') {
        wcagHint.textContent = 'All WCAG levels are available on your Enterprise plan.';
      } else if (plan === 'pro') {
        wcagHint.textContent = 'Level AAA requires the Enterprise plan.';
      } else {
        wcagHint.textContent = 'Level AA requires Pro plan. Level AAA requires Enterprise plan.';
      }
    }

    // Hide the main check button when:
    //   - batch tab is active (it has its own button), OR
    //   - URL tab is active and user is locked (no input to submit)
    var activeTabId = (tabs.find(function (t) { return t.getAttribute('aria-selected') === 'true'; }) || {}).id;
    if (checkBtn) {
      checkBtn.hidden = activeTabId === 'tab-batch' || (locked && activeTabId === 'tab-url');
    }
  }
  applyTabLocks();

  // Re-apply locks when auth.js syncs a new plan from the API.
  // auth.js now always dispatches this after every syncPlan fetch.
  window.addEventListener('ada:plan-updated', function () { applyTabLocks(); });

  // Fallback: if the event fired before this listener registered (race condition
  // where syncPlan resolved before app.js finished loading), re-read localStorage
  // directly so the lock state is always correct.
  setTimeout(applyTabLocks, 800);

  function showUrlUpgradeTooltip(tab) {
    var toast = document.getElementById('wcag-upgrade-toast');
    var label = tab.id === 'tab-batch' ? 'Batch checking' : 'URL checking';
    var msg   = label + ' requires the Pro plan. Upgrade in Pricing Plans.';
    if (toast) {
      toast.textContent = msg;
      toast.hidden = false;
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(function () {
        toast.hidden = true;
      }, 4000);
    }
  }

  // ─── Panel checker switchers (URL + Batch panels) ────────────────────────────
  var tabIdMap = { paste: 'tab-paste', url: 'tab-url', batch: 'tab-batch' };

  ['url-checker-switcher', 'batch-checker-switcher'].forEach(function (id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    sel.addEventListener('change', function () {
      var targetTabId = tabIdMap[sel.value];
      var targetTab   = targetTabId && document.getElementById(targetTabId);
      if (targetTab) {
        activateTab(targetTab);
        // Reset this select back to its "current" option so it reads correctly
        // if the user returns to this panel and opens the dropdown again.
        sel.value = sel.querySelector('option[selected]') ? sel.querySelector('option[selected]').value : sel.value;
      }
    });
  });

  // ─── Score counter animation ──────────────────────────────────────────────────
  function animateScore(finalScore) {
    var current   = 0;
    var increment = finalScore / 50;
    var interval  = setInterval(function () {
      current += increment;
      if (current >= finalScore) { current = finalScore; clearInterval(interval); }
      scoreNumber.textContent = Math.round(current);
    }, 20);
  }

  // ─── Score gauge (CSS conic-gradient donut) ──────────────────────────────────
  function updateGauge(score) {
    var color = score >= 80 ? '#16a34a' : score >= 50 ? '#ca8a04' : '#dc2626';
    scoreGauge.style.setProperty('--score', score);
    scoreGauge.style.setProperty('--gauge-color', color);
    animateScore(score);
    scoreGauge.setAttribute('aria-label', 'Accessibility score: ' + score + ' out of 100');
  }

  // ─── Filter buttons ───────────────────────────────────────────────────────────
  var activeFilter = 'all';

  function applyFilter(filter) {
    activeFilter = filter;
    filterBtns.forEach(function (btn) {
      var on = btn.dataset.filter === filter;
      btn.setAttribute('aria-pressed', String(on));
      btn.classList.toggle('active', on);
    });
    violationList.querySelectorAll('.violation-card').forEach(function (card) {
      card.classList.toggle('hidden', filter !== 'all' && card.dataset.severity !== filter);
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFilter(btn.dataset.filter); });
  });

  // ─── Render violation cards ───────────────────────────────────────────────────
  function renderViolations(violations) {
    violationList.innerHTML = '';
    noViolations.hidden = violations.length > 0;

    violations.forEach(function (v) {
      var details = document.createElement('details');
      details.className = 'violation-card severity-' + v.severity;
      details.dataset.severity = v.severity;

      var summary = document.createElement('summary');
      summary.innerHTML =
        '<span class="severity-badge">' + escapeHTML(v.severity) + '</span>' +
        '<span class="violation-message">' + escapeHTML(v.message) + '</span>';
      details.appendChild(summary);

      var body = document.createElement('div');
      body.className = 'violation-body';
      body.innerHTML =
        '<p><strong>Element:</strong><br><code>' + escapeHTML(v.element) + '</code></p>' +
        '<p><strong>How to fix:</strong> ' + escapeHTML(v.remediation) + '</p>' +
        '<p><strong>WCAG:</strong> ' + escapeHTML(v.wcag) + '</p>';
      details.appendChild(body);

      violationList.appendChild(details);
    });

    applyFilter(activeFilter);
  }

  // ─── Save result to history ───────────────────────────────────────────────────
  function saveToHistory(result) {
    var history = JSON.parse(localStorage.getItem('ada-history') || '[]');
    history.push({
      score:      result.score,
      violations: result.summary.total,
      date:       new Date().toLocaleString(),
      details:    result.violations
    });
    if (history.length > 20) history = history.slice(-20);
    localStorage.setItem('ada-history', JSON.stringify(history));
  }

  // ─── Last result (for export) ─────────────────────────────────────────────────
  var _lastResult = null;

  // ─── Display results ──────────────────────────────────────────────────────────
  function displayResults(result) {
    _lastResult = result;

    // Record which tab triggered this check so we can hide results on tab switch
    var activeTab = tabs.find(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    lastCheckedTabId = activeTab ? activeTab.id : null;

    ['critical', 'serious', 'moderate', 'minor'].forEach(function (s) {
      document.getElementById('count-' + s).textContent = result.summary[s];
    });

    updateGauge(result.score);
    renderViolations(result.violations);

    var levelBadge = document.getElementById('results-wcag-level');
    if (levelBadge) {
      levelBadge.textContent = 'WCAG ' + (result.level || 'A');
      levelBadge.hidden = false;
    }

    // Show export section for Pro+ users
    var exportSection = document.getElementById('export-section');
    if (exportSection) exportSection.hidden = false;

    // Announce result summary via the ARIA live region (WCAG 4.1.3 Status Messages).
    // Set content BEFORE moving focus so AT reads the live region update, then the heading.
    if (liveRegion) {
      var s = result.summary;
      var parts = [];
      if (s.critical) parts.push(s.critical + ' critical');
      if (s.serious)  parts.push(s.serious  + ' serious');
      if (s.moderate) parts.push(s.moderate + ' moderate');
      if (s.minor)    parts.push(s.minor    + ' minor');
      var breakdown = parts.length ? ': ' + parts.join(', ') : '';
      liveRegion.textContent =
        'Check complete. Score ' + result.score + ' out of 100. ' +
        'Found ' + s.total + ' violation' + (s.total !== 1 ? 's' : '') + breakdown +
        '. WCAG Level ' + (result.level || 'A') + '.';
    }

    resultsSection.hidden = false;
    resultsHeading.focus();

    saveToHistory(result);
    window.dispatchEvent(new CustomEvent('ada-check-history-updated'));
    updateUsageCounter();
  }

  // ─── Input error helpers ──────────────────────────────────────────────────────
  function showInputError(input, errorEl, msg) {
    input.setAttribute('aria-invalid', 'true');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
    }
    input.focus();
  }

  function clearInputError(input, errorEl) {
    input.removeAttribute('aria-invalid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  }

  function isValidUrl(str) {
    try {
      var u = new URL(str);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  var htmlErrorEl = document.getElementById('html-input-error');
  var urlErrorEl  = document.getElementById('url-input-error');

  // ─── Button click handler ─────────────────────────────────────────────────────
  checkBtn.addEventListener('click', handleCheck);

  async function handleCheck() {
    // Server is authoritative — always gate through the API before running.
    // canRunCheck() is a fast-path UX check only (avoids a fetch when we
    // already know from the last server response that the limit is reached).
    if (serverRemaining === 0) {
      updateUsageCounter();
      return;
    }

    var allowed = await requestServerGate();
    if (!allowed) return;

    var activeTab = tabs.find(function (t) {
      return t.getAttribute('aria-selected') === 'true';
    });
    var isUrlTab = activeTab && activeTab.id === 'tab-url';
    var html = '';

    if (isUrlTab) {
      if (!planAtLeast('pro')) {
        showUrlUpgradeTooltip(activeTab);
        return;
      }

      var url = (urlInput.value || '').trim();

      if (!url) {
        showInputError(urlInput, urlErrorEl,
          'Please enter a URL before checking. Example: https://example.com');
        return;
      }

      if (!isValidUrl(url)) {
        showInputError(urlInput, urlErrorEl,
          'That doesn\u2019t look like a valid URL. Make sure it starts with https:// or http://, ' +
          'for example: https://example.com or http://mysite.org/page');
        return;
      }

      clearInputError(urlInput, urlErrorEl);
      checkBtn.disabled = true;
      checkBtn.textContent = 'Fetching\u2026';
      showSpinner();

      try {
        var response = await fetch(url);
        if (!response.ok) {
          checkBtn.disabled = false;
          checkBtn.textContent = 'Check Accessibility';
          hideSpinner();
          showInputError(urlInput, urlErrorEl,
            'The server returned an error (HTTP\u00a0' + response.status + '\u00a0' + response.statusText + '). ' +
            'The page may not exist or the server is down. Double-check the URL and try again.');
          return;
        }
        html = await response.text();
      } catch (err) {
        checkBtn.disabled = false;
        checkBtn.textContent = 'Check Accessibility';
        hideSpinner();
        // Show CORS/network error inline near the URL input AND in the results area
        showInputError(urlInput, urlErrorEl,
          'Could not reach that URL. This is usually caused by the server blocking cross-origin ' +
          'requests (CORS). To work around this, open the page in your browser, view its source ' +
          '(Ctrl+U / Cmd+U), copy all the HTML, and paste it into the \u201cPaste HTML\u201d tab instead.');
        resultsSection.hidden = false;
        violationList.innerHTML =
          '<p class="fetch-error">' +
          '<strong>Unable to fetch the URL.</strong><br>' +
          'The server is either unreachable or blocking cross-origin (CORS) requests from this tool. ' +
          'To check this page anyway:<br><br>' +
          '1. Open the URL in a new browser tab.<br>' +
          '2. View the page source (Ctrl+U on Windows, Cmd+U on Mac).<br>' +
          '3. Select all (Ctrl+A / Cmd+A), copy (Ctrl+C / Cmd+C).<br>' +
          '4. Paste the HTML into the <strong>Paste HTML</strong> tab and run the check.' +
          '</p>';
        noViolations.hidden = true;
        resultsHeading.focus();
        return;
      }
    } else {
      html = (htmlInput.value || '').trim();
      if (!html) {
        showInputError(htmlInput, htmlErrorEl,
          'The HTML field is empty. Paste the HTML you want to check, ' +
          'for example: <img src="photo.png"> or your full page source.');
        return;
      }
      // 5 MB limit — prevents DOMParser from consuming excessive memory on huge pastes
      if (html.length > 5 * 1024 * 1024) {
        showInputError(htmlInput, htmlErrorEl,
          'HTML is too large (max 5\u00a0MB). Trim the document and try again.');
        return;
      }
      clearInputError(htmlInput, htmlErrorEl);
    }

    checkBtn.disabled = true;
    checkBtn.textContent = 'Checking\u2026';
    checkBtn.setAttribute('aria-busy', 'true');
    showSpinner();

    if (typeof window.checkAccessibilityAsync !== 'function') {
      checkBtn.disabled = false;
      checkBtn.textContent = 'Check Accessibility';
      checkBtn.removeAttribute('aria-busy');
      hideSpinner();
      if (liveRegion) liveRegion.textContent = 'Checker is still loading, please try again in a moment.';
      return;
    }

    // Run checks asynchronously — yields between batches so the page stays
    // responsive while scanning large HTML documents.
    window.checkAccessibilityAsync(html, getSelectedLevel()).then(function (result) {
      // Server already incremented the count; sync client-side counter to match.
      if (serverRemaining !== null) {
        // serverRemaining was already decremented by requestServerGate response
      } else {
        incrementCheckCount(); // fallback: server was unreachable
      }

      checkBtn.disabled = false;
      checkBtn.textContent = 'Check Accessibility';
      checkBtn.removeAttribute('aria-busy');
      hideSpinner();

      displayResults(result);
    });
  }

  // ─── Export report ────────────────────────────────────────────────────────────
  function showToast(msg) {
    var toast = document.getElementById('wcag-upgrade-toast');
    if (toast) {
      toast.textContent = msg;
      toast.hidden = false;
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(function () {
        toast.hidden = true;
      }, 4000);
    }
  }

  function requirePro(action) {
    if (!planAtLeast('pro')) {
      showToast('Exporting reports requires the Pro plan. Upgrade in Settings \u2192 Pricing Plans.');
      return false;
    }
    action();
    return true;
  }

  function buildTxtReport(result) {
    if (!result) return '';
    var lines = [
      'ADA Accessibility Report',
      'Generated: ' + new Date().toLocaleString(),
      'WCAG Level: ' + (result.level || 'A'),
      'Score: ' + result.score + ' / 100',
      'Total violations: ' + result.summary.total,
      '  Critical: ' + result.summary.critical,
      '  Serious:  ' + result.summary.serious,
      '  Moderate: ' + result.summary.moderate,
      '  Minor:    ' + result.summary.minor,
      '',
      '─'.repeat(60),
      ''
    ];
    result.violations.forEach(function (v, i) {
      lines.push((i + 1) + '. [' + v.severity.toUpperCase() + '] ' + v.message);
      lines.push('   Element:    ' + v.element);
      lines.push('   How to fix: ' + v.remediation);
      lines.push('   WCAG:       ' + v.wcag);
      lines.push('');
    });
    return lines.join('\n');
  }

  function buildCsvReport(result) {
    if (!result) return '';
    function csvCell(val) {
      var s = String(val == null ? '' : val);
      if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }
    var lines = [
      'ADA Accessibility Report',
      'Generated,' + csvCell(new Date().toLocaleString()),
      'WCAG Level,' + csvCell(result.level || 'A'),
      'Score,' + csvCell(result.score + ' / 100'),
      'Total Violations,' + csvCell(result.summary.total),
      'Critical,' + csvCell(result.summary.critical),
      'Serious,' + csvCell(result.summary.serious),
      'Moderate,' + csvCell(result.summary.moderate),
      'Minor,' + csvCell(result.summary.minor),
      '',
      'Severity,Issue,Element,How to Fix,WCAG Reference'
    ];
    result.violations.forEach(function (v) {
      lines.push([
        csvCell(v.severity),
        csvCell(v.message),
        csvCell(v.element),
        csvCell(v.remediation),
        csvCell(v.wcag)
      ].join(','));
    });
    return lines.join('\r\n');
  }

  function buildHtmlReport(result) {
    if (!result) return '';
    var rows = result.violations.map(function (v) {
      return '<tr class="sev-' + v.severity + '">' +
        '<td><span class="badge">' + v.severity + '</span></td>' +
        '<td>' + escapeHTML(v.message) + '</td>' +
        '<td><code>' + escapeHTML(v.element) + '</code></td>' +
        '<td>' + escapeHTML(v.remediation) + '</td>' +
        '<td>' + escapeHTML(v.wcag) + '</td>' +
        '</tr>';
    }).join('');

    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
      '<title>ADA Accessibility Report</title>' +
      '<style>body{font-family:system-ui,sans-serif;padding:2rem;background:#0f172a;color:#e2e8f0}' +
      'h1{color:#a5b4fc}table{width:100%;border-collapse:collapse;font-size:.875rem}' +
      'th,td{padding:.5rem .75rem;border:1px solid rgba(255,255,255,.1);text-align:left}' +
      'th{background:rgba(255,255,255,.06)}' +
      '.sev-critical td:first-child{border-left:3px solid #dc2626}' +
      '.sev-serious td:first-child{border-left:3px solid #ea580c}' +
      '.sev-moderate td:first-child{border-left:3px solid #ca8a04}' +
      '.sev-minor td:first-child{border-left:3px solid #2563eb}' +
      '.badge{font-size:.7rem;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:3px;background:rgba(255,255,255,.1)}' +
      'code{font-size:.8rem;background:rgba(255,255,255,.07);padding:2px 5px;border-radius:3px}' +
      '</style></head><body>' +
      '<h1>ADA Accessibility Report</h1>' +
      '<p>Generated: ' + new Date().toLocaleString() + ' &nbsp;|&nbsp; WCAG Level: ' + (result.level || 'A') + ' &nbsp;|&nbsp; Score: <strong>' + result.score + ' / 100</strong></p>' +
      '<p>Violations: ' + result.summary.total + ' total — ' +
      result.summary.critical + ' critical, ' + result.summary.serious + ' serious, ' +
      result.summary.moderate + ' moderate, ' + result.summary.minor + ' minor</p>' +
      '<table><thead><tr><th>Severity</th><th>Issue</th><th>Element</th><th>How to Fix</th><th>WCAG</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></body></html>';
  }

  function downloadFile(filename, content, type) {
    var blob = new Blob([content], { type: type });
    var a    = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  var exportPdfBtn  = document.getElementById('export-pdf-btn');
  var exportTxtBtn  = document.getElementById('export-txt-btn');
  var exportHtmlBtn = document.getElementById('export-html-btn');
  var exportCopyBtn = document.getElementById('export-copy-btn');

  var exportCsvBtn  = document.getElementById('export-csv-btn');

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', function () {
      requirePro(function () {
        var html = buildHtmlReport(_lastResult);
        var win  = window.open('', '_blank', 'width=900,height=700');
        if (!win) { showToast('Pop-up blocked — allow pop-ups and try again.'); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
        win.onload = function () { win.print(); };
        // Fallback if onload already fired
        setTimeout(function () { try { win.print(); } catch(e) {} }, 300);
      });
    });
  }
  if (exportTxtBtn) {
    exportTxtBtn.addEventListener('click', function () {
      requirePro(function () {
        downloadFile('ada-report.txt', buildTxtReport(_lastResult), 'text/plain');
      });
    });
  }
  if (exportHtmlBtn) {
    exportHtmlBtn.addEventListener('click', function () {
      requirePro(function () {
        downloadFile('ada-report.html', buildHtmlReport(_lastResult), 'text/html');
      });
    });
  }
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', function () {
      requirePro(function () {
        downloadFile('ada-report.csv', buildCsvReport(_lastResult), 'text/csv');
      });
    });
  }

  if (exportCopyBtn) {
    exportCopyBtn.addEventListener('click', function () {
      requirePro(function () {
        navigator.clipboard.writeText(buildTxtReport(_lastResult)).then(function () {
          exportCopyBtn.textContent = 'Copied!';
          setTimeout(function () { exportCopyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy Summary'; }, 2000);
        });
      });
    });
  }

  // ─── Batch check ─────────────────────────────────────────────────────────────
  var batchAddBtn    = document.getElementById('batch-add-btn');
  var batchCheckBtn  = document.getElementById('batch-check-btn');
  var batchItems     = document.getElementById('batch-items');
  var batchResults   = document.getElementById('batch-results');
  var batchPageCount = 1;

  function getBatchLimit() {
    var plan = getUserPlan();
    if (plan === 'enterprise') return Infinity;
    if (plan === 'pro')        return 5;
    return 0;
  }

  if (batchAddBtn) {
    batchAddBtn.addEventListener('click', function () {
      var limit = getBatchLimit();
      if (batchPageCount >= limit) {
        var msg = limit === 5 ? 'Pro plan supports up to 5 pages. Upgrade to Enterprise for unlimited.'
                              : 'Batch checking requires the Pro plan. Upgrade in Settings \u2192 Pricing Plans.';
        showToast(msg);
        return;
      }
      batchPageCount++;
      var taId = 'batch-textarea-' + batchPageCount;
      var wrap = document.createElement('div');
      wrap.className = 'batch-item';
      wrap.innerHTML =
        '<div class="batch-item-header">' +
          '<label for="' + taId + '">Page ' + batchPageCount + '</label>' +
          '<button type="button" class="batch-remove-btn" aria-label="Remove page ' + batchPageCount + '">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</button>' +
        '</div>' +
        '<textarea id="' + taId + '" class="batch-textarea" rows="6" placeholder="Paste HTML for page ' + batchPageCount + '…" spellcheck="false"></textarea>';
      wrap.querySelector('.batch-remove-btn').addEventListener('click', function () {
        wrap.remove();
        batchPageCount--;
        renumberBatchItems();
      });
      batchItems.appendChild(wrap);
      wrap.querySelector('textarea').focus();
    });
  }

  function renumberBatchItems() {
    Array.from(batchItems.querySelectorAll('.batch-item')).forEach(function (item, i) {
      var num  = i + 1;
      var taId = 'batch-textarea-' + num;
      var lbl  = item.querySelector('label');
      var btn  = item.querySelector('.batch-remove-btn');
      var ta   = item.querySelector('.batch-textarea');
      if (lbl) { lbl.textContent = 'Page ' + num; lbl.setAttribute('for', taId); }
      if (btn) btn.setAttribute('aria-label', 'Remove page ' + num);
      if (ta)  ta.id = taId;
    });
    batchPageCount = batchItems.querySelectorAll('.batch-item').length;
  }

  var batchErrorEl = document.getElementById('batch-input-error');

  if (batchCheckBtn) {
    batchCheckBtn.addEventListener('click', async function () {
      if (!planAtLeast('pro')) {
        showToast('Batch checking requires the Pro plan. Upgrade in Pricing Plans.');
        return;
      }
      // Fast-path: skip fetch if we already know limit is reached
      if (serverRemaining === 0) { updateUsageCounter(); return; }

      // Server gate — authoritative plan + rate limit check
      var allowed = await requestServerGate();
      if (!allowed) return;

      var textareas = Array.from(batchItems.querySelectorAll('.batch-textarea'));
      var pages     = textareas.map(function (ta) { return ta.value.trim(); }).filter(Boolean);
      if (!pages.length) {
        if (batchErrorEl) {
          batchErrorEl.textContent = 'At least one HTML field must have content before running a batch check. Paste HTML into Page\u00a01 (and any additional pages) to continue.';
          batchErrorEl.hidden = false;
        }
        var firstEmpty = textareas.find(function (ta) { return !ta.value.trim(); });
        if (firstEmpty) { firstEmpty.setAttribute('aria-invalid', 'true'); firstEmpty.focus(); }
        return;
      }
      if (batchErrorEl) { batchErrorEl.hidden = true; batchErrorEl.textContent = ''; }
      textareas.forEach(function (ta) { ta.removeAttribute('aria-invalid'); });

      var batchSpinner = document.getElementById('batch-spinner');
      batchCheckBtn.disabled = true;
      batchCheckBtn.textContent = 'Checking\u2026';
      if (batchSpinner) { batchSpinner.hidden = false; batchSpinner.removeAttribute('aria-hidden'); }
      if (liveRegion)   { liveRegion.textContent = 'Batch check started, please wait.'; }

      // Run each page's check sequentially using the async runner so the
      // browser stays responsive even when processing many large pages.
      if (typeof window.checkAccessibilityAsync !== 'function') {
        batchCheckBtn.disabled = false;
        batchCheckBtn.textContent = 'Check All Pages';
        if (batchSpinner) { batchSpinner.hidden = true; batchSpinner.setAttribute('aria-hidden', 'true'); }
        if (liveRegion) liveRegion.textContent = 'Checker is still loading, please try again in a moment.';
        return;
      }

      var level   = getSelectedLevel();
      var results = [];
      (function runNext(idx) {
        if (idx >= pages.length) {
          // Server already counted this; only use client fallback if server was unreachable
          if (serverRemaining === null) incrementCheckCount();
          updateUsageCounter();
          batchCheckBtn.disabled = false;
          batchCheckBtn.textContent = 'Check All Pages';
          if (batchSpinner) { batchSpinner.hidden = true; batchSpinner.setAttribute('aria-hidden', 'true'); }
          if (liveRegion)   { liveRegion.textContent = 'Batch check complete. ' + results.length + ' page' + (results.length !== 1 ? 's' : '') + ' checked.'; }
          renderBatchResults(results);
          return;
        }
        window.checkAccessibilityAsync(pages[idx], level).then(function (result) {
          results.push(result);
          runNext(idx + 1);
        });
      }(0));
    });
  }

  function renderBatchResults(results) {
    if (!batchResults) return;
    batchResults.hidden = false;
    batchResults.innerHTML = '';

    // Tab nav
    var nav = document.createElement('div');
    nav.className = 'batch-result-tabs';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', 'Batch results per page');

    var panels = [];

    results.forEach(function (result, i) {
      var tabId   = 'batch-tab-' + i;
      var panelId = 'batch-panel-' + i;

      var tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'batch-result-tab' + (i === 0 ? ' active' : '');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('id', tabId);
      tab.setAttribute('aria-controls', panelId);
      tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      tab.setAttribute('tabindex', i === 0 ? '0' : '-1');

      var score = result.score;
      var color = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'fail';
      tab.innerHTML = 'Page ' + (i + 1) + ' <span class="batch-tab-score score-' + color + '">' + score + '</span>';
      nav.appendChild(tab);

      var panel = document.createElement('div');
      panel.className = 'batch-result-panel';
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('id', panelId);
      panel.setAttribute('aria-labelledby', tabId);
      panel.hidden = i !== 0;

      var summary = '<p class="batch-summary"><strong>Score:</strong> ' + score + '/100 &nbsp;|&nbsp; ' +
        '<strong>Violations:</strong> ' + result.summary.total + ' (' +
        result.summary.critical + ' critical, ' + result.summary.serious + ' serious, ' +
        result.summary.moderate + ' moderate, ' + result.summary.minor + ' minor)</p>';

      var violationHtml = result.violations.length === 0
        ? '<p class="batch-no-violations">No violations found!</p>'
        : result.violations.map(function (v) {
            return '<div class="batch-violation severity-' + v.severity + '">' +
              '<span class="severity-badge">' + escapeHTML(v.severity) + '</span>' +
              '<span class="batch-violation-msg">' + escapeHTML(v.message) + '</span>' +
              '</div>';
          }).join('');

      panel.innerHTML = summary + '<div class="batch-violation-list">' + violationHtml + '</div>';
      panels.push(panel);
    });

    // Wire tab switching
    Array.from(nav.querySelectorAll('[role="tab"]')).forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        Array.from(nav.querySelectorAll('[role="tab"]')).forEach(function (t, j) {
          t.setAttribute('aria-selected', j === i ? 'true' : 'false');
          t.classList.toggle('active', j === i);
          t.setAttribute('tabindex', j === i ? '0' : '-1');
          panels[j].hidden = j !== i;
        });
      });
    });

    batchResults.appendChild(nav);
    panels.forEach(function (p) { batchResults.appendChild(p); });
  }

}());

// ─── Checker Switcher ────────────────────────────────────────────────────────
(function () {
  'use strict';

  var switcher          = document.getElementById('checker-switcher');
  var adaSection        = document.querySelector('section[aria-labelledby="input-heading"]');
  var contrastSection   = document.getElementById('contrast-checker-section');
  var resultsSection    = document.getElementById('results');

  if (!switcher || !adaSection || !contrastSection) return;

  switcher.addEventListener('change', function () {
    var val = switcher.value;
    if (val === 'ada') {
      adaSection.hidden      = false;
      contrastSection.hidden = true;
    } else if (val === 'contrast') {
      adaSection.hidden      = true;
      contrastSection.hidden = false;
      if (resultsSection) resultsSection.hidden = true;
      updateContrast();
    }
  });

  // ─── Contrast checker logic ──────────────────────────────────────────────
  var fgPicker   = document.getElementById('fg-color-picker');
  var bgPicker   = document.getElementById('bg-color-picker');
  var fgHex      = document.getElementById('fg-hex');
  var bgHex      = document.getElementById('bg-hex');
  var swapBtn    = document.getElementById('contrast-swap-btn');
  var previewBox = document.getElementById('contrast-preview-box');
  var ratioVal   = document.getElementById('contrast-ratio-value');

  var badges = {
    aaNormal:  document.getElementById('badge-aa-normal'),
    aaLarge:   document.getElementById('badge-aa-large'),
    aaaNormal: document.getElementById('badge-aaa-normal'),
    aaaLarge:  document.getElementById('badge-aaa-large')
  };
  var statuses = {
    aaNormal:  document.getElementById('status-aa-normal'),
    aaLarge:   document.getElementById('status-aa-large'),
    aaaNormal: document.getElementById('status-aaa-normal'),
    aaaLarge:  document.getElementById('status-aaa-large')
  };

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length !== 6 || !/^[0-9a-f]{6}$/i.test(h)) return null;
    return {
      r: parseInt(h.slice(0,2), 16),
      g: parseInt(h.slice(2,4), 16),
      b: parseInt(h.slice(4,6), 16)
    };
  }

  function linearize(c) {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(rgb) {
    return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
  }

  function contrastRatio(l1, l2) {
    var lighter = Math.max(l1, l2);
    var darker  = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function setBadge(badge, statusEl, passes) {
    badge.classList.remove('pass', 'fail');
    if (passes === null) {
      badge.classList.remove('pass', 'fail');
      statusEl.textContent = '—';
    } else if (passes) {
      badge.classList.add('pass');
      statusEl.textContent = 'Pass';
    } else {
      badge.classList.add('fail');
      statusEl.textContent = 'Fail';
    }
  }

  function updateContrast() {
    var fg = hexToRgb(fgHex.value.trim());
    var bg = hexToRgb(bgHex.value.trim());

    if (fg) fgHex.removeAttribute('aria-invalid'); else fgHex.setAttribute('aria-invalid', 'true');
    if (bg) bgHex.removeAttribute('aria-invalid'); else bgHex.setAttribute('aria-invalid', 'true');

    if (!fg || !bg) {
      ratioVal.textContent = '—';
      ['aaNormal','aaLarge','aaaNormal','aaaLarge'].forEach(function (k) {
        setBadge(badges[k], statuses[k], null);
      });
      return;
    }

    // Update preview
    previewBox.style.backgroundColor = bgHex.value.trim();
    previewBox.style.color            = fgHex.value.trim();

    var lFg = relativeLuminance(fg);
    var lBg = relativeLuminance(bg);
    var ratio = contrastRatio(lFg, lBg);

    ratioVal.textContent = ratio.toFixed(2) + ':1';

    setBadge(badges.aaNormal,  statuses.aaNormal,  ratio >= 4.5);
    setBadge(badges.aaLarge,   statuses.aaLarge,   ratio >= 3.0);
    setBadge(badges.aaaNormal, statuses.aaaNormal, ratio >= 7.0);
    setBadge(badges.aaaLarge,  statuses.aaaLarge,  ratio >= 4.5);
  }

  // Sync color picker → hex input
  fgPicker.addEventListener('input', function () {
    fgHex.value = fgPicker.value;
    updateContrast();
  });
  bgPicker.addEventListener('input', function () {
    bgHex.value = bgPicker.value;
    updateContrast();
  });

  // Sync hex input → color picker
  fgHex.addEventListener('input', function () {
    var rgb = hexToRgb(fgHex.value.trim());
    if (rgb) fgPicker.value = fgHex.value.trim();
    updateContrast();
  });
  bgHex.addEventListener('input', function () {
    var rgb = hexToRgb(bgHex.value.trim());
    if (rgb) bgPicker.value = bgHex.value.trim();
    updateContrast();
  });

  // Swap button
  swapBtn.addEventListener('click', function () {
    var tmpHex = fgHex.value;
    fgHex.value   = bgHex.value;
    bgHex.value   = tmpHex;
    fgPicker.value = fgHex.value;
    bgPicker.value = bgHex.value;
    updateContrast();
  });

}());
