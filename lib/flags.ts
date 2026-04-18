import { flag } from '@vercel/flags/next';
import { kv } from '@vercel/kv';

/** Read a flag value from Vercel KV so it can be changed from the dashboard
 *  without redeploying. Falls back to `defaultValue` if the key is absent
 *  or KV is unavailable. */
async function kvFlag<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const val = await kv.get<T>(`flag:${key}`);
    return val ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/** Announcement banner shown at the top of every page.
 *  Set `flag:banner-message` in Vercel KV to any string to show it.
 *  Delete the key (or set it to "") to hide it — no redeploy needed. */
export const bannerMessage = flag<string>({
  key: 'banner-message',
  defaultValue: '',
  description: 'Announcement text shown in the top banner. Empty = hidden.',
  options: [{ value: '', label: 'Hidden' }],
  decide: () => kvFlag('banner-message', ''),
});

/** Auth gate toggle.
 *  Set `flag:auth-gate-enabled` in Vercel KV to false to open the app
 *  without a login requirement — useful for demos or debugging. */
export const authGateEnabled = flag<boolean>({
  key: 'auth-gate-enabled',
  defaultValue: true,
  description: 'Require users to sign in before accessing the app.',
  options: [
    { value: true,  label: 'Enabled'  },
    { value: false, label: 'Disabled' },
  ],
  decide: () => kvFlag('auth-gate-enabled', true),
});
