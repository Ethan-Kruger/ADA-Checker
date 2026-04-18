import { createFlagsDiscoveryEndpoint, getProviderData } from 'flags/next';
import { authGateEnabled, bannerMessage } from '@/lib/flags';

export const GET = createFlagsDiscoveryEndpoint(async () => {
  return getProviderData({ authGateEnabled, bannerMessage });
});
