-- ── Users ────────────────────────────────────────────────────────────────────
create table if not exists users (
  id               uuid primary key default gen_random_uuid(),
  email            text unique not null,
  password_hash    text not null,
  created_at       timestamptz default now()
);

-- ── Subscriptions ─────────────────────────────────────────────────────────────
-- One row per user. plan starts as 'free' and is updated by the Stripe webhook.
create table if not exists subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references users(id) on delete cascade unique,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  plan                     text not null default 'free',   -- 'free' | 'pro' | 'enterprise'
  status                   text not null default 'active', -- 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_end       timestamptz,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

-- Auto-update updated_at on subscriptions
create or replace function update_updated_at()
returns trigger language plpgsql
security invoker  -- runs as the calling user, not the function owner
set search_path = ''  -- prevent search_path injection
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger functions are invoked by the DB, not by users.
-- Revoke any API-level execute access granted by default.
revoke execute on function update_updated_at() from anon, authenticated;

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute procedure update_updated_at();
