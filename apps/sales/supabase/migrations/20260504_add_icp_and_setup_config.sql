-- ICP config, scoring weights, notification settings for setup tracking
ALTER TABLE tenant_ai_profile
  ADD COLUMN IF NOT EXISTS icp_config jsonb,
  ADD COLUMN IF NOT EXISTS scoring_weights jsonb,
  ADD COLUMN IF NOT EXISTS notifications_config jsonb;
