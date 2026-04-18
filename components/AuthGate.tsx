'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AuthModal from './AuthModal';

interface User {
  id: string;
  email: string;
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ada-user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setChecked(true);
  }, []);

  // Avoid flash of wrong content during hydration
  if (!checked) return null;

  if (!user) {
    return (
      <>
        <main className="welcome-gate" id="main-content">
          <div className="welcome-hero">
            <div className="welcome-logo-wrap">
              <Image src="/images/logo.svg" alt="" aria-hidden width={56} height={56} />
              <span className="welcome-brand">ADA Checker</span>
            </div>

            <h1 className="welcome-headline">
              Make the Web Accessible<br />for Everyone
            </h1>
            <p className="welcome-sub">
              Check any HTML for WCAG&nbsp;2.1 accessibility violations — free, instant,
              and entirely in your browser. No data ever leaves your device.
            </p>

            <div className="welcome-actions">
              <button
                className="welcome-cta-primary"
                onClick={() => { setAuthMode('signup'); setShowModal(true); }}
              >
                Create Free Account
              </button>
              <button
                className="welcome-cta-secondary"
                onClick={() => { setAuthMode('login'); setShowModal(true); }}
              >
                Sign In
              </button>
            </div>
          </div>

          <div className="welcome-features" aria-label="Features">
            <div className="welcome-feature">
              <div className="welcome-feature-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="welcome-feature-title">WCAG 2.1 Compliant</h2>
              <p className="welcome-feature-desc">
                Checks against Level A, AA, and AAA criteria including images, forms,
                headings, color contrast, ARIA, and more.
              </p>
            </div>

            <div className="welcome-feature">
              <div className="welcome-feature-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="welcome-feature-title">Private &amp; Secure</h2>
              <p className="welcome-feature-desc">
                All checks run locally in your browser. Your HTML is never uploaded
                to any server.
              </p>
            </div>

            <div className="welcome-feature">
              <div className="welcome-feature-icon" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h2 className="welcome-feature-title">Instant Results</h2>
              <p className="welcome-feature-desc">
                Get a scored accessibility report with actionable fixes in seconds,
                not minutes.
              </p>
            </div>
          </div>
        </main>

        {showModal && (
          <AuthModal
            initialMode={authMode}
            onClose={() => setShowModal(false)}
            onSuccess={(u) => {
              setUser(u);
              setShowModal(false);
            }}
          />
        )}
      </>
    );
  }

  return <>{children}</>;
}
