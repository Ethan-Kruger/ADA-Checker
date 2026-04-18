'use client';

export default function Footer() {
  return (
    <footer className="site-footer">
      <nav className="footer-links" aria-label="Footer navigation">
        <button onClick={() => alert('About page coming soon!')}>About</button>
        <button onClick={() => alert('Privacy page coming soon!')}>Privacy</button>
        <button onClick={() => alert('Terms page coming soon!')}>Terms</button>
        <button onClick={() => alert('Contact page coming soon!')}>Contact</button>
      </nav>
      <p className="footer-copy">&copy; 2026 ADA Checker</p>
    </footer>
  );
}
