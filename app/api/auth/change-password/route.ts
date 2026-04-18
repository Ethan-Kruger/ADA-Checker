import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import supabase from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const { limited } = await rateLimit(req, 'rl:change-password', 5, 15 * 60 * 1000);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait and try again.' },
      { status: 429 }
    );
  }

  let payload;
  try {
    payload = requireAuth(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Current password and new password are required' },
      { status: 400 }
    );
  }
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'New password must be at least 8 characters' },
      { status: 400 }
    );
  }
  if (!/[A-Z]/.test(newPassword)) {
    return NextResponse.json(
      { error: 'New password must contain at least one uppercase letter' },
      { status: 400 }
    );
  }
  if (!/[0-9]/.test(newPassword)) {
    return NextResponse.json(
      { error: 'New password must contain at least one number' },
      { status: 400 }
    );
  }

  const { data: user } = await supabase
    .from('users')
    .select('id, password_hash')
    .eq('id', payload.sub)
    .single();

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  const password_hash = await bcrypt.hash(newPassword, 12);

  const { error: updateErr } = await supabase
    .from('users')
    .update({ password_hash })
    .eq('id', user.id);

  if (updateErr) {
    console.error('change-password update error:', updateErr.message);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
