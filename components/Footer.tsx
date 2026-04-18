'use client';

export default function Footer() {
  return (
    <footer className="site-footer">
      <nav className="footer-links" aria-label="Footer navigation">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="#" onClick={(e) => { e.preventDefault(); alert('About page coming soon!'); }}>About</a>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('Privacy page coming soon!'); }}>Privacy</a>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('Terms page coming soon!'); }}>Terms</a>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('Contact page coming soon!'); }}>Contact</a>
      </nav>
      <p className="footer-copy">&copy; 2026 ADA Checker</p>
    </footer>
  );
}
