'use client';

export default function Footer() {
  return (
    <footer className="site-footer">
      <nav className="footer-links" aria-label="Footer navigation">
        <button disabled aria-disabled="true" title="Coming soon">About</button>
        <button disabled aria-disabled="true" title="Coming soon">Privacy</button>
        <button disabled aria-disabled="true" title="Coming soon">Terms</button>
        <button disabled aria-disabled="true" title="Coming soon">Contact</button>
      </nav>
      <p className="footer-copy">&copy; 2026 ADA Checker</p>
    </footer>
  );
}
