import type { Metadata } from 'next';
import Script from 'next/script';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Pricing – ADA Accessibility Checker',
};

export default function PricingPage() {
  return (
    <>
      <Nav />

      <main id="main-content">
        <div className="pricing-hero">
          <h1>Simple, Transparent Pricing</h1>
          <p>Start for free. Upgrade when you need more.</p>
          <div className="beta-banner" role="note">
            <span className="beta-badge">Beta</span>
            Early access pricing — <strong>75% off</strong> for beta users. Lock in your rate before we launch.
          </div>
        </div>

        <div className="pricing-grid">
          {/* Free tier */}
          <article className="pricing-card" aria-labelledby="tier-free">
            <div className="card-header">
              <h2 id="tier-free">Free</h2>
              <div className="price-display">
                <span className="price-amount">$0</span>
                <span className="price-period">/month</span>
              </div>
            </div>
            <ul className="feature-list" aria-label="Free tier features">
              <li>10 checks every 4 hours</li>
              <li>Basic 13 accessibility checks</li>
              <li>HTML paste only</li>
              <li>Email support</li>
            </ul>
            <a href="/" className="pricing-btn btn-outline" aria-label="Get started with the Free plan">Get Started</a>
          </article>

          {/* Pro tier (featured) */}
          <article className="pricing-card featured" aria-labelledby="tier-pro">
            <div className="popular-badge" aria-label="Most popular plan">Most Popular</div>
            <div className="card-header">
              <h2 id="tier-pro">Pro</h2>
              <div className="price-display">
                <span className="price-amount">$4.75</span>
                <span className="price-period">/month</span>
              </div>
              <div className="price-was" aria-label="Regular price $19 per month">
                <span className="price-was-amount">$19</span>
                <span className="beta-discount-badge">75% off</span>
              </div>
            </div>
            <ul className="feature-list" aria-label="Pro tier features">
              <li>Unlimited page checks</li>
              <li>All 13 accessibility checks</li>
              <li>URL checking enabled</li>
              <li>Batch checking (multiple pages)</li>
              <li>Priority email support</li>
              <li>Downloadable PDF reports</li>
            </ul>
            <button type="button" className="pricing-btn btn-primary" data-checkout="pro" aria-label="Get started with the Pro plan">
              Get Started
            </button>
          </article>

          {/* Enterprise tier */}
          <article className="pricing-card" aria-labelledby="tier-enterprise">
            <div className="card-header">
              <h2 id="tier-enterprise">Enterprise</h2>
              <div className="price-display">
                <span className="price-amount price-custom">Custom</span>
                <span className="price-period">pricing</span>
              </div>
              <div className="price-was" aria-label="Beta discount applied">
                <span className="beta-discount-badge">75% off at launch</span>
              </div>
            </div>
            <ul className="feature-list" aria-label="Enterprise tier features">
              <li>Everything in Pro</li>
              <li>API access</li>
              <li>Team collaboration</li>
              <li>Custom rules</li>
              <li>Dedicated account manager</li>
              <li>SLA guarantee</li>
            </ul>
            <button type="button" className="pricing-btn btn-outline" data-checkout="enterprise" aria-label="Contact sales for the Enterprise plan">
              Contact Sales
            </button>
          </article>
        </div>

        <div className="pricing-note">
          <p>All plans include WCAG 2.1 compliance checks. No credit card required for Free tier. Beta pricing is locked in for the lifetime of your subscription.</p>
        </div>
      </main>

      <Footer />

      <Script src="/js/auth.js?v=6" strategy="afterInteractive" />
    </>
  );
}
