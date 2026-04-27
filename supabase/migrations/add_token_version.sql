-- Migration: add token_version for session invalidation on password change
-- Run this in your Supabase SQL editor.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS token_version   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
