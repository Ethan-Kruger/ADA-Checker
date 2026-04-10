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

  // ─── Element references ──────────────────────────────────────────────────────
  var checkBtn       = document.getElementById('check-btn');
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

  // ─── Usage counter display ───────────────────────────────────────────────────
  function updateUsageCounter() {
    if (!usageCounter) return;
    if (getUserPlan() !== 'free') { usageCounter.hidden = true; return; }
    var remaining = getRemainingChecks();
    usageCounter.hidden = false;
    if (remaining <= 0) {
      usageCounter.textContent = 'Limit reached — resets in ' + formatResetTime();
      usageCounter.classList.add('limit-reached');
      checkBtn.disabled = true;
      checkBtn.setAttribute('title', 'Check limit reached. Resets in ' + formatResetTime());
    } else {
      usageCounter.textContent = remaining + '\u202f/\u202f' + FREE_CHECK_LIMIT + ' checks remaining (resets every 4 hours)';
      usageCounter.classList.remove('limit-reached');
      checkBtn.disabled = false;
      checkBtn.removeAttribute('title');
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

  // ─── Tab switching (ARIA tablist pattern) ────────────────────────────────────
  function activateTab(tab) {
    // Block locked tabs (URL tab for free users)
    if (tab.classList.contains('tab-locked')) {
      showUrlUpgradeTooltip(tab);
      return;
    }
    tabs.forEach(function (t) {
      var active = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.setAttribute('tabindex', active ? '0' : '-1');
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
    });
    tab.focus();
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

    if (urlTab) {
      var urlLocked = !planAtLeast('pro');
      urlTab.classList.toggle('tab-locked', urlLocked);
      urlTab.setAttribute('aria-disabled', String(urlLocked));
    }

    if (batchTab) {
      var batchLocked = !planAtLeast('pro');
      batchTab.classList.toggle('tab-locked', batchLocked);
      batchTab.setAttribute('aria-disabled', String(batchLocked));
    }
  }
  applyTabLocks();

  function showUrlUpgradeTooltip(tab) {
    var toast = document.getElementById('wcag-upgrade-toast');
    var label = tab.id === 'tab-batch' ? 'Batch checking' : 'URL checking';
    var msg   = label + ' requires the Pro plan. Upgrade in Pricing Plans.';
    if (toast) {
      toast.textContent = msg;
      toast.hidden = false;
      toast.removeAttribute('aria-hidden');
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(function () {
        toast.hidden = true;
        toast.setAttribute('aria-hidden', 'true');
      }, 4000);
    }
  }

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

    resultsSection.hidden = false;
    resultsHeading.focus();

    saveToHistory(result);
    updateUsageCounter();

    liveRegion.textContent =
      'Check complete. Found ' + result.summary.total +
      ' violation' + (result.summary.total !== 1 ? 's' : '') +
      '. Score: ' + result.score + ' out of 100. WCAG Level ' + (result.level || 'A') + '.';
  }

  // ─── Input error helper ───────────────────────────────────────────────────────
  function markInputError(input) {
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    setTimeout(function () { input.removeAttribute('aria-invalid'); }, 3000);
  }

  // ─── Button click handler ─────────────────────────────────────────────────────
  checkBtn.addEventListener('click', handleCheck);

  async function handleCheck() {
    if (!canRunCheck()) {
      updateUsageCounter();
      return;
    }

    var activeTab = tabs.find(function (t) {
      return t.getAttribute('aria-selected') === 'true';
    });
    var isUrlTab = activeTab && activeTab.id === 'tab-url';
    var html = '';

    if (isUrlTab) {
      var url = (urlInput.value || '').trim();
      if (!url) { markInputError(urlInput); return; }

      checkBtn.disabled = true;
      checkBtn.textContent = 'Fetching\u2026';

      try {
        var response = await fetch(url);
        html = await response.text();
      } catch (err) {
        checkBtn.disabled = false;
        checkBtn.textContent = 'Check Accessibility';
        resultsSection.hidden = false;
        violationList.innerHTML =
          '<p class="fetch-error">Could not fetch the URL \u2014 the server likely blocks ' +
          'cross-origin requests (CORS). Copy and paste the page\'s HTML source into ' +
          'the <strong>Paste HTML</strong> tab instead.</p>';
        noViolations.hidden = true;
        resultsHeading.focus();
        return;
      }
    } else {
      html = (htmlInput.value || '').trim();
      if (!html) { markInputError(htmlInput); return; }
    }

    checkBtn.disabled = true;
    checkBtn.textContent = 'Checking\u2026';
    checkBtn.setAttribute('aria-busy', 'true');

    setTimeout(function () {
      var result = window.checkAccessibility(html, getSelectedLevel());

      incrementCheckCount();

      checkBtn.disabled = false;
      checkBtn.textContent = 'Check Accessibility';
      checkBtn.removeAttribute('aria-busy');

      displayResults(result);
    }, 50);
  }

  // ─── Export report ────────────────────────────────────────────────────────────
  function requirePro(action) {
    if (!planAtLeast('pro')) {
      showUpgradeToast('export');
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

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', function () {
      requirePro(function () { window.print(); });
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
        var msg = limit === 5 ? 'Pro plan supports up to 5 pages. Upgrade to Enterprise for unlimited batch pages.'
                              : 'Batch checking requires the Pro plan.';
        showUpgradeToast(msg);
        return;
      }
      batchPageCount++;
      var wrap = document.createElement('div');
      wrap.className = 'batch-item';
      wrap.innerHTML =
        '<div class="batch-item-header">' +
          '<label>Page ' + batchPageCount + '</label>' +
          '<button type="button" class="batch-remove-btn" aria-label="Remove page ' + batchPageCount + '">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</button>' +
        '</div>' +
        '<textarea class="batch-textarea" rows="6" placeholder="Paste HTML for page ' + batchPageCount + '…" spellcheck="false"></textarea>';
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
      var lbl = item.querySelector('label');
      var btn = item.querySelector('.batch-remove-btn');
      if (lbl) lbl.textContent = 'Page ' + (i + 1);
      if (btn) btn.setAttribute('aria-label', 'Remove page ' + (i + 1));
    });
    batchPageCount = batchItems.querySelectorAll('.batch-item').length;
  }

  if (batchCheckBtn) {
    batchCheckBtn.addEventListener('click', function () {
      if (!canRunCheck()) { updateUsageCounter(); return; }

      var textareas = Array.from(batchItems.querySelectorAll('.batch-textarea'));
      var pages     = textareas.map(function (ta) { return ta.value.trim(); }).filter(Boolean);
      if (!pages.length) return;

      batchCheckBtn.disabled = true;
      batchCheckBtn.textContent = 'Checking\u2026';

      setTimeout(function () {
        var results = pages.map(function (html) {
          return window.checkAccessibility(html, getSelectedLevel());
        });

        incrementCheckCount();
        updateUsageCounter();

        batchCheckBtn.disabled = false;
        batchCheckBtn.textContent = 'Check All Pages';

        renderBatchResults(results);
      }, 50);
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
