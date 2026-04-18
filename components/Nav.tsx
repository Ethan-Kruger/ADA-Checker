'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AuthModal from './AuthModal';

interface User {
  id: string;
  email: string;
}

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Determine current page for active nav link and hamburger link hiding
  const page = pathname === '/' ? 'checker' : pathname.slice(1).split('/')[0];

  useEffect(() => {
    const saved = parseInt(localStorage.getItem('ada-brightness') || '100', 10);
    setBrightness(saved);
    if (saved !== 100) {
      document.documentElement.style.filter = `brightness(${saved / 100})`;
    }

    try {
      const raw = localStorage.getItem('ada-user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  function handleBrightness(val: number) {
    setBrightness(val);
    document.documentElement.style.filter = val === 100 ? '' : `brightness(${val / 100})`;
    localStorage.setItem('ada-brightness', String(val));
  }

  function logout() {
    localStorage.removeItem('ada-token');
    localStorage.removeItem('ada-user');
    localStorage.setItem('ada-plan', 'free');
    setUser(null);
    setProfileOpen(false);
    window.location.reload();
  }

  const navLinks = [
    { href: '/', label: 'Checker', key: 'checker' },
    { href: '/pricing', label: 'Pricing', key: 'pricing' },
    { href: '/settings', label: 'Settings', key: 'settings' },
  ];

  return (
    <>
      <nav className="site-nav" aria-label="Site navigation">
        <Link href="/" className="nav-logo" aria-label="ADA Checker — home">
          <Image src="/images/logo.svg" alt="" aria-hidden width={32} height={32} />
          <span className="nav-brand">ADA Checker</span>
        </Link>

        <div className="nav-links" aria-label="Main navigation">
          {navLinks.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={`nav-link${page === l.key ? ' active' : ''}`}
              id={`desktop-nav-${l.key}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hamburger-wrapper" id="hamburger-wrapper" ref={wrapperRef}>
          {/* Auth widget */}
          {user ? (
            <div
              className={`nav-profile-bubble${profileOpen ? ' is-open' : ''}`}
              ref={profileRef}
              aria-label={`Account: ${user.email}`}
              title={user.email}
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setProfileOpen((o) => !o); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setProfileOpen((o) => !o); }}
            >
              {user.email[0].toUpperCase()}
              <div className="nav-profile-menu" onClick={(e) => e.stopPropagation()}>
                <span className="nav-profile-email">{user.email}</span>
                <Link href="/settings" className="nav-profile-edit" onClick={() => setProfileOpen(false)}>
                  Edit Profile
                </Link>
                <button className="nav-profile-signout" onClick={logout}>Sign out</button>
              </div>
            </div>
          ) : (
            <button
              className="nav-signup-btn"
              onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
            >
              Sign Up
            </button>
          )}

          <button
            className="hamburger-btn"
            id="hamburger-btn"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="currentColor" aria-hidden="true">
              <rect width="20" height="2" rx="1" />
              <rect y="6" width="20" height="2" rx="1" />
              <rect y="12" width="20" height="2" rx="1" />
            </svg>
          </button>

          <div
            className={`hamburger-dropdown${menuOpen ? ' is-open' : ''}`}
            id="hamburger-dropdown"
            role="menu"
            aria-label="Site menu"
          >
            {navLinks
              .filter((l) => l.key !== page)
              .map((l) => (
                <Link
                  key={l.key}
                  href={l.href}
                  className="hamburger-menu-item"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            <hr className="dropdown-divider" />
            <div className="brightness-control">
              <label htmlFor="brightness-slider">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                Brightness
              </label>
              <input
                type="range"
                id="brightness-slider"
                min={50}
                max={150}
                value={brightness}
                aria-label="Adjust page brightness"
                onChange={(e) => handleBrightness(parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        </div>
      </nav>

      {showAuthModal && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => {
            setUser(u);
            setShowAuthModal(false);
          }}
        />
      )}
    </>
  );
}

