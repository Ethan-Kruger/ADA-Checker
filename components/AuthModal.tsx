'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthModalProps {
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ initialMode, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode === 'signup' ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${mode === 'signup' ? 'Signup' : 'Login'} failed`);
      localStorage.setItem('ada-token', data.token);
      localStorage.setItem('ada-user', JSON.stringify(data.user));
      localStorage.setItem('ada-plan', data.plan || 'free');
      onSuccess(data.user);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <div
      className="ada-auth-modal is-open"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ada-auth-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ada-auth-box">
        <button className="ada-auth-close" onClick={onClose} aria-label="Close">&times;</button>
        <h2 className="ada-auth-title" id="ada-auth-title">
          {isSignup ? 'Create account' : 'Sign in'}
        </h2>
        {error && <p className="ada-auth-error">{error}</p>}
        <form id="ada-auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="ada-email">Email</label>
          <input
            id="ada-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="ada-password">Password</label>
          <input
            id="ada-password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder="Min 8 characters"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="ada-auth-btn" disabled={loading}>
            {loading
              ? isSignup ? 'Creating account…' : 'Signing in…'
              : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <p className="ada-auth-switch">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button
            className="ada-auth-link"
            onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); }}
          >
            {isSignup ? 'Sign in instead' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}
