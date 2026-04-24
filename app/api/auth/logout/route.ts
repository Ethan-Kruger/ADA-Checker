import { NextResponse } from 'next/server';
import { buildClearCookie } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', buildClearCookie());
  return res;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
