import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import supabase from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

const MAX_KEYS = 5;
const ALLOWED_PLANS = new Set(['pro', 'enterprise']);

async function getPlan(userId: string): Promise<string> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .single();
  return data?.plan ?? 'free';
}

export async function GET(req: NextRequest) {
  let payload;
  try { payload = requireAuth(req); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ALLOWED_PLANS.has(await getPlan(payload.sub))) {
    return NextResponse.json({ error: 'Pro or Enterprise plan required' }, { status: 403 });
  }

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, key_prefix, name, created_at, last_used_at')
    .eq('user_id', payload.sub)
    .order('created_at', { ascending: false });

  return NextResponse.json({ keys: keys ?? [] });
}

export async function POST(req: NextRequest) {
  let payload;
  try { payload = requireAuth(req); } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ALLOWED_PLANS.has(await getPlan(payload.sub))) {
    return NextResponse.json({ error: 'Pro or Enterprise plan required' }, { status: 403 });
  }

  const { count } = await supabase
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', payload.sub);

  if ((count ?? 0) >= MAX_KEYS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_KEYS} API keys allowed. Revoke an existing key first.` },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 50) || 'Default' : 'Default';

  // Generate: ada_sk_ + 40 random hex chars
  const rawKey   = 'ada_sk_' + crypto.randomBytes(20).toString('hex');
  const keyPrefix = rawKey.slice(0, 15); // 'ada_sk_' + 8 chars
  const keyHash  = await bcrypt.hash(rawKey, 12);

  const { data: newKey, error } = await supabase
    .from('api_keys')
    .insert({ user_id: payload.sub, key_prefix: keyPrefix, key_hash: keyHash, name })
    .select('id, key_prefix, name, created_at')
    .single();

  if (error || !newKey) {
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }

  // Return the full key exactly once — not stored, cannot be retrieved again
  return NextResponse.json({ ...newKey, key: rawKey }, { status: 201 });
}
