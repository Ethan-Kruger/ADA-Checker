import { NextRequest, NextResponse } from 'next/server';
import { verifyAccess, type ApiData } from '@vercel/flags';
import { getProviderData } from '@vercel/flags/next';
import { bannerMessage, authGateEnabled } from '@/lib/flags';

export async function GET(request: NextRequest) {
  const access = await verifyAccess(request.headers.get('Authorization'));
  if (!access) return NextResponse.json(null, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: ApiData = getProviderData({ bannerMessage, authGateEnabled } as any);
  return NextResponse.json<ApiData>(data);
}
