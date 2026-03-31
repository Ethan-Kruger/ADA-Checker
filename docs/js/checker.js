// ADA/WCAG 2.1 Accessibility Checker
// Runs entirely in the browser using DOMParser — no server required.
//
// Test snippets that demonstrate violations:
//   <img src="test.png">                           → critical: missing alt
//   <input type="text" placeholder="Email">        → serious: placeholder-only label
//   <a href="/page">click here</a>                 → serious: vague link text
//   <h1>Title</h1><h3>Subtitle</h3>               → moderate: skipped heading level

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

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

  var VAGUE_LINK_WORDS = new Set([
    'click here','here','read more','more','learn more','details',
    'this','link','download','continue','go'
  ]);

  var GENERIC_ALT_WORDS = new Set([
    'image','photo','picture','img','icon','logo','banner','graphic','thumbnail'
  ]);

  var FOCUSABLE_SEL =
    'a[href], button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])';

  var SEVERITY_WEIGHT   = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  var SEVERITY_PENALTY  = { critical: 20, serious: 10, moderate: 5, minor: 2 };

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Returns just the opening tag of an element, truncated to 120 chars.
  function snippet(el) {
    var html = el.outerHTML || '';
    var end  = html.indexOf('>');
    var tag  = end === -1 ? html : html.slice(0, end + 1);
    return tag.length > 120 ? tag.slice(0, 117) + '...' : tag;
  }

  // Computes the accessible name for an element.
  function accessibleName(el, doc) {
    var label = el.getAttribute('aria-label');
    if (label && label.trim()) return label.trim();

    var lby = el.getAttribute('aria-labelledby');
    if (lby) {
      var text = lby.split(/\s+/).map(function (id) {
        var ref = doc.getElementById(id);
        return ref ? ref.textContent.trim() : '';
      }).filter(Boolean).join(' ');
      if (text) return text;
    }

    var title = el.getAttribute('title');
    if (title && title.trim()) return title.trim();

    return el.textContent.trim();
  }

  // ── Rule 1: Image Alt Text (WCAG 1.1.1) ───────────────────────────────────

  function checkImages(doc) {
    var issues = [];
    doc.querySelectorAll('img').forEach(function (el) {
      if (!el.hasAttribute('alt')) {
        issues.push({
          severity:    'critical',
          message:     'Image is missing an alt attribute',
          element:     snippet(el),
          remediation: 'Add a descriptive alt attribute, e.g. alt="A dog playing in the park". For purely decorative images use alt="".',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
        });
      } else {
        var alt = (el.getAttribute('alt') || '').trim();
        var low = alt.toLowerCase();
        var isGeneric  = GENERIC_ALT_WORDS.has(low);
        var isFilename = /\.(png|jpe?g|gif|webp|svg|bmp|ico|tiff?)$/i.test(low);
        if (alt && (isGeneric || isFilename)) {
          issues.push({
            severity:    'moderate',
            message:     'Alt text appears to be a filename or generic word: "' + alt + '"',
            element:     snippet(el),
            remediation: 'Replace the alt text with a meaningful description of what the image conveys.',
            wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
          });
        }
      }
    });
    return issues;
  }

  // ── Rule 2: Form Labels (WCAG 1.3.1, 3.3.2) ───────────────────────────────

  function checkFormLabels(doc) {
    var issues = [];
    var sel = [
      'input:not([type="hidden"]):not([type="submit"]):not([type="reset"])',
      ':not([type="button"]):not([type="image"])',
      ', textarea, select'
    ].join('');
    doc.querySelectorAll(sel).forEach(function (el) {
      var id = el.getAttribute('id');
      var hasLabel = id
        ? !!doc.querySelector('label[for="' + CSS.escape(id) + '"]')
        : false;
      var hasAriaLabel    = !!(el.getAttribute('aria-label') || '').trim();
      var hasAriaLabelledBy = !!(el.getAttribute('aria-labelledby') || '').trim();
      var hasTitle        = !!(el.getAttribute('title') || '').trim();
      var hasPlaceholder  = !!(el.getAttribute('placeholder') || '').trim();

      if (hasLabel || hasAriaLabel || hasAriaLabelledBy || hasTitle) return;

      if (hasPlaceholder) {
        issues.push({
          severity:    'serious',
          message:     'Form field relies solely on placeholder text as a label',
          element:     snippet(el),
          remediation: 'Add a <label for="id"> element or aria-label attribute. Placeholders disappear when typing and are not a substitute for labels.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html'
        });
      } else {
        issues.push({
          severity:    'critical',
          message:     'Form field has no accessible label',
          element:     snippet(el),
          remediation: 'Associate a <label for="inputId"> element, or add an aria-label or aria-labelledby attribute.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html'
        });
      }
    });
    return issues;
  }

  // ── Rule 3: Link Text (WCAG 2.4.4) ────────────────────────────────────────

  function checkLinks(doc) {
    var issues = [];
    doc.querySelectorAll('a[href]').forEach(function (el) {
      var name = accessibleName(el, doc);
      if (!name) {
        issues.push({
          severity:    'critical',
          message:     'Link has no accessible name',
          element:     snippet(el),
          remediation: 'Add descriptive text inside the <a> element, or use aria-label to describe where the link goes.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html'
        });
      } else if (VAGUE_LINK_WORDS.has(name.toLowerCase())) {
        issues.push({
          severity:    'serious',
          message:     'Link text is non-descriptive: "' + name + '"',
          element:     snippet(el),
          remediation: 'Use descriptive link text that explains the destination, e.g. "Read our accessibility guide" instead of "Read more".',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html'
        });
      }
    });
    return issues;
  }

  // ── Rule 4: Page Title (WCAG 2.4.2) ───────────────────────────────────────

  function checkPageTitle(doc) {
    var title = doc.querySelector('title');
    if (!title || !title.textContent.trim()) {
      return [{
        severity:    'moderate',
        message:     'Page is missing a descriptive <title>',
        element:     '<title>',
        remediation: 'Add a <title> inside <head> that describes the page, e.g. <title>Contact Us – My Site</title>.',
        wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html'
      }];
    }
    return [];
  }

  // ── Rule 5: Heading Hierarchy (WCAG 1.3.1, 2.4.6) ─────────────────────────

  function checkHeadings(doc) {
    var issues = [];
    var headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'));

    if (!doc.querySelector('h1')) {
      issues.push({
        severity:    'moderate',
        message:     'Page has no h1 heading',
        element:     '<body>',
        remediation: 'Add a single <h1> that describes the main topic of the page.',
        wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
      });
    }

    var prevLevel = 0;
    headings.forEach(function (el) {
      if (!el.textContent.trim()) {
        issues.push({
          severity:    'moderate',
          message:     'Heading element is empty',
          element:     snippet(el),
          remediation: 'Add descriptive text to the heading or remove the empty element.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
        });
      }
      var level = parseInt(el.tagName[1], 10);
      if (prevLevel > 0 && level > prevLevel + 1) {
        issues.push({
          severity:    'moderate',
          message:     'Heading level skipped from h' + prevLevel + ' to h' + level,
          element:     snippet(el),
          remediation: 'Do not skip heading levels. Add an h' + (prevLevel + 1) + ' between h' + prevLevel + ' and h' + level + '.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
        });
      }
      prevLevel = level;
    });
    return issues;
  }

  // ── Rule 6: Language Attribute (WCAG 3.1.1) ───────────────────────────────

  function checkLanguage(doc) {
    var html = doc.querySelector('html');
    if (!html || !(html.getAttribute('lang') || '').trim()) {
      return [{
        severity:    'moderate',
        message:     'HTML element is missing a lang attribute',
        element:     '<html>',
        remediation: 'Add a lang attribute to the <html> element, e.g. <html lang="en">.',
        wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html'
      }];
    }
    return [];
  }

  // ── Rule 7: ARIA Roles (WCAG 4.1.2) ───────────────────────────────────────

  function checkARIA(doc) {
    var issues = [];

    doc.querySelectorAll('[role]').forEach(function (el) {
      var role = (el.getAttribute('role') || '').trim().toLowerCase();
      if (role && !VALID_ROLES.has(role)) {
        issues.push({
          severity:    'serious',
          message:     'Invalid ARIA role: "' + role + '"',
          element:     snippet(el),
          remediation: 'Use a valid WAI-ARIA 1.1 role. See https://www.w3.org/TR/wai-aria-1.1/#role_definitions for the complete list.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
        });
      }
    });

    doc.querySelectorAll('[aria-hidden="true"]').forEach(function (el) {
      if (el.matches(FOCUSABLE_SEL) || el.querySelector(FOCUSABLE_SEL)) {
        issues.push({
          severity:    'critical',
          message:     'aria-hidden="true" applied to an element that contains focusable content',
          element:     snippet(el),
          remediation: 'Remove aria-hidden="true" from elements containing interactive content, or remove the focusable elements from within the hidden container.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
        });
      }
    });
    return issues;
  }

  // ── Rule 8: Table Structure (WCAG 1.3.1) ──────────────────────────────────

  function checkTables(doc) {
    var issues = [];
    doc.querySelectorAll('table').forEach(function (table) {
      if (!table.querySelector('th')) {
        issues.push({
          severity:    'serious',
          message:     'Table has no header cells (<th>)',
          element:     snippet(table),
          remediation: 'Add <th> elements in the first row or column to identify headers for each column or row.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
        });
      } else {
        table.querySelectorAll('th').forEach(function (th) {
          if (!th.hasAttribute('scope')) {
            issues.push({
              severity:    'moderate',
              message:     'Table header cell is missing a scope attribute',
              element:     snippet(th),
              remediation: 'Add scope="col" or scope="row" to each <th> to clarify whether it headers a column or a row.',
              wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
            });
          }
        });
      }
      if (!table.querySelector('caption')) {
        issues.push({
          severity:    'minor',
          message:     'Table is missing a <caption> element',
          element:     snippet(table),
          remediation: 'Add a <caption> as the first child of <table> to provide a visible title for the table.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
        });
      }
    });
    return issues;
  }

  // ── Rule 9: Button Names (WCAG 4.1.2) ─────────────────────────────────────

  function checkButtons(doc) {
    var issues = [];
    doc.querySelectorAll('button, [role="button"]').forEach(function (el) {
      if (!accessibleName(el, doc)) {
        issues.push({
          severity:    'critical',
          message:     'Button has no accessible name',
          element:     snippet(el),
          remediation: 'Add descriptive text inside the <button> element, or use aria-label to provide an accessible name.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
        });
      }
    });
    return issues;
  }

  // ── Rule 10: Skip Links (WCAG 2.4.1) ──────────────────────────────────────

  function checkSkipLinks(doc) {
    var allLinks = Array.from(doc.querySelectorAll('a'));
    var first5   = allLinks.slice(0, 5);
    var hasSkip  = first5.some(function (el) {
      return (el.getAttribute('href') || '').startsWith('#') &&
             /skip/i.test(el.textContent);
    });
    if (!hasSkip) {
      return [{
        severity:    'minor',
        message:     'No skip navigation link found',
        element:     '<body>',
        remediation: 'Add <a href="#main-content">Skip to main content</a> as the very first element inside <body>, and add id="main-content" to the main landmark.',
        wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html'
      }];
    }
    return [];
  }

  // ── Rule 11: Iframe Titles (WCAG 4.1.2) ───────────────────────────────────

  function checkIframes(doc) {
    var issues = [];
    doc.querySelectorAll('iframe').forEach(function (el) {
      if (!(el.getAttribute('title') || '').trim()) {
        issues.push({
          severity:    'serious',
          message:     'iframe is missing a title attribute',
          element:     snippet(el),
          remediation: 'Add a title attribute that describes the iframe\'s content, e.g. title="YouTube video: Product overview".',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html'
        });
      }
    });
    return issues;
  }

  // ── Rule 12: Input Type Image Alt (WCAG 1.1.1) ────────────────────────────

  function checkInputImages(doc) {
    var issues = [];
    doc.querySelectorAll('input[type="image"]').forEach(function (el) {
      if (!(el.getAttribute('alt') || '').trim()) {
        issues.push({
          severity:    'critical',
          message:     'Input type="image" is missing an alt attribute',
          element:     snippet(el),
          remediation: 'Add an alt attribute describing the button\'s action, e.g. alt="Submit search".',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
        });
      }
    });
    return issues;
  }

  // ── Rule 13: Duplicate IDs (WCAG 4.1.1) ───────────────────────────────────

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
          severity:    'serious',
          message:     'Duplicate id attribute: "' + id + '" appears ' + counts[id] + ' times',
          element:     '[id="' + id + '"]',
          remediation: 'Each id must be unique on the page. Rename duplicate ids to be distinct values.',
          wcagUrl:     'https://www.w3.org/WAI/WCAG21/Understanding/parsing.html'
        };
      });
  }

  // ── Main export ────────────────────────────────────────────────────────────

  window.runChecks = function runChecks(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');

    var violations = [].concat(
      checkImages(doc),
      checkFormLabels(doc),
      checkLinks(doc),
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

    violations.sort(function (a, b) {
      return SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity];
    });

    var score = violations.reduce(function (s, v) {
      return s - (SEVERITY_PENALTY[v.severity] || 0);
    }, 100);

    return { score: Math.max(0, score), violations: violations };
  };

}());
