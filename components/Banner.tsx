import { bannerMessage } from '@/lib/flags';

export default async function Banner() {
  const message = await bannerMessage();
  if (!message) return null;

  return (
    <div className="site-banner" role="status" aria-live="polite">
      <span className="site-banner-text">{message}</span>
    </div>
  );
}
