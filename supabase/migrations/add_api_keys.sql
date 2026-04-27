-- api_keys table: stores server-issued API keys for the REST API.
-- The full key is shown to the user exactly once; only a bcrypt hash is stored.
-- key_prefix (first 15 chars of the key) is used for fast lookup before bcrypt compare.

create table if not exists api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users(id) on delete cascade,
  key_prefix    text not null,          -- 'ada_sk_' + first 8 random chars, for lookup
  key_hash      text not null,          -- bcrypt hash of full key
  name          text not null default 'Default',
  created_at    timestamptz default now(),
  last_used_at  timestamptz
);

create index if not exists api_keys_user_id_idx    on api_keys (user_id);
create index if not exists api_keys_key_prefix_idx on api_keys (key_prefix);

-- Only the owning user can read their own keys (no full key stored, so safe)
alter table api_keys enable row level security;

create policy "Users can manage their own API keys"
  on api_keys for all
  using (user_id = auth.uid());
