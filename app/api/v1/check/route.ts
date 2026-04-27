import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import supabase from '@/lib/supabase';
import { rateLimit } from '@/lib/rateLimit';
import { runCheck } from '@/lib/checker-node';

// Rate limits per plan (requests per hour)
const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  pro:        { max: 60,   windowMs: 60 * 60 * 1000 },
  enterprise: { max: 1000, windowMs: 60 * 60 * 1000 },
};

const VALID_LEVELS = new Set(['A', 'AA', 'AAA']);

export async function POST(req: NextRequest) {
  // ── Extract Bearer key ─────────────────────────────────────────────────────
  const auth = req.headers.get('authorization') ?? '';
  const rawKey = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

  if (!rawKey.startsWith('ada_sk_')) {
    return NextResponse.json(
      { error: 'Missing or invalid API key. Set Authorization: Bearer ada_sk_...' },
      { status: 401 }
    );
  }

  // ── Look up key by prefix, then bcrypt compare ─────────────────────────────
  const prefix = rawKey.slice(0, 15);
  const { data: candidates } = await supabase
    .from('api_keys')
    .select('id, user_id, key_hash')
    .eq('key_prefix', prefix);

  let keyId: string | null = null;
  let userId: string | null = null;

  for (const candidate of candidates ?? []) {
    if (await bcrypt.compare(rawKey, candidate.key_hash as string)) {
      keyId  = candidate.id as string;
      userId = candidate.user_id as string;
      break;
    }
  }

  if (!keyId || !userId) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  // ── Check plan ─────────────────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .single();

  const plan = sub?.plan ?? 'free';
  const limits = RATE_LIMITS[plan];

  if (!limits) {
    return NextResponse.json(
      { error: 'API access requires Pro or Enterprise plan' },
      { status: 403 }
    );
  }

  // ── Rate limit per key ─────────────────────────────────────────────────────
  const { limited } = await rateLimit(req, `rl:v1:${keyId}`, limits.max, limits.windowMs);
  if (limited) {
    return NextResponse.json(
      { error: `Rate limit exceeded. ${plan} plan allows ${limits.max} requests/hour.` },
      { status: 429 }
    );
  }

  // ── Parse and validate body ────────────────────────────────────────────────
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  const html      = typeof body.html      === 'string' ? body.html      : '';
  const level     = typeof body.level     === 'string' ? body.level.toUpperCase() : 'AA';
  const threshold = typeof body.threshold === 'number' ? body.threshold : 80;

  if (!html) {
    return NextResponse.json({ error: '"html" field is required' }, { status: 400 });
  }
  if (html.length > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'HTML must be under 5 MB' }, { status: 400 });
  }
  if (!VALID_LEVELS.has(level)) {
    return NextResponse.json({ error: 'level must be "A", "AA", or "AAA"' }, { status: 400 });
  }

  // ── Run check ─────────────────────────────────────────────────────────────
  const result = runCheck(html, level);

  // Update last_used_at (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyId)
    .then(() => {});

  return NextResponse.json({
    score:      result.score,
    level,
    passed:     result.score >= threshold,
    threshold,
    summary:    result.summary,
    violations: result.violations,
  });
}
