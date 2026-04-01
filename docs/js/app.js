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
  var resultsSection = document.getElementById('results');
  var resultsHeading = document.getElementById('results-heading');
  var scoreGauge     = document.getElementById('score-gauge');
  var scoreNumber    = document.getElementById('score-number');
  var violationList  = document.getElementById('violation-list');
  var noViolations   = document.getElementById('no-violations');
  var liveRegion     = document.getElementById('live-region');
  var tabs           = Array.from(document.querySelectorAll('[role="tab"]'));
  var filterBtns     = Array.from(document.querySelectorAll('.filter-btn'));

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

  // ─── Score counter animation ──────────────────────────────────────────────────
  function animateScore(finalScore) {
    let current = 0;
    const increment = finalScore / 50;
    const interval = setInterval(() => {
      current += increment;
      if (current >= finalScore) {
        current = finalScore;
        clearInterval(interval);
      }
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
      var show = filter === 'all' || card.dataset.severity === filter;
      card.classList.toggle('hidden', !show);
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

      // Summary row: severity badge + message
      var summary = document.createElement('summary');
      summary.innerHTML =
        '<span class="severity-badge">' + escapeHTML(v.severity) + '</span>' +
        '<span class="violation-message">' + escapeHTML(v.message) + '</span>';
      details.appendChild(summary);

      // Expanded body: element snippet, how to fix, WCAG reference
      var body = document.createElement('div');
      body.className = 'violation-body';
      body.innerHTML =
        '<p><strong>Element:</strong><br><code>' + escapeHTML(v.element) + '</code></p>' +
        '<p><strong>How to fix:</strong> ' + escapeHTML(v.remediation) + '</p>' +
        '<p><strong>WCAG:</strong> ' + escapeHTML(v.wcag) + '</p>';
      details.appendChild(body);

      violationList.appendChild(details);
    });

    // Re-apply the active filter to the freshly rendered cards.
    applyFilter(activeFilter);
  }

  // ─── Display results ──────────────────────────────────────────────────────────
  function displayResults(result) {
    // Update severity count tiles using the summary object from checkAccessibility().
    ['critical', 'serious', 'moderate', 'minor'].forEach(function (s) {
      document.getElementById('count-' + s).textContent = result.summary[s];
    });

    updateGauge(result.score);
    renderViolations(result.violations);
    resultsSection.hidden = false;
    resultsHeading.focus();

    // Announce result to screen readers via the live region.
    liveRegion.textContent =
      'Check complete. Found ' + result.summary.total +
      ' violation' + (result.summary.total !== 1 ? 's' : '') +
      '. Score: ' + result.score + ' out of 100.';
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
    var activeTab = tabs.find(function (t) {
      return t.getAttribute('aria-selected') === 'true';
    });
    var isUrlTab = activeTab && activeTab.id === 'tab-url';
    var html = '';

    if (isUrlTab) {
      // URL mode: attempt a fetch (may be blocked by CORS on GitHub Pages).
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
      // Paste HTML mode: read from the textarea.
      html = (htmlInput.value || '').trim();
      if (!html) { markInputError(htmlInput); return; }
    }

    // Show loading state.
    checkBtn.disabled = true;
    checkBtn.textContent = 'Checking\u2026';
    checkBtn.setAttribute('aria-busy', 'true');

    // Yield to the browser so the button label updates before the synchronous
    // checkAccessibility() call blocks the main thread.
    setTimeout(function () {
      var result = window.checkAccessibility(html);

      checkBtn.disabled = false;
      checkBtn.textContent = 'Check Accessibility';
      checkBtn.removeAttribute('aria-busy');

      displayResults(result);
    }, 50);
  }

}());
