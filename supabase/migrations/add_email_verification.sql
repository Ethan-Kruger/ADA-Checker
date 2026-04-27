-- Add email verification columns to users table
alter table users
  add column if not exists email_verified          boolean     not null default false,
  add column if not exists verification_token      text,
  add column if not exists verification_token_expires_at timestamptz;
