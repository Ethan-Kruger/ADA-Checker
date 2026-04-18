import { flag } from 'flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';

export const authGateEnabled = flag<boolean>({
  key: 'auth-gate-enabled',
  adapter: vercelAdapter(),
  defaultValue: true,
  description: 'Require users to sign in before accessing the app.',
  options: [
    { value: true,  label: 'Enabled'  },
    { value: false, label: 'Disabled' },
  ],
});

export const bannerMessage = flag<string>({
  key: 'banner-message',
  adapter: vercelAdapter(),
  defaultValue: '',
  description: 'Announcement text shown in the top banner. Empty = hidden.',
  options: [{ value: '', label: 'Hidden' }],
});
