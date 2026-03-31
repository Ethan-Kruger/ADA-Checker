(function () {
  'use strict';

  // ── Escape user-supplied content for safe innerHTML insertion ──────────────
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ── Element refs ───────────────────────────────────────────────────────────
  var checkBtn       = document.getElementById('check-btn');
  var htmlInput      = document.getElementById('html-input');
  var urlInput       = document.getElementById('url-input');
  var resultsSection = document.getElementById('results');
  var resultsHeading = document.getElementById('results-heading');
  var scoreGauge     = document.getElementById('score-gauge');
  var scoreNumber    = document.getElementById('score-number');
  var violationList  = document.getElementById('violation-list');
  var noViolations   = document.getElementById('no-violations');
  var liveRegion     = document.getElementById('live-region');
  var tabs           = Array.from(document.querySelectorAll('[role="tab"]'));
  var filterBtns     = Array.from(document.querySelectorAll('.filter-btn'));

  // ── Tab switching (ARIA tablist pattern) ──────────────────────────────────
  function activateTab(tab) {
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

  // ── Score gauge (conic-gradient donut, CSS custom properties) ─────────────
  function updateGauge(score) {
    var color = score >= 80 ? '#16a34a' : score >= 50 ? '#ca8a04' : '#dc2626';
    scoreGauge.style.setProperty('--score', score);
    scoreGauge.style.setProperty('--gauge-color', color);
    scoreNumber.textContent = score;
    scoreGauge.setAttribute('aria-label', 'Accessibility score: ' + score + ' out of 100');
  }

  // ── Filter bar ─────────────────────────────────────────────────────────────
  var activeFilter = 'all';

  function applyFilter(filter) {
    activeFilter = filter;
    filterBtns.forEach(function (btn) {
      var on = btn.dataset.filter === filter;
      btn.setAttribute('aria-pressed', String(on));
      btn.classList.toggle('active', on);
    });
    violationList.querySelectorAll('.violation-card').forEach(function (card) {
      var show = filter === 'all' || card.dataset.severity === filter;
      card.classList.toggle('hidden', !show);
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () { applyFilter(btn.dataset.filter); });
  });

  // ── Render violation cards (<details> accordion) ──────────────────────────
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
        '<p><a href="' + escapeHTML(v.wcagUrl) + '" target="_blank" rel="noopener noreferrer">' +
          'WCAG 2.1 Reference &rarr;</a></p>';
      details.appendChild(body);

      violationList.appendChild(details);
    });

    applyFilter(activeFilter);
  }

  // ── Display full results ───────────────────────────────────────────────────
  function displayResults(score, violations) {
    var counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    violations.forEach(function (v) {
      if (counts[v.severity] !== undefined) counts[v.severity]++;
    });
    ['critical', 'serious', 'moderate', 'minor'].forEach(function (s) {
      document.getElementById('count-' + s).textContent = counts[s];
    });

    updateGauge(score);
    renderViolations(violations);
    resultsSection.hidden = false;
    resultsHeading.focus();

    liveRegion.textContent =
      'Check complete. Found ' + violations.length +
      ' violation' + (violations.length !== 1 ? 's' : '') +
      '. Accessibility score: ' + score + ' out of 100.';
  }

  // ── Input error helper ─────────────────────────────────────────────────────
  function markInputError(input) {
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    setTimeout(function () { input.removeAttribute('aria-invalid'); }, 3000);
  }

  // ── Main check handler ─────────────────────────────────────────────────────
  checkBtn.addEventListener('click', handleCheck);

  async function handleCheck() {
    var activeTab = tabs.find(function (t) {
      return t.getAttribute('aria-selected') === 'true';
    });
    var isUrlTab = activeTab && activeTab.id === 'tab-url';
    var html = '';

    if (isUrlTab) {
      var url = (urlInput.value || '').trim();
      if (!url) { markInputError(urlInput); return; }

      checkBtn.disabled = true;
      checkBtn.textContent = 'Fetching…';

      try {
        var response = await fetch(url);
        html = await response.text();
      } catch (err) {
        checkBtn.disabled = false;
        checkBtn.textContent = 'Check Accessibility';
        resultsSection.hidden = false;
        violationList.innerHTML =
          '<p class="fetch-error">Could not fetch the URL — the server likely blocks ' +
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
    checkBtn.textContent = 'Checking…';
    checkBtn.setAttribute('aria-busy', 'true');

    // Yield to the browser so the loading label renders before the sync check runs.
    setTimeout(function () {
      var result = window.runChecks(html);
      checkBtn.disabled = false;
      checkBtn.textContent = 'Check Accessibility';
      checkBtn.removeAttribute('aria-busy');
      displayResults(result.score, result.violations);
    }, 50);
  }

}());
