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
  const [user, setUser] = useState<User | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const profileRef = useRef<HTMLDivElement>(null);

  const page = pathname === '/' ? 'checker' : pathname.slice(1).split('/')[0];

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ada-user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') setProfileOpen(false);
    }
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  async function logout() {
    localStorage.removeItem('ada-user');
    localStorage.setItem('ada-plan', 'free');
    setUser(null);
    setProfileOpen(false);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // Best-effort — reload regardless
    }
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
          <span className="nav-brand">ADA Checker<span className="nav-beta">BETA</span></span>
        </Link>

        <div className="nav-links">
          {navLinks.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className={`nav-link${page === l.key ? ' active' : ''}`}
              aria-current={page === l.key ? 'page' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="nav-auth">
          {user ? (
            <div
              className={`nav-profile-bubble${profileOpen ? ' is-open' : ''}`}
              ref={profileRef}
              aria-label={`Account: ${user.email}`}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setProfileOpen((o) => !o); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setProfileOpen((o) => !o); }}
            >
              {user.email[0].toUpperCase()}
              <div className="nav-profile-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                <span className="nav-profile-email">{user.email}</span>
                <Link href="/settings" className="nav-profile-edit" role="menuitem" onClick={() => setProfileOpen(false)}>
                  Edit Profile
                </Link>
                <button className="nav-profile-signout" role="menuitem" onClick={logout}>Sign out</button>
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
