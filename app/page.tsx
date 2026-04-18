import type { Metadata } from 'next';
import Script from 'next/script';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'ADA Accessibility Checker',
  description: 'Check any HTML for WCAG 2.1 violations — runs entirely in your browser, no server needed.',
};

export default function CheckerPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Nav />

      <header className="page-header">
        <h1>ADA Accessibility Checker</h1>
        <p>Check any HTML for WCAG 2.1 violations — runs entirely in your browser, no server needed.</p>
      </header>

      <main id="main-content">
        {/* Live region for screen readers */}
        <div role="status" aria-live="polite" id="live-region" className="sr-only" />

        <section aria-labelledby="input-heading">
          <h2 id="input-heading">HTML to Check</h2>

          {/* Tab UI */}
          <div className="tab-container">
            <div role="tablist" aria-label="Input method">
              <button role="tab" id="tab-paste" aria-selected="true" aria-controls="panel-paste" tabIndex={0}>
                Paste HTML
              </button>
              <button role="tab" id="tab-url" aria-selected="false" aria-controls="panel-url" tabIndex={-1}
                      title="URL checking requires the Pro plan">
                Enter URL
                <svg className="tab-lock-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </button>
              <button role="tab" id="tab-batch" aria-selected="false" aria-controls="panel-batch" tabIndex={-1}
                      title="Batch checking requires the Pro plan">
                Batch
                <svg className="tab-lock-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </button>
            </div>

            {/* Paste tab */}
            <div role="tabpanel" id="panel-paste" aria-labelledby="tab-paste">
              <div className="checker-input-header">
                <label htmlFor="html-input">Paste HTML code:</label>
                <div className="wcag-level-wrap">
                  <label htmlFor="main-wcag-level" className="wcag-level-label">WCAG Level</label>
                  <div className="wcag-select-wrap">
                    <select id="main-wcag-level" className="wcag-level-select" aria-describedby="main-wcag-hint">
                      <option value="A">A — Free</option>
                      <option value="AA">AA — Pro 🔒</option>
                      <option value="AAA">AAA — Enterprise 🔒</option>
                    </select>
                  </div>
                  <span id="main-wcag-hint" className="sr-only">Level AA requires Pro plan. Level AAA requires Enterprise plan.</span>
                </div>
              </div>
              <div id="wcag-upgrade-toast" className="wcag-upgrade-toast" hidden aria-hidden="true" aria-live="assertive" role="alert" />
              <p id="html-input-error" className="input-error-msg" hidden role="alert" aria-live="polite" />
              <div className="textarea-wrapper">
                <textarea
                  id="html-input"
                  rows={12}
                  placeholder={'<img src="photo.png">'}
                  spellCheck={false}
                  aria-describedby="html-hint"
                />
                <div className="checker-switcher-wrap">
                  <label htmlFor="checker-switcher" className="sr-only">Select a checker</label>
                  <select id="checker-switcher" className="checker-switcher" aria-label="Select a checker">
                    <option value="" disabled>Checkers</option>
                    <option value="ada" defaultValue="ada">ADA Accessibility Checker</option>
                    <option value="contrast">Color Contrast Checker</option>
                  </select>
                </div>
              </div>
              <p id="html-hint" className="field-note">
                Example violations to test:{' '}
                <code>{`<img src="test.png">`}</code> &middot;{' '}
                <code>{`<input type="text" placeholder="Email">`}</code> &middot;{' '}
                <code>{`<a href="/p">click here</a>`}</code> &middot;{' '}
                <code>{`<h1>Title</h1><h3>Sub</h3>`}</code>
              </p>
            </div>

            {/* URL tab */}
            <div role="tabpanel" id="panel-url" aria-labelledby="tab-url" hidden>
              <div id="url-upgrade-banner" className="tab-paywall" hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p className="tab-paywall-title">Pro Plan Required</p>
                <p className="tab-paywall-desc">URL checking is available on the Pro plan and above. Upgrade to check live pages directly by URL.</p>
                <a href="/pricing" className="tab-paywall-btn">View Pricing</a>
              </div>
              <div id="url-content" className="tab-locked-content">
                <label htmlFor="url-input">Page URL:</label>
                <div className="textarea-wrapper url-input-wrapper">
                  <input type="url" id="url-input" placeholder="https://example.com" aria-describedby="url-note" disabled />
                  <div className="checker-switcher-wrap">
                    <label htmlFor="url-checker-switcher" className="sr-only">Select a checker</label>
                    <select id="url-checker-switcher" className="checker-switcher" aria-label="Select a checker">
                      <option value="" disabled>Checkers</option>
                      <option value="paste">ADA Accessibility Checker</option>
                      <option value="url" defaultValue="url">Enter URL</option>
                      <option value="batch">Batch Checker</option>
                    </select>
                  </div>
                </div>
                <p id="url-input-error" className="input-error-msg" hidden role="alert" aria-live="polite" />
                <p id="url-note" className="field-note">
                  Note: URL fetching may be blocked by CORS restrictions.
                  If the request fails, paste the page&rsquo;s HTML source into the <strong>Paste HTML</strong> tab instead.
                </p>
              </div>
            </div>

            {/* Batch tab */}
            <div role="tabpanel" id="panel-batch" aria-labelledby="tab-batch" hidden>
              <div id="batch-upgrade-banner" className="tab-paywall" hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p className="tab-paywall-title">Pro Plan Required</p>
                <p className="tab-paywall-desc">Batch checking is available on the Pro plan (up to 5 pages) and Enterprise (unlimited). Upgrade to check multiple pages at once.</p>
                <a href="/pricing" className="tab-paywall-btn">View Pricing</a>
              </div>
              <div id="batch-content" className="tab-locked-content">
                <div className="batch-header-row">
                  <p className="field-note" style={{ margin: 0 }}>Check up to 5 pages at once (Pro) or unlimited pages (Enterprise). Results show per-page scores and violations.</p>
                  <div className="checker-switcher-wrap checker-switcher-wrap--inline">
                    <label htmlFor="batch-checker-switcher" className="sr-only">Select a checker</label>
                    <select id="batch-checker-switcher" className="checker-switcher" aria-label="Select a checker">
                      <option value="" disabled>Checkers</option>
                      <option value="paste">ADA Accessibility Checker</option>
                      <option value="url">Enter URL</option>
                      <option value="batch" defaultValue="batch">Batch Checker</option>
                    </select>
                  </div>
                </div>
                <div id="batch-items" style={{ marginTop: '1rem' }}>
                  <div className="batch-item">
                    <div className="batch-item-header"><label>Page 1</label></div>
                    <textarea className="batch-textarea" rows={6} placeholder="Paste HTML for page 1…" spellCheck={false} />
                  </div>
                </div>
                <p id="batch-input-error" className="input-error-msg" hidden role="alert" aria-live="polite" />
                <div className="batch-actions">
                  <button type="button" id="batch-add-btn" className="batch-add-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Page
                  </button>
                  <button type="button" id="batch-check-btn" className="batch-check-btn">Check All Pages</button>
                  <div id="batch-spinner" className="scan-spinner" role="status" hidden aria-hidden="true">
                    <svg className="spinner-circle" viewBox="0 0 50 50" width="28" height="28" aria-hidden="true">
                      <circle className="spinner-track" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
                      <circle className="spinner-arc" cx="25" cy="25" r="20" fill="none" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                    <span className="spinner-label">Checking…</span>
                  </div>
                </div>
                <div id="batch-results" hidden />
              </div>
            </div>
          </div>

          <div id="usage-counter" className="usage-counter" hidden aria-live="polite" />
          <button type="button" id="check-btn">Check Accessibility</button>
          <div id="scan-spinner" className="scan-spinner" role="status" hidden aria-hidden="true">
            <svg className="spinner-circle" viewBox="0 0 50 50" width="36" height="36" aria-hidden="true">
              <circle className="spinner-track" cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
              <circle className="spinner-arc" cx="25" cy="25" r="20" fill="none" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span className="spinner-label">Checking…</span>
          </div>
        </section>

        {/* Color Contrast Checker */}
        <section id="contrast-checker-section" aria-labelledby="contrast-heading" hidden>
          <h2 id="contrast-heading">Color Contrast Checker</h2>
          <p className="contrast-description">Check foreground and background color pairs against WCAG 2.1 contrast requirements.</p>

          <div className="contrast-inputs">
            <div className="contrast-color-group">
              <label htmlFor="fg-color-picker">Foreground (Text)</label>
              <div className="color-input-row">
                <input type="color" id="fg-color-picker" defaultValue="#ffffff" aria-label="Foreground color picker" />
                <input type="text" id="fg-hex" defaultValue="#ffffff" maxLength={7} placeholder="#000000"
                       aria-label="Foreground hex value" autoComplete="off" spellCheck={false} />
              </div>
            </div>
            <div className="contrast-swap-wrap">
              <button type="button" id="contrast-swap-btn" className="contrast-swap-btn" aria-label="Swap foreground and background colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </button>
            </div>
            <div className="contrast-color-group">
              <label htmlFor="bg-color-picker">Background</label>
              <div className="color-input-row">
                <input type="color" id="bg-color-picker" defaultValue="#0d2b6e" aria-label="Background color picker" />
                <input type="text" id="bg-hex" defaultValue="#0d2b6e" maxLength={7} placeholder="#ffffff"
                       aria-label="Background hex value" autoComplete="off" spellCheck={false} />
              </div>
            </div>
          </div>

          <div className="contrast-preview-wrap">
            <div id="contrast-preview-box" className="contrast-preview-box" aria-hidden="true">
              <span id="contrast-preview-text">Sample Text — The quick brown fox</span>
              <span id="contrast-preview-large" className="contrast-preview-large">Large Text Sample</span>
            </div>
          </div>

          <div className="contrast-results" id="contrast-results" aria-live="polite" aria-label="Contrast results">
            <div className="contrast-ratio-display">
              <span id="contrast-ratio-value" className="contrast-ratio-value">—</span>
              <span className="contrast-ratio-label">Contrast Ratio</span>
            </div>
            <div className="contrast-badges" role="list" aria-label="WCAG pass/fail results">
              {[
                { id: 'aa-normal', level: 'AA', size: 'Normal text', req: '4.5:1' },
                { id: 'aa-large', level: 'AA', size: 'Large text', req: '3:1' },
                { id: 'aaa-normal', level: 'AAA', size: 'Normal text', req: '7:1' },
                { id: 'aaa-large', level: 'AAA', size: 'Large text', req: '4.5:1' },
              ].map((b) => (
                <div key={b.id} className="contrast-badge" id={`badge-${b.id}`} role="listitem">
                  <span className="badge-level">{b.level}</span>
                  <span className="badge-size">{b.size}</span>
                  <span className="badge-req">{b.req}</span>
                  <span className="badge-status" id={`status-${b.id}`}>—</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section id="results" aria-labelledby="results-heading" hidden>
          <div className="results-title-row">
            <h2 id="results-heading" tabIndex={-1}>Results</h2>
            <span id="results-wcag-level" className="results-wcag-badge" hidden aria-label="Checked against WCAG level" />
          </div>

          <div className="score-container">
            <div className="score-gauge" id="score-gauge" role="img" aria-label="Accessibility score: 0 out of 100">
              <div className="score-inner">
                <span id="score-number" aria-hidden="true">0</span>
                <span className="score-label" aria-hidden="true">/ 100</span>
              </div>
            </div>
            <div className="score-legend" aria-hidden="true">
              <span className="legend-item legend-good">80–100 Good</span>
              <span className="legend-item legend-warn">50–79 Fair</span>
              <span className="legend-item legend-fail">0–49 Poor</span>
            </div>
          </div>

          <div className="severity-counts" aria-label="Violations by severity">
            {(['critical', 'serious', 'moderate', 'minor'] as const).map((s) => (
              <div key={s} className={`count-item severity-${s}`}>
                <span className="count-number" id={`count-${s}`}>0</span>
                <span className="count-label">{s.charAt(0).toUpperCase() + s.slice(1)}</span>
              </div>
            ))}
          </div>

          <div className="filter-bar" role="group" aria-label="Filter violations by severity">
            {(['all', 'critical', 'serious', 'moderate', 'minor'] as const).map((f) => (
              <button key={f} type="button" className={`filter-btn${f === 'all' ? ' active' : ''}`}
                      data-filter={f} aria-pressed={f === 'all'}>
                {f === 'all' ? 'Show All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div id="violation-list" aria-label="Violation details" />
          <p id="no-violations" hidden>
            No violations found — great job! Consider also running a full manual review.
          </p>

          <div id="export-section" className="export-section" hidden>
            <div className="export-header">
              <h3 className="export-title">Export Report</h3>
              <span className="export-plan-badge">Pro</span>
            </div>
            <div className="export-options" role="group" aria-label="Export format options">
              <button type="button" id="export-pdf-btn" className="export-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                Download PDF
              </button>
              <button type="button" id="export-csv-btn" className="export-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                Download .csv
              </button>
              <button type="button" id="export-txt-btn" className="export-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Download .txt
              </button>
              <button type="button" id="export-html-btn" className="export-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                </svg>
                Download .html
              </button>
              <button type="button" id="export-copy-btn" className="export-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Summary
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Load auth script first, then lazily load checker */}
      <Script src="/js/auth.js" strategy="afterInteractive" />
      <Script id="load-checker" strategy="afterInteractive">{`
        (function () {
          var loaded = false;
          function loadChecker() {
            if (loaded) return;
            loaded = true;
            var s1 = document.createElement('script');
            s1.src = '/js/checker.js';
            s1.onload = function () {
              var s2 = document.createElement('script');
              s2.src = '/js/app.js';
              document.head.appendChild(s2);
            };
            document.head.appendChild(s1);
          }
          // Use event delegation so we catch clicks even if AuthGate hasn't
          // rendered the checker elements yet when this script first runs.
          document.addEventListener('click', function onCheckerClick(e) {
            if (e.target.closest('#check-btn, #tab-paste, #tab-url, #tab-batch, #html-input, #batch-check-btn')) {
              document.removeEventListener('click', onCheckerClick);
              loadChecker();
            }
          });
          document.addEventListener('focus', function onCheckerFocus(e) {
            if (e.target.closest('#html-input, #url-input')) {
              document.removeEventListener('focus', onCheckerFocus, true);
              loadChecker();
            }
          }, true);
          if (window.requestIdleCallback) {
            requestIdleCallback(loadChecker, { timeout: 8000 });
          } else {
            setTimeout(loadChecker, 5000);
          }
        }());
      `}</Script>
    </>
  );
}
