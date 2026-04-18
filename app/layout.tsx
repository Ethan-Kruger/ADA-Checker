import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import AuthGate from '@/components/AuthGate';
import { authGateEnabled, bannerMessage } from '@/lib/flags';
import './globals.css';

export const metadata: Metadata = {
  title: 'ADA Accessibility Checker',
  description: 'Check any HTML for WCAG 2.1 violations — runs entirely in your browser.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [gateEnabled, banner] = await Promise.all([authGateEnabled(), bannerMessage()]);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Apply font + font-size prefs before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var f=localStorage.getItem('ada-font')||'system';var s=localStorage.getItem('ada-font-size')||'medium';document.documentElement.setAttribute('data-font',f);document.documentElement.setAttribute('data-font-size',s);var b=parseInt(localStorage.getItem('ada-brightness')||'100',10);if(b!==100)document.documentElement.style.filter='brightness('+(b/100)+')';})();`,
          }}
        />
      </head>
      <body>
        {/* Skip link rendered before AuthGate so it is always server-rendered
            and is the first focusable element regardless of auth state */}
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AuthGate enabled={gateEnabled} banner={banner}>
          {children}
        </AuthGate>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
