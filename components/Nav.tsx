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
