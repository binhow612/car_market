-- Migration script to add OAuth support to users table
-- This script adds the necessary columns for OAuth authentication

-- Add provider column (enum)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'local' 
CHECK (provider IN ('local', 'google', 'facebook'));

-- Add provider_id column for storing OAuth provider's user ID
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

-- Create unique constraint for provider_id and provider combination
-- This ensures that each OAuth provider can only have one account per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_provider_id 
ON users (provider, provider_id) 
WHERE provider_id IS NOT NULL;

-- Update existing users to have 'local' provider if not set
UPDATE users 
SET provider = 'local' 
WHERE provider IS NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN users.provider IS 'Authentication provider: local, google, or facebook';
COMMENT ON COLUMN users.provider_id IS 'User ID from OAuth provider (Google/Facebook)';
