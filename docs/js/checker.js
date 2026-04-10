// ADA / WCAG 2.1 Accessibility Checker
// Browser-only — uses DOMParser, no dependencies.
//
// Quick-test snippets (paste into the checker):
//   <img src="test.png">                        → critical  (1)
//   <input type="text" placeholder="Email">     → serious   (2)
//   <a href="/p">click here</a>                 → serious   (3)
//   <h1>Title</h1><h3>Sub</h3>                  → moderate  (5)
// Run when the page is ready
// Wire up the settings page checker UI
// History + UI wiring for ADA checker

// History + UI wiring for ADA checker

function addHistoryEntry(result) {
  try {
    var history = JSON.parse(localStorage.getItem('ada-history') || '[]');
    history.push({
      score: typeof result.score === 'number' ? Math.round(result.score) : 0,
      violations: (result.violations || []).length,
      date: new Date().toLocaleString(),
      details: (result.violations || []).map(function (v) {
        return {
          severity: v.severity,
          message: v.message,
          element: v.element,
          remediation: v.remediation,
          wcag: v.wcag
        };
      })
    });
    if (history.length > 20) history = history.slice(-20);
    localStorage.setItem('ada-history', JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save history', e);
  }
}

function showUpgradeToast(level, selectEl) {
  var required = level === 'AAA' ? 'Enterprise' : 'Pro';
  var msg = 'WCAG ' + level + ' checks require the ' + required + ' plan. Upgrade in Settings → Pricing Plans.';
  // Prefer a toast element if present, otherwise fall back to alert
  var toast = document.getElementById('wcag-upgrade-toast');
  if (toast) {
    toast.textContent = msg;
    toast.hidden = false;
    toast.removeAttribute('aria-hidden');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(function () {
      toast.hidden = true;
      toast.setAttribute('aria-hidden', 'true');
    }, 4000);
  } else {
    alert(msg);
  }
}

// Plan tiers: 'free' | 'pro' | 'enterprise'
function getUserPlan() {
  return localStorage.getItem('ada-plan') || 'free';
}

function levelAllowed(level) {
  var plan = getUserPlan();
  if (level === 'A')   return true;
  if (level === 'AA')  return plan === 'pro' || plan === 'enterprise';
  if (level === 'AAA') return plan === 'enterprise';
  return false;
}

function planAtLeast(tier) {
  var plan = getUserPlan();
  if (tier === 'pro')        return plan === 'pro' || plan === 'enterprise';
  if (tier === 'enterprise') return plan === 'enterprise';
  return true;
}

// ─── Rate limiting (Free: 10 checks per 4-hour window) ────────────────────
var RATE_KEY = 'ada-rate-usage';
var FREE_CHECK_LIMIT = 10;
var RATE_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours in ms

function getRateUsage() {
  try {
    var d = JSON.parse(localStorage.getItem(RATE_KEY) || 'null');
    if (!d || typeof d.windowStart !== 'number') return _resetRate();
    if (Date.now() - d.windowStart >= RATE_WINDOW_MS) return _resetRate();
    return d;
  } catch (e) { return _resetRate(); }
}

function _resetRate() {
  var d = { windowStart: Date.now(), count: 0 };
  try { localStorage.setItem(RATE_KEY, JSON.stringify(d)); } catch (e) {}
  return d;
}

function canRunCheck() {
  if (getUserPlan() !== 'free') return true;
  return getRateUsage().count < FREE_CHECK_LIMIT;
}

function getRemainingChecks() {
  if (getUserPlan() !== 'free') return Infinity;
  return Math.max(0, FREE_CHECK_LIMIT - getRateUsage().count);
}

function getResetMs() {
  var d = getRateUsage();
  return Math.max(0, d.windowStart + RATE_WINDOW_MS - Date.now());
}

function formatResetTime() {
  var ms = getResetMs();
  var h = Math.floor(ms / 3600000);
  var m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return h + 'h ' + m + 'm';
  return (m + 1) + 'm';
}

function incrementCheckCount() {
  if (getUserPlan() !== 'free') return;
  var d = getRateUsage();
  d.count++;
  try { localStorage.setItem(RATE_KEY, JSON.stringify(d)); } catch (e) {}
}

// ─── Custom rules (Enterprise) ────────────────────────────────────────────
var CUSTOM_RULES_KEY = 'ada-custom-rules';

function getCustomRules() {
  try {
    var r = JSON.parse(localStorage.getItem(CUSTOM_RULES_KEY) || '[]');
    return Array.isArray(r) ? r : [];
  } catch (e) { return []; }
}

function saveCustomRules(rules) {
  try { localStorage.setItem(CUSTOM_RULES_KEY, JSON.stringify(rules)); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const htmlInput   = document.getElementById('html-input');
  const checkButton = document.getElementById('check-btn');
  const resultsList = document.getElementById('results-list');
  const scoreEl     = document.getElementById('checker-score');
  const levelSelect = document.getElementById('settings-wcag-level');

  if (!htmlInput || !checkButton || !resultsList) {
    console.warn('Checker elements not found', { htmlInput, checkButton, resultsList });
    return;
  }

  // Keep the select in sync with locked options on change
  if (levelSelect) {
    levelSelect.addEventListener('change', () => {
      const chosen = levelSelect.value;
      if (!levelAllowed(chosen)) {
        showUpgradeToast(chosen, levelSelect);
        levelSelect.value = 'A';
      }
    });
  }

  checkButton.addEventListener('click', () => {
    if (!canRunCheck()) {
      if (scoreEl) {
        scoreEl.hidden = false;
        scoreEl.textContent = 'Check limit reached — resets in ' + formatResetTime();
      }
      return;
    }

    const html  = htmlInput.value;
    const level = (levelSelect && levelAllowed(levelSelect.value)) ? levelSelect.value : 'A';
    const result = checkAccessibility(html, level);
    const violations = (result && result.violations) || [];

    incrementCheckCount();

    if (scoreEl) {
      if (typeof result.score === 'number') {
        scoreEl.hidden = false;
        scoreEl.textContent = `Score: ${Math.round(result.score)} / 100 — WCAG ${result.level}`;
      } else {
        scoreEl.hidden = true;
      }
    }

    addHistoryEntry(result);

    // Re-render the history tab if it's on the same page (settings.html)
    if (typeof window.renderHistory === 'function') {
      window.renderHistory();
    }
    if (typeof window.updateCheckerRateUI === 'function') {
      window.updateCheckerRateUI();
    }

    renderResults(violations, resultsList);
  });
});

function renderResults(violations, listEl) {
  listEl.innerHTML = '';

  if (!violations || !violations.length) {
    const li = document.createElement('li');
    li.textContent = 'No violations found (with the current checks).';
    listEl.appendChild(li);
    return;
  }

  violations.forEach(v => {
    const li = document.createElement('li');
    li.className = 'checker-result-item checker-result--' + (v.severity || 'info');

    const badge = document.createElement('span');
    badge.className = 'checker-result-badge';
    badge.textContent = (v.severity || 'info').toUpperCase();

    const textWrap = document.createElement('div');
    textWrap.className = 'checker-result-text';

    const messageEl = document.createElement('div');
    messageEl.textContent = v.message || 'Issue';
    textWrap.appendChild(messageEl);

    if (v.element) {
      const elementEl = document.createElement('span');
      elementEl.className = 'checker-result-element';
      elementEl.textContent = v.element;
      textWrap.appendChild(elementEl);
    }

    li.appendChild(badge);
    li.appendChild(textWrap);
    listEl.appendChild(li);
  });
}

window.renderResults = renderResults;

// your existing (function () { 'use strict'; ... }()); should follow below
(function () {
  'use strict';

  // ─── Constants ──────────────────────────────────────────────────────────────

  var VALID_ROLES = new Set([
    'alert','alertdialog','application','article','banner','button','cell',
    'checkbox','columnheader','combobox','complementary','contentinfo','definition',
    'dialog','directory','document','feed','figure','form','grid','gridcell',
    'group','heading','img','link','list','listbox','listitem','log','main',
    'marquee','math','menu','menubar','menuitem','menuitemcheckbox','menuitemradio',
    'navigation','none','note','option','presentation','progressbar','radio',
    'radiogroup','region','row','rowgroup','rowheader','scrollbar','search',
    'searchbox','separator','slider','spinbutton','status','switch','tab','table',
    'tablist','tabpanel','term','textbox','timer','toolbar','tooltip','tree',
    'treegrid','treeitem'
  ]);

  var VAGUE_LINK_TEXT = new Set([
    'click here','here','read more','more','learn more','link','details',
    'this','download','continue','go'
  ]);

  var GENERIC_ALT = new Set([
    'image','photo','picture','img','icon','logo','banner','graphic','thumbnail'
  ]);

  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])';

  // Score penalties per severity level
  var PENALTY = { critical: 20, serious: 10, moderate: 5, minor: 2 };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  // Returns the opening tag of an element, truncated to 120 characters.
  function openTag(el) {
    var html = el.outerHTML || '';
    var end  = html.indexOf('>');
    var tag  = end === -1 ? html : html.slice(0, end + 1);
    return tag.length > 120 ? tag.slice(0, 117) + '...' : tag;
  }

  // Derives the accessible name from an element (aria-label → aria-labelledby → title → text).
  function accessibleName(el, doc) {
    var label = (el.getAttribute('aria-label') || '').trim();
    if (label) return label;

    var lby = (el.getAttribute('aria-labelledby') || '').trim();
    if (lby) {
      var name = lby.split(/\s+/).map(function (id) {
        var ref = doc.getElementById(id);
        return ref ? ref.textContent.trim() : '';
      }).filter(Boolean).join(' ');
      if (name) return name;
    }

    var title = (el.getAttribute('title') || '').trim();
    if (title) return title;

    return el.textContent.trim();
  }

  // ─── Check 1: Image Alt Text (WCAG 1.1.1) ───────────────────────────────────

  function checkImageAlt(doc) {
    var issues = [];

    doc.querySelectorAll('img').forEach(function (el) {
      if (!el.hasAttribute('alt')) {
        issues.push({
          ruleId:      'img-alt-missing',
          severity:    'critical',
          element:     openTag(el),
          message:     'Image missing alt text',
          remediation: 'Add descriptive alt text that explains what the image shows. For decorative images, use alt="".',
          wcag:        '1.1.1 Non-text Content (Level A)'
        });
        return;
      }

      var alt = (el.getAttribute('alt') || '').trim();
      var low = alt.toLowerCase();
      var isFilename = /\.(png|jpe?g|gif|webp|svg|bmp|ico|tiff?)$/i.test(low);
      var isGeneric  = GENERIC_ALT.has(low);

      if (alt && (isFilename || isGeneric)) {
        issues.push({
          ruleId:      'img-alt-generic',
          severity:    'moderate',
          element:     openTag(el),
          message:     'Alt text appears to be filename or generic: "' + alt + '"',
          remediation: 'Add descriptive alt text that explains what the image shows.',
          wcag:        '1.1.1 Non-text Content (Level A)'
        });
      }
    });

    return issues;
  }

  // ─── Check 2: Form Labels (WCAG 3.3.2) ──────────────────────────────────────

  function checkFormLabels(doc) {
    var issues = [];
    var selector =
      'input:not([type="hidden"]):not([type="submit"]):not([type="reset"])' +
      ':not([type="button"]):not([type="image"]), textarea, select';

    doc.querySelectorAll(selector).forEach(function (el) {
      var id = el.getAttribute('id');

      var hasLabel      = id ? !!doc.querySelector('label[for="' + CSS.escape(id) + '"]') : false;
      var hasAriaLabel  = !!(el.getAttribute('aria-label') || '').trim();
      var hasLabelledBy = !!(el.getAttribute('aria-labelledby') || '').trim();
      var hasTitle      = !!(el.getAttribute('title') || '').trim();
      var hasPlaceholder = !!(el.getAttribute('placeholder') || '').trim();

      // Properly labelled — skip.
      if (hasLabel || hasAriaLabel || hasLabelledBy || hasTitle) return;

      if (hasPlaceholder) {
        issues.push({
          ruleId:      'form-label-placeholder-only',
          severity:    'serious',
          element:     openTag(el),
          message:     'Input only has placeholder, needs proper label',
          remediation: 'Add a <label> element or aria-label attribute. Placeholders disappear on focus and are not a substitute for labels.',
          wcag:        '3.3.2 Labels or Instructions (Level A)'
        });
      } else {
        issues.push({
          ruleId:      'form-label-missing',
          severity:    'critical',
          element:     openTag(el),
          message:     'Form input missing label',
          remediation: 'Add a <label> element or aria-label attribute.',
          wcag:        '3.3.2 Labels or Instructions (Level A)'
        });
      }
    });

    return issues;
  }

  // ─── Check 3: Link Text (WCAG 2.4.4) ────────────────────────────────────────

  function checkLinkText(doc) {
    var issues = [];

    doc.querySelectorAll('a[href]').forEach(function (el) {
      var name = accessibleName(el, doc);

      if (!name) {
        issues.push({
          ruleId:      'link-empty',
          severity:    'critical',
          element:     openTag(el),
          message:     'Link has no text',
          remediation: 'Use descriptive link text that makes sense out of context.',
          wcag:        '2.4.4 Link Purpose (Level A)'
        });
      } else if (VAGUE_LINK_TEXT.has(name.toLowerCase())) {
        issues.push({
          ruleId:      'link-vague',
          severity:    'serious',
          element:     openTag(el),
          message:     'Link text is vague: "' + name + '"',
          remediation: 'Use descriptive link text that makes sense out of context.',
          wcag:        '2.4.4 Link Purpose (Level A)'
        });
      }
    });

    return issues;
  }

  // ─── Check 4: Page Title (WCAG 2.4.2) ───────────────────────────────────────

  function checkPageTitle(doc) {
    var title = doc.querySelector('title');
    if (!title || !title.textContent.trim()) {
      return [{
        ruleId:      'page-title-missing',
        severity:    'moderate',
        element:     '<title>',
        message:     'Page missing title element',
        remediation: 'Add a <title> element in the <head> with a descriptive page title.',
        wcag:        '2.4.2 Page Titled (Level A)'
      }];
    }
    return [];
  }

  // ─── Check 5: Heading Hierarchy (WCAG 1.3.1) ────────────────────────────────

  function checkHeadings(doc) {
    var issues  = [];
    var headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'));

    // Must have an h1.
    if (!doc.querySelector('h1')) {
      issues.push({
        ruleId:      'heading-no-h1',
        severity:    'moderate',
        element:     '<body>',
        message:     'Page missing main heading (h1)',
        remediation: 'Use heading levels in order (h1, h2, h3) without skipping.',
        wcag:        '1.3.1 Info and Relationships (Level A)'
      });
    }

    var prev = 0;
    headings.forEach(function (el) {
      // Empty heading.
      if (!el.textContent.trim()) {
        issues.push({
          ruleId:      'heading-empty',
          severity:    'moderate',
          element:     openTag(el),
          message:     'Empty heading element',
          remediation: 'Use heading levels in order (h1, h2, h3) without skipping.',
          wcag:        '1.3.1 Info and Relationships (Level A)'
        });
      }

      // Skipped level (e.g. h1 → h3).
      var level = parseInt(el.tagName[1], 10);
      if (prev > 0 && level > prev + 1) {
        issues.push({
          ruleId:      'heading-skip',
          severity:    'moderate',
          element:     openTag(el),
          message:     'Heading hierarchy skips level (h' + prev + ' → h' + level + ')',
          remediation: 'Use heading levels in order (h1, h2, h3) without skipping.',
          wcag:        '1.3.1 Info and Relationships (Level A)'
        });
      }
      prev = level;
    });

    return issues;
  }

  // ─── Check 6: Language Attribute (WCAG 3.1.1) ───────────────────────────────

  function checkLanguage(doc) {
    var html = doc.querySelector('html');
    if (!html || !(html.getAttribute('lang') || '').trim()) {
      return [{
        ruleId:      'html-lang-missing',
        severity:    'moderate',
        element:     '<html>',
        message:     'HTML element missing lang attribute',
        remediation: "Add lang='en' (or appropriate language code) to the <html> tag.",
        wcag:        '3.1.1 Language of Page (Level A)'
      }];
    }
    return [];
  }

  // ─── Check 7: ARIA Roles (WCAG 4.1.2) ───────────────────────────────────────

  function checkARIA(doc) {
    var issues = [];

    // Invalid role values.
    doc.querySelectorAll('[role]').forEach(function (el) {
      var role = (el.getAttribute('role') || '').trim().toLowerCase();
      if (role && !VALID_ROLES.has(role)) {
        issues.push({
          ruleId:      'aria-role-invalid',
          severity:    'serious',
          element:     openTag(el),
          message:     'Invalid ARIA role: "' + role + '"',
          remediation: 'Use valid ARIA roles and ensure references point to existing elements.',
          wcag:        '4.1.2 Name, Role, Value (Level A)'
        });
      }
    });

    // aria-labelledby pointing at a non-existent ID.
    doc.querySelectorAll('[aria-labelledby]').forEach(function (el) {
      var ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
      ids.forEach(function (id) {
        if (!doc.getElementById(id)) {
          issues.push({
            ruleId:      'aria-labelledby-missing',
            severity:    'serious',
            element:     openTag(el),
            message:     'aria-labelledby references missing element: #' + id,
            remediation: 'Use valid ARIA roles and ensure references point to existing elements.',
            wcag:        '4.1.2 Name, Role, Value (Level A)'
          });
        }
      });
    });

    // aria-hidden="true" on focusable elements.
    doc.querySelectorAll('[aria-hidden="true"]').forEach(function (el) {
      if (el.matches(FOCUSABLE) || el.querySelector(FOCUSABLE)) {
        issues.push({
          ruleId:      'aria-hidden-focusable',
          severity:    'critical',
          element:     openTag(el),
          message:     'Focusable element hidden from screen readers',
          remediation: 'Use valid ARIA roles and ensure references point to existing elements.',
          wcag:        '4.1.2 Name, Role, Value (Level A)'
        });
      }
    });

    return issues;
  }

  // ─── Check 8: Table Structure (WCAG 1.3.1) ──────────────────────────────────

  function checkTables(doc) {
    var issues = [];

    doc.querySelectorAll('table').forEach(function (table) {
      if (!table.querySelector('th')) {
        issues.push({
          ruleId:      'table-no-headers',
          severity:    'serious',
          element:     openTag(table),
          message:     'Table missing header cells',
          remediation: 'Add <th> elements for headers, scope attributes, and <caption> for context.',
          wcag:        '1.3.1 Info and Relationships (Level A)'
        });
      } else {
        table.querySelectorAll('th').forEach(function (th) {
          if (!th.hasAttribute('scope')) {
            issues.push({
              ruleId:      'table-th-no-scope',
              severity:    'moderate',
              element:     openTag(th),
              message:     'Table header missing scope attribute',
              remediation: 'Add <th> elements for headers, scope attributes, and <caption> for context.',
              wcag:        '1.3.1 Info and Relationships (Level A)'
            });
          }
        });
      }

      if (!table.querySelector('caption')) {
        issues.push({
          ruleId:      'table-no-caption',
          severity:    'minor',
          element:     openTag(table),
          message:     'Table missing caption',
          remediation: 'Add <th> elements for headers, scope attributes, and <caption> for context.',
          wcag:        '1.3.1 Info and Relationships (Level A)'
        });
      }
    });

    return issues;
  }

  // ─── Check 9: Button Names (WCAG 4.1.2) ─────────────────────────────────────

  function checkButtons(doc) {
    var issues = [];

    doc.querySelectorAll('button, [role="button"]').forEach(function (el) {
      if (!accessibleName(el, doc)) {
        issues.push({
          ruleId:      'button-no-name',
          severity:    'critical',
          element:     openTag(el),
          message:     'Button has no accessible name',
          remediation: 'Add text content or aria-label to button.',
          wcag:        '4.1.2 Name, Role, Value (Level A)'
        });
      }
    });

    return issues;
  }

  // ─── Check 10: Skip Links (WCAG 2.4.1) ──────────────────────────────────────

  function checkSkipLinks(doc) {
    // Look for a skip link within the first 5 anchor elements.
    var first5 = Array.from(doc.querySelectorAll('a')).slice(0, 5);
    var hasSkip = first5.some(function (el) {
      var href = (el.getAttribute('href') || '');
      return href.startsWith('#') && /skip/i.test(el.textContent);
    });

    if (!hasSkip) {
      return [{
        ruleId:      'skip-link-missing',
        severity:    'minor',
        element:     '<body>',
        message:     'No skip navigation link found',
        remediation: 'Add a skip link at the top of the page linking to main content.',
        wcag:        '2.4.1 Bypass Blocks (Level A)'
      }];
    }
    return [];
  }

  // ─── Check 11: IFrame Titles (WCAG 4.1.2) ───────────────────────────────────

  function checkIframes(doc) {
    var issues = [];

    doc.querySelectorAll('iframe').forEach(function (el) {
      if (!(el.getAttribute('title') || '').trim()) {
        issues.push({
          ruleId:      'iframe-no-title',
          severity:    'serious',
          element:     openTag(el),
          message:     'Iframe missing title attribute',
          remediation: 'Add title attribute describing the iframe content.',
          wcag:        '4.1.2 Name, Role, Value (Level A)'
        });
      }
    });

    return issues;
  }

  // ─── Check 12: Input Image Alt (WCAG 1.1.1) ─────────────────────────────────

  function checkInputImages(doc) {
    var issues = [];

    doc.querySelectorAll('input[type="image"]').forEach(function (el) {
      if (!(el.getAttribute('alt') || '').trim()) {
        issues.push({
          ruleId:      'input-image-no-alt',
          severity:    'critical',
          element:     openTag(el),
          message:     'Image input missing alt text',
          remediation: 'Add alt attribute to image inputs.',
          wcag:        '1.1.1 Non-text Content (Level A)'
        });
      }
    });

    return issues;
  }

  // ─── Check 13: Duplicate IDs (WCAG 4.1.1) ───────────────────────────────────

  function checkDuplicateIds(doc) {
    var counts = {};
    doc.querySelectorAll('[id]').forEach(function (el) {
      var id = el.getAttribute('id');
      if (id) counts[id] = (counts[id] || 0) + 1;
    });

    return Object.keys(counts)
      .filter(function (id) { return counts[id] > 1; })
      .map(function (id) {
        return {
          ruleId:      'duplicate-id',
          severity:    'serious',
          element:     '[id="' + id + '"]',
          message:     'Duplicate ID found: ' + id,
          remediation: 'Ensure all IDs are unique on the page.',
          wcag:        '4.1.1 Parsing (Level A)'
        };
      });
  }

  // ─── Check 14: Landmark Regions (WCAG 1.3.6 / 2.4.1 — Level AA) ────────────

  function checkLandmarks(doc) {
    var issues = [];
    var hasMain = !!(doc.querySelector('main') || doc.querySelector('[role="main"]'));
    var hasNav  = !!(doc.querySelector('nav')  || doc.querySelector('[role="navigation"]'));

    if (!hasMain) {
      issues.push({
        ruleId:      'landmark-main-missing',
        severity:    'serious',
        element:     '<body>',
        message:     'Page has no main landmark (<main> or role="main")',
        remediation: 'Wrap the primary page content in a <main> element.',
        wcag:        '1.3.6 Identify Purpose (Level AA)'
      });
    }
    if (!hasNav) {
      issues.push({
        ruleId:      'landmark-nav-missing',
        severity:    'moderate',
        element:     '<body>',
        message:     'Page has no navigation landmark (<nav> or role="navigation")',
        remediation: 'Wrap navigation links in a <nav> element.',
        wcag:        '2.4.1 Bypass Blocks (Level AA)'
      });
    }
    return issues;
  }

  // ─── Check 15: Autoplay Media (WCAG 1.4.2 — Level AA) ───────────────────────

  function checkAutoplay(doc) {
    var issues = [];
    doc.querySelectorAll('video[autoplay], audio[autoplay]').forEach(function (el) {
      if (!el.hasAttribute('muted')) {
        issues.push({
          ruleId:      'media-autoplay',
          severity:    'serious',
          element:     openTag(el),
          message:     el.tagName.toLowerCase() + ' autoplays with sound',
          remediation: 'Add the muted attribute or do not use autoplay. Provide a mechanism to pause or stop audio.',
          wcag:        '1.4.2 Audio Control (Level AA)'
        });
      }
    });
    return issues;
  }

  // ─── Check 16: Meta Refresh (WCAG 2.2.1 — Level AA) ─────────────────────────

  function checkMetaRefresh(doc) {
    var issues = [];
    doc.querySelectorAll('meta[http-equiv="refresh"]').forEach(function (el) {
      var content = (el.getAttribute('content') || '').trim();
      var seconds = parseInt(content, 10);
      if (!isNaN(seconds) && seconds > 0) {
        issues.push({
          ruleId:      'meta-refresh',
          severity:    'serious',
          element:     openTag(el),
          message:     'Page auto-refreshes after ' + seconds + ' second' + (seconds !== 1 ? 's' : ''),
          remediation: 'Remove the auto-refresh or provide a way for users to turn it off. Timed redirects disrupt screen reader users.',
          wcag:        '2.2.1 Timing Adjustable (Level AA)'
        });
      }
    });
    return issues;
  }

  // ─── Check 17: Error Suggestion (WCAG 3.3.3 — Level AA) ─────────────────────

  function checkErrorSuggestion(doc) {
    var issues = [];
    doc.querySelectorAll('[aria-invalid="true"]').forEach(function (el) {
      var described = (el.getAttribute('aria-describedby') || '').trim();
      var errId = described.split(/\s+/).find(function (id) {
        var ref = doc.getElementById(id);
        return ref && ref.textContent.trim();
      });
      if (!errId) {
        issues.push({
          ruleId:      'error-no-suggestion',
          severity:    'moderate',
          element:     openTag(el),
          message:     'Invalid field has no descriptive error message (aria-describedby missing or empty)',
          remediation: 'Add aria-describedby pointing to an element that describes the error and suggests a fix.',
          wcag:        '3.3.3 Error Suggestion (Level AA)'
        });
      }
    });
    return issues;
  }

  // ─── Check 18: Abbreviations (WCAG 3.1.4 — Level AAA) ───────────────────────

  function checkAbbreviations(doc) {
    var issues = [];
    doc.querySelectorAll('abbr').forEach(function (el) {
      if (!(el.getAttribute('title') || '').trim()) {
        issues.push({
          ruleId:      'abbr-no-title',
          severity:    'minor',
          element:     openTag(el),
          message:     '<abbr> element missing title expansion: "' + el.textContent.trim() + '"',
          remediation: 'Add a title attribute to <abbr> with the full expansion of the abbreviation.',
          wcag:        '3.1.4 Abbreviations (Level AAA)'
        });
      }
    });
    return issues;
  }

  // ─── Check 19: Ambiguous Duplicate Link Text (WCAG 2.4.9 — Level AAA) ───────

  function checkDuplicateLinkText(doc) {
    var map = {};
    doc.querySelectorAll('a[href]').forEach(function (el) {
      var text = el.textContent.trim().toLowerCase();
      var href = (el.getAttribute('href') || '').trim();
      if (!text) return;
      if (!map[text]) map[text] = new Set();
      map[text].add(href);
    });

    var issues = [];
    Object.keys(map).forEach(function (text) {
      if (map[text].size > 1) {
        issues.push({
          ruleId:      'duplicate-link-text',
          severity:    'moderate',
          element:     '<a>' + text + '</a>',
          message:     'Links with identical text "' + text + '" point to different destinations',
          remediation: 'Make each link\'s text unique so its purpose is clear without surrounding context.',
          wcag:        '2.4.9 Link Purpose — Link Only (Level AAA)'
        });
      }
    });
    return issues;
  }

  // ─── Check 20: Timed Session Content (WCAG 2.2.3 — Level AAA) ───────────────

  function checkTimedContent(doc) {
    var issues = [];
    // Detect short meta-refresh (already caught at AA, flag again at AAA for stricter message)
    // Also flag setTimeout / setInterval hints in inline scripts
    doc.querySelectorAll('script:not([src])').forEach(function (el) {
      var src = el.textContent || '';
      if (/setTimeout|setInterval/.test(src) && /session|timeout|expire|logout/i.test(src)) {
        issues.push({
          ruleId:      'timed-session',
          severity:    'moderate',
          element:     '<script>',
          message:     'Inline script may impose a session timeout without user control',
          remediation: 'Ensure users can turn off, adjust, or extend any time limits. Warn users before a session expires.',
          wcag:        '2.2.3 No Timing (Level AAA)'
        });
      }
    });
    return issues;
  }

  // ─── Check 21: Custom Rules (Enterprise) ────────────────────────────────────

  function checkCustomRules(doc, rules) {
    var issues = [];
    rules.forEach(function (rule) {
      if (!rule.selector || !rule.message) return;
      try {
        doc.querySelectorAll(rule.selector).forEach(function (el) {
          issues.push({
            ruleId:      'custom-' + (rule.id || 'rule'),
            severity:    rule.severity || 'moderate',
            element:     openTag(el),
            message:     rule.message,
            remediation: rule.remediation || 'Review this element per your custom rule.',
            wcag:        'Custom Rule'
          });
        });
      } catch (e) {
        // invalid selector — skip silently
      }
    });
    return issues;
  }

  // ─── Main: checkAccessibility(html, level) ───────────────────────────────────

  /**
   * Runs WCAG checks against an HTML string.
   *
   * @param  {string} html  - Raw HTML markup to analyse.
   * @param  {string} level - 'A' | 'AA' | 'AAA' (defaults to 'A').
   * @returns {{ score: number, violations: object[], summary: object, level: string }}
   */
  function checkAccessibility(html, level) {
    level = (level || 'A').toUpperCase();
    var doc = new DOMParser().parseFromString(html, 'text/html');

    // Level A — always run (13 checks).
    var violations = [].concat(
      checkImageAlt(doc),
      checkFormLabels(doc),
      checkLinkText(doc),
      checkPageTitle(doc),
      checkHeadings(doc),
      checkLanguage(doc),
      checkARIA(doc),
      checkTables(doc),
      checkButtons(doc),
      checkSkipLinks(doc),
      checkIframes(doc),
      checkInputImages(doc),
      checkDuplicateIds(doc)
    );

    // Level AA — adds 4 more checks.
    if (level === 'AA' || level === 'AAA') {
      violations = violations.concat(
        checkLandmarks(doc),
        checkAutoplay(doc),
        checkMetaRefresh(doc),
        checkErrorSuggestion(doc)
      );
    }

    // Level AAA — adds 3 more checks.
    if (level === 'AAA') {
      violations = violations.concat(
        checkAbbreviations(doc),
        checkDuplicateLinkText(doc),
        checkTimedContent(doc)
      );
    }

    // Custom rules (Enterprise) — always run if any are defined.
    if (planAtLeast('enterprise')) {
      var customRules = getCustomRules();
      if (customRules.length) {
        violations = violations.concat(checkCustomRules(doc, customRules));
      }
    }

    // Sort: critical → serious → moderate → minor.
    var order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    violations.sort(function (a, b) {
      return order[a.severity] - order[b.severity];
    });

    // Build summary counts.
    var summary = { total: violations.length, critical: 0, serious: 0, moderate: 0, minor: 0 };
    violations.forEach(function (v) {
      if (summary[v.severity] !== undefined) summary[v.severity]++;
    });

    // Calculate score: 100 minus penalties, floored at 0.
    var score = Math.max(0,
      100
      - summary.critical * PENALTY.critical
      - summary.serious  * PENALTY.serious
      - summary.moderate * PENALTY.moderate
      - summary.minor    * PENALTY.minor
    );

    return { score: score, violations: violations, summary: summary, level: level };
  }

  // Export on window so app.js and the browser console can call it.
  window.checkAccessibility = checkAccessibility;

  // Backward-compatible alias used by app.js.
  window.runChecks = function (html) {
    var result = checkAccessibility(html);
    return { score: result.score, violations: result.violations };
  };

}());
