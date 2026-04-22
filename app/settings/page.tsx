'use client';

import Script from 'next/script';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export default function SettingsPage() {
  return (
    <>
      <Nav />

      <main id="main-content" className="settings-main">
        <div className="settings-layout">

          {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
          <aside className="settings-sidebar" aria-label="Settings navigation">
            <h1 className="settings-title">Settings</h1>
            <nav aria-label="Settings sections">
              <ul className="settings-nav" role="list">

                <li>
                  <button className="settings-nav-item" data-panel="pricing">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <span>Pricing Plans</span>
                  </button>
                </li>

                <li>
                  <button className="settings-nav-item" data-panel="profile">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Profile</span>
                  </button>
                </li>

                <li>
                  <button className="settings-nav-item" data-panel="history">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Check History</span>
                  </button>
                </li>

                <li>
                  <button className="settings-nav-item" data-panel="text-font">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="4 7 4 4 20 4 20 7" />
                      <line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
                    </svg>
                    <span>Text &amp; Font</span>
                  </button>
                </li>

                <li>
                  <button className="settings-nav-item" data-panel="api">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span>API Access</span>
                    <span className="nav-tier-badge">ENT</span>
                  </button>
                </li>

                <li>
                  <button className="settings-nav-item" data-panel="custom-rules">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Custom Rules</span>
                    <span className="nav-tier-badge">ENT</span>
                  </button>
                </li>

                <li>
                  <button className="settings-nav-item" data-panel="team">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Team</span>
                    <span className="nav-tier-badge">ENT</span>
                  </button>
                </li>

              </ul>
            </nav>
          </aside>

          {/* ── CONTENT PANELS ──────────────────────────────────────────────── */}
          <div className="settings-content">

            {/* PRICING PLANS */}
            <section className="settings-panel" id="panel-pricing" aria-labelledby="panel-pricing-title">
              <h2 className="panel-title" id="panel-pricing-title">Pricing Plans</h2>
              <p className="panel-subtitle">Simple, transparent pricing. Start for free. Upgrade when you need more.</p>
              <div className="panel-pricing-grid">

                <article className="pricing-card" aria-labelledby="sp-tier-free">
                  <div className="card-header">
                    <h3 id="sp-tier-free">Free</h3>
                    <div className="price-display">
                      <span className="price-amount">$0</span><span className="price-period">/month</span>
                    </div>
                  </div>
                  <ul className="feature-list" aria-label="Free tier features">
                    <li>10 checks every 4 hours</li><li>Basic 13 accessibility checks</li>
                    <li>HTML paste only</li><li>Email support</li>
                  </ul>
                  <div className="current-plan-badge" id="free-plan-badge">Your Current Plan</div>
                  <button type="button" className="pricing-btn btn-outline" id="select-free-plan"
                          onClick={() => (window as Window & typeof globalThis & { selectPlan?: (p: string) => void }).selectPlan?.('free')}>
                    Get Started
                  </button>
                </article>

                <article className="pricing-card featured" aria-labelledby="sp-tier-pro">
                  <div className="popular-badge" aria-label="Most popular plan">Most Popular</div>
                  <div className="card-header">
                    <h3 id="sp-tier-pro">Pro</h3>
                    <div className="price-display">
                      <span className="price-amount">$4.75</span><span className="price-period">/month</span>
                    </div>
                    <div className="price-was" aria-label="Regular price $19 per month">
                      <span className="price-was-amount">$19</span>
                      <span className="beta-discount-badge">75% off</span>
                    </div>
                  </div>
                  <ul className="feature-list" aria-label="Pro tier features">
                    <li>Unlimited page checks</li><li>All 13 accessibility checks</li>
                    <li>URL checking enabled</li><li>Batch checking (multiple pages)</li>
                    <li>Priority email support</li><li>Downloadable PDF reports</li>
                  </ul>
                  <div className="current-plan-badge" id="pro-plan-badge" hidden>Your Current Plan</div>
                  <button type="button" className="pricing-btn btn-primary" id="select-pro-plan"
                          data-checkout="pro">
                    Start Free Trial
                  </button>
                </article>

                <article className="pricing-card" aria-labelledby="sp-tier-enterprise">
                  <div className="card-header">
                    <h3 id="sp-tier-enterprise">Enterprise</h3>
                    <div className="price-display">
                      <span className="price-amount price-custom">Custom</span><span className="price-period" style={{whiteSpace:'nowrap'}}>pricing</span>
                    </div>
                    <div className="price-was" aria-label="Beta discount applied">
                      <span className="beta-discount-badge">75% off at launch</span>
                    </div>
                  </div>
                  <ul className="feature-list" aria-label="Enterprise tier features">
                    <li>Everything in Pro</li><li>API access</li><li>Team collaboration</li>
                    <li>Custom rules</li><li>Dedicated account manager</li><li>SLA guarantee</li>
                  </ul>
                  <div className="current-plan-badge" id="ent-plan-badge" hidden>Your Current Plan</div>
                  <button type="button" className="pricing-btn btn-outline" id="select-enterprise-plan"
                          data-checkout="enterprise">
                    Contact Sales
                  </button>
                </article>

              </div>
              <p className="panel-pricing-note">All plans include WCAG 2.1 compliance checks. No credit card required for Free tier.</p>
            </section>

            {/* PROFILE */}
            <section className="settings-panel" id="panel-profile" aria-labelledby="panel-profile-title">
              <h2 className="panel-title" id="panel-profile-title">Profile</h2>
              <p className="panel-subtitle">Account, billing, security, and legal.</p>

              <div className="profile-sub-layout">
                {/* Inner sidebar */}
                <nav className="profile-sub-sidebar" aria-label="Profile sections">
                  <ul className="profile-sub-nav" role="list">
                    <li>
                      <button className="profile-sub-nav-item" data-sub-panel="account">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        Account
                      </button>
                    </li>
                    <li>
                      <button className="profile-sub-nav-item" data-sub-panel="payment-history">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        Payment History
                      </button>
                    </li>
                    <li>
                      <button className="profile-sub-nav-item" data-sub-panel="security">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Security
                      </button>
                    </li>
                    <li>
                      <button className="profile-sub-nav-item" data-sub-panel="privacy">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Privacy Policy
                      </button>
                    </li>
                    <li>
                      <button className="profile-sub-nav-item" data-sub-panel="terms">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        Terms of Use
                      </button>
                    </li>
                  </ul>
                </nav>

                {/* Inner content */}
                <div className="profile-sub-content">
                  <div className="profile-sub-placeholder" id="profile-sub-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    <p>Select a section from the left</p>
                  </div>

                  {/* Account */}
                  <div className="profile-sub-panel" id="sub-panel-account">
                    <div className="settings-card profile-identity-card">
                      <div className="profile-avatar-circle" aria-hidden="true"><span id="profile-avatar-initials">?</span></div>
                      <div className="profile-identity-info">
                        <div className="profile-identity-name" id="profile-identity-name">—</div>
                        <div className="profile-identity-email" id="profile-email-display" />
                        <div className="profile-identity-meta">
                          <span className="current-plan-badge" id="profile-plan-badge">Free Plan</span>
                          <span className="profile-identity-since" id="profile-member-since" />
                        </div>
                      </div>
                    </div>
                    <div className="settings-card" style={{ marginTop: '1rem' }}>
                      <p className="panel-section-title">Display Name</p>
                      <p className="panel-section-desc">Shown in your profile. Not your login email.</p>
                      <div className="form-group">
                        <label htmlFor="profile-display-name" className="sr-only">Display name</label>
                        <input type="text" id="profile-display-name" className="custom-rule-input" placeholder="Your name" autoComplete="name" />
                      </div>
                      <button type="button" id="save-name-btn" className="settings-save-btn" style={{ marginTop: '.75rem' }}>Save Name</button>
                      <p id="save-name-msg" className="form-msg form-msg--success" style={{ display: 'none' }} />
                    </div>
                    <div className="settings-card" style={{ marginTop: '1rem' }}>
                      <p className="panel-section-title">Your Plan</p>
                      <div className="profile-plan-row">
                        <div>
                          <div className="profile-plan-name" id="profile-plan-name">Free</div>
                          <div className="profile-plan-desc" id="profile-plan-desc">10 checks every 4 hours · Basic accessibility checks</div>
                        </div>
                        <a href="/pricing" className="profile-upgrade-btn" id="profile-upgrade-link">Upgrade</a>
                      </div>
                    </div>
                  </div>

                  {/* Payment History */}
                  <div className="profile-sub-panel" id="sub-panel-payment-history">
                    <p className="panel-section-title" style={{ marginBottom: '.75rem' }}>Payment History</p>
                    <div id="invoices-demo-banner" className="profile-demo-banner" style={{ display: 'none' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Sample data — you don&rsquo;t have any paid invoices yet. This is what your history will look like once you subscribe.
                    </div>
                    <div className="settings-card">
                      <div id="invoices-loading" className="profile-loading-row" aria-live="polite">
                        <div className="profile-spinner" aria-hidden="true" />
                        Loading invoices…
                      </div>
                      <p id="invoices-empty" className="history-empty" style={{ display: 'none' }}>No invoices found. Invoices appear here after your first paid subscription.</p>
                      <div id="invoices-header" className="invoices-header" style={{ display: 'none' }}>
                        <span>Date</span><span>Description</span><span>Amount</span><span>Status</span><span></span>
                      </div>
                      <div id="invoices-list" className="invoices-list" aria-live="polite" />
                    </div>
                    <p className="profile-billing-note">Billing is managed through Stripe. For refund requests contact{' '}
                      <a href="mailto:billing@adachecker.io" className="policy-link">billing@adachecker.io</a>.
                    </p>
                  </div>

                  {/* Security */}
                  <div className="profile-sub-panel" id="sub-panel-security">
                    <div className="settings-card">
                      <p className="panel-section-title">Change Password</p>
                      <p className="panel-section-desc">At least 8 characters, one uppercase letter, and one number.</p>
                      <form id="change-password-form" noValidate>
                        <div className="form-group">
                          <label htmlFor="current-password">Current Password</label>
                          <input type="password" id="current-password" autoComplete="current-password" placeholder="Your current password" required />
                        </div>
                        <div className="form-group" style={{ marginTop: '.75rem' }}>
                          <label htmlFor="new-password">New Password</label>
                          <input type="password" id="new-password" autoComplete="new-password" placeholder="Min 8 chars, 1 uppercase, 1 number" required />
                          <div id="password-strength-bar" className="password-strength-bar" aria-hidden="true">
                            <div id="password-strength-fill" className="password-strength-fill" />
                          </div>
                          <span id="password-strength-label" className="password-strength-label" />
                        </div>
                        <div className="form-group" style={{ marginTop: '.75rem' }}>
                          <label htmlFor="confirm-password">Confirm New Password</label>
                          <input type="password" id="confirm-password" autoComplete="new-password" placeholder="Repeat new password" required />
                        </div>
                        <p id="change-password-msg" className="form-msg" style={{ display: 'none' }} />
                        <button type="submit" id="change-password-btn" className="settings-save-btn" style={{ marginTop: '1rem' }}>Update Password</button>
                      </form>
                    </div>
                    <div className="settings-card" style={{ marginTop: '1rem' }}>
                      <p className="panel-section-title">Active Session</p>
                      <div className="session-row">
                        <div className="session-icon" aria-hidden="true">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        </div>
                        <div className="session-info">
                          <div className="session-device" id="session-device">This browser</div>
                          <div className="session-meta" id="session-meta" />
                        </div>
                        <span className="session-current-badge">Current</span>
                      </div>
                    </div>
                    <div className="settings-card danger-zone" style={{ marginTop: '1rem' }}>
                      <p className="panel-section-title" style={{ color: '#f87171' }}>Danger Zone</p>
                      <div className="danger-row">
                        <div>
                          <div className="danger-title">Delete Account</div>
                          <div className="danger-desc">Permanently delete your account and all associated data. This cannot be undone.</div>
                        </div>
                        <button type="button" id="delete-account-btn" className="danger-btn">Delete Account</button>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Policy */}
                  <div className="profile-sub-panel" id="sub-panel-privacy">
                    <div className="settings-card policy-card">
                      <h3>Information We Collect</h3>
                      <p>We collect your email address when you create an account. Payment information is handled securely by Stripe — we do not store card details.</p>
                      <h3>How We Use Your Information</h3>
                      <p>Your email is used to authenticate your account and send important service updates. Accessibility check results may be stored to power your check history.</p>
                      <h3>Data Storage</h3>
                      <p>Account data is stored securely in our database. Display name and preferences are stored locally in your browser and never sent to our servers.</p>
                      <h3>Third-Party Services</h3>
                      <p>We use <strong>Stripe</strong> for payment processing and <strong>Vercel</strong> for hosting, each under their own privacy policy.</p>
                      <h3>Your Rights</h3>
                      <p>You may request deletion of your account at any time by contacting us.</p>
                      <h3>Contact</h3>
                      <p>Questions? <a href="mailto:privacy@adachecker.io" className="policy-link">privacy@adachecker.io</a></p>
                    </div>
                  </div>

                  {/* Terms of Use */}
                  <div className="profile-sub-panel" id="sub-panel-terms">
                    <div className="settings-card policy-card">
                      <h3>Acceptance of Terms</h3>
                      <p>By using ADA Checker you agree to these terms. If you do not agree, please discontinue use.</p>
                      <h3>Use of the Service</h3>
                      <p>Results are informational and do not constitute legal advice or a guarantee of compliance.</p>
                      <h3>Account Responsibilities</h3>
                      <p>You are responsible for maintaining the confidentiality of your credentials and all activity under your account.</p>
                      <h3>Acceptable Use</h3>
                      <p>You may not check pages you don&rsquo;t own or have permission to audit, reverse-engineer the service, or use it for unlawful purposes.</p>
                      <h3>Paid Plans</h3>
                      <p>Subscriptions are billed monthly through Stripe. You may cancel at any time; access continues until the billing period ends.</p>
                      <h3>Limitation of Liability</h3>
                      <p>ADA Checker is provided &ldquo;as is&rdquo; without warranties. We are not liable for damages arising from use of the service.</p>
                      <h3>Contact</h3>
                      <p>Questions? <a href="mailto:legal@adachecker.io" className="policy-link">legal@adachecker.io</a></p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CHECK HISTORY */}
            <section className="settings-panel" id="panel-history" aria-labelledby="panel-history-title">
              <h2 className="panel-title" id="panel-history-title">Check History</h2>
              <p className="panel-subtitle">A record of your recent accessibility checks.</p>
              <div className="settings-card history-card">
                <div id="history-list" aria-live="polite">
                  <p className="history-empty">No checks recorded yet. Run an accessibility check to see your history here.</p>
                </div>
              </div>
              <button type="button" className="clear-history-btn" id="clear-history-btn">Clear All History</button>
            </section>

            {/* TEXT & FONT */}
            <section className="settings-panel" id="panel-text-font" aria-labelledby="panel-text-font-title">
              <h2 className="panel-title" id="panel-text-font-title">Text &amp; Font</h2>
              <p className="panel-subtitle">Adjust text size and font style across all pages.</p>

              <div className="settings-card">
                <p className="panel-section-title">Text Size</p>
                <div className="font-size-options" role="group" aria-label="Choose text size">
                  {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                    <button key={size} className="font-size-option" data-size={size} aria-pressed="false">
                      <span className={`font-size-sample fss-${size}`}>Aa</span>
                      <span className="font-size-label">{size === 'xlarge' ? 'X-Large' : size.charAt(0).toUpperCase() + size.slice(1)}</span>
                    </button>
                  ))}
                </div>
                <p className="preview-label">Size Preview</p>
                <p id="font-size-preview">The quick brown fox jumps over the lazy dog.</p>
              </div>

              <div className="settings-card" style={{ marginTop: '1.25rem' }}>
                <p className="panel-section-title">Font Style</p>
                <div className="font-type-options" role="group" aria-label="Choose font style">
                  {[
                    { key: 'system', name: 'System Default', family: 'system-ui, -apple-system, sans-serif' },
                    { key: 'lexend', name: 'Lexend', family: "'Lexend', system-ui, sans-serif" },
                    { key: 'atkinson', name: 'Atkinson Hyperlegible', family: "'Atkinson Hyperlegible', system-ui, sans-serif" },
                    { key: 'arial', name: 'Arial', family: 'Arial, sans-serif' },
                    { key: 'verdana', name: 'Verdana', family: 'Verdana, sans-serif' },
                    { key: 'comic-sans', name: 'Comic Sans', family: "'Comic Sans MS', 'Comic Sans', cursive" },
                  ].map((f) => (
                    <button key={f.key} className="font-type-option" data-font={f.key} aria-pressed="false" style={{ fontFamily: f.family }}>
                      <span className="font-type-name" style={{ fontFamily: f.family }}>{f.name}</span>
                      <span className="font-type-sample" style={{ fontFamily: f.family }}>The quick brown fox jumps over the lazy dog.</span>
                    </button>
                  ))}
                </div>
                <p className="font-type-tip">
                  Lexend and Atkinson Hyperlegible are designed for readability and are commonly recommended for users with dyslexia or low vision.
                </p>
                <button type="button" id="reset-text-settings" className="reset-text-btn">Reset to Default Settings</button>
              </div>

              <div className="settings-card" style={{ marginTop: '1.25rem' }}>
                <p className="panel-section-title">Brightness</p>
                <p className="panel-subtitle" style={{ marginBottom: '1rem' }}>Adjust how bright or dim the page appears.</p>
                <div className="brightness-control brightness-control--settings">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <input
                    type="range"
                    id="brightness-slider"
                    min={50}
                    max={150}
                    defaultValue={100}
                    aria-label="Adjust page brightness"
                  />
                  <span id="brightness-value">100%</span>
                </div>
              </div>
            </section>

            {/* API ACCESS */}
            <section className="settings-panel" id="panel-api" aria-labelledby="panel-api-title">
              <h2 className="panel-title" id="panel-api-title">API Access</h2>
              <p className="panel-subtitle">Integrate the ADA Checker into your own apps and CI/CD pipelines.</p>
              <div id="api-gate" className="plan-gate" hidden>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <h3>Enterprise Feature</h3>
                <p>API access requires the Enterprise plan.</p>
                <a href="/pricing" className="plan-gate-link">Upgrade to Enterprise</a>
              </div>
              <div id="api-content">
                <div className="settings-card">
                  <p className="panel-section-title">Your API Key</p>
                  <div className="api-key-row">
                    <input type="text" id="api-key-display" className="api-key-input" readOnly aria-label="API key" spellCheck={false} />
                    <button type="button" id="api-key-copy-btn" className="settings-save-btn">Copy</button>
                  </div>
                  <p className="api-key-note">Keep your API key secret. It grants full access to your account&rsquo;s checker.</p>
                </div>
                <div className="settings-card" style={{ marginTop: '1rem' }}>
                  <p className="panel-section-title">Endpoint</p>
                  <code className="api-endpoint">POST https://api.adachecker.io/v1/check</code>
                  <div className="api-docs">
                    <p className="panel-section-title" style={{ marginTop: '1rem' }}>Request</p>
                    <pre className="api-code">{`{\n  "html": "<!DOCTYPE html>...",\n  "level": "AA"\n}`}</pre>
                    <p className="panel-section-title" style={{ marginTop: '1rem' }}>Headers</p>
                    <pre className="api-code">{`Authorization: Bearer <YOUR_API_KEY>\nContent-Type: application/json`}</pre>
                    <p className="panel-section-title" style={{ marginTop: '1rem' }}>Response</p>
                    <pre className="api-code">{`{\n  "score": 82,\n  "level": "AA",\n  "summary": { "total": 3, "critical": 1, "serious": 1, "moderate": 1, "minor": 0 },\n  "violations": [\n    {\n      "ruleId": "img-alt-missing",\n      "severity": "critical",\n      "element": "<img src=\\"banner.png\\">",\n      "message": "Image missing alt text",\n      "remediation": "Add descriptive alt text...",\n      "wcag": "1.1.1 Non-text Content (Level A)"\n    }\n  ]\n}`}</pre>
                  </div>
                </div>
              </div>
            </section>

            {/* CUSTOM RULES */}
            <section className="settings-panel" id="panel-custom-rules" aria-labelledby="panel-custom-rules-title">
              <h2 className="panel-title" id="panel-custom-rules-title">Custom Rules</h2>
              <p className="panel-subtitle">Define your own CSS-selector based checks that run on every accessibility scan.</p>
              <div id="custom-rules-gate" className="plan-gate" hidden>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <h3>Enterprise Feature</h3>
                <p>Custom rules require the Enterprise plan.</p>
                <a href="/pricing" className="plan-gate-link">Upgrade to Enterprise</a>
              </div>
              <div id="custom-rules-content">
                <div className="settings-card">
                  <p className="panel-section-title">Add New Rule</p>
                  <div className="custom-rule-form">
                    <div className="custom-rule-row">
                      <label htmlFor="rule-selector" className="custom-rule-label">CSS Selector</label>
                      <input type="text" id="rule-selector" className="custom-rule-input" placeholder="e.g. blink, marquee, [onclick]" spellCheck={false} />
                    </div>
                    <div className="custom-rule-row">
                      <label htmlFor="rule-message" className="custom-rule-label">Message</label>
                      <input type="text" id="rule-message" className="custom-rule-input" placeholder="e.g. Avoid <blink> — causes seizures" />
                    </div>
                    <div className="custom-rule-row">
                      <label htmlFor="rule-severity" className="custom-rule-label">Severity</label>
                      <select id="rule-severity" className="wcag-level-select" style={{ width: '100%' }}>
                        <option value="critical">Critical</option>
                        <option value="serious">Serious</option>
                        <option value="moderate" defaultValue="moderate">Moderate</option>
                        <option value="minor">Minor</option>
                      </select>
                    </div>
                    <div className="custom-rule-row">
                      <label htmlFor="rule-remediation" className="custom-rule-label">How to fix (optional)</label>
                      <input type="text" id="rule-remediation" className="custom-rule-input" placeholder="e.g. Remove the element and use CSS animations instead" />
                    </div>
                    <button type="button" id="add-rule-btn" className="settings-save-btn" style={{ marginTop: '.5rem' }}>Add Rule</button>
                  </div>
                </div>
                <div className="settings-card" style={{ marginTop: '1rem' }}>
                  <p className="panel-section-title">Active Rules</p>
                  <ul id="custom-rules-list" className="custom-rules-list" />
                  <p id="custom-rules-empty" className="history-empty">No custom rules defined yet.</p>
                </div>
              </div>
            </section>

            {/* TEAM */}
            <section className="settings-panel" id="panel-team" aria-labelledby="panel-team-title">
              <h2 className="panel-title" id="panel-team-title">Team Collaboration</h2>
              <p className="panel-subtitle">Share checks and manage accessibility across your organization.</p>
              <div className="team-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <h3>Coming Soon</h3>
                <p>Team collaboration is an Enterprise feature currently in development. Once live you&rsquo;ll be able to:</p>
                <ul className="team-feature-list">
                  <li>Invite teammates to your workspace</li>
                  <li>Share and comment on accessibility reports</li>
                  <li>Assign violations to developers</li>
                  <li>Track remediation progress across your site</li>
                </ul>
                <a href="/pricing" className="plan-gate-link" style={{ marginTop: '1.5rem' }}>View Enterprise Plan</a>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />

      <Script src="/js/auth.js?v=5" strategy="afterInteractive" />
      <Script src="/js/settings.js?v=2" strategy="afterInteractive" />
    </>
  );
}
