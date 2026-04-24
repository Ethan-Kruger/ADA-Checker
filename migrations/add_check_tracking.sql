-- Migration: add check-count tracking to subscriptions
-- Run this in your Supabase SQL editor before deploying the /api/check/run endpoint.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS checks_today   INTEGER       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS checks_reset_at TIMESTAMPTZ;
