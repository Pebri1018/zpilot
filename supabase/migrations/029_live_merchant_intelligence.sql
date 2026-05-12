-- Migration 029: Add live merchant intelligence fields

ALTER TABLE merchant_signals
ADD COLUMN IF NOT EXISTS fast_pickup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS manual_admin_boost_until TIMESTAMP WITH TIME ZONE;
