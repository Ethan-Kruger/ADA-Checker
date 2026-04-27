import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email_verified, verification_token_expires_at')
    .eq('verification_token', token)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid or expired verification link', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (user.email_verified) {
    return NextResponse.redirect(new URL('/?verified=already', req.nextUrl.origin));
  }

  if (new Date(user.verification_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Verification link has expired. Request a new one.', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  await supabase
    .from('users')
    .update({
      email_verified: true,
      verification_token: null,
      verification_token_expires_at: null,
    })
    .eq('id', user.id);

  return NextResponse.redirect(new URL('/?verified=true', req.nextUrl.origin));
}
