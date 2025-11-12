-- Add stage column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stage VARCHAR(50) DEFAULT 'new_joinee';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_stage ON profiles(stage);

-- Add comment
COMMENT ON COLUMN profiles.stage IS 'Current stage of the profile: new_joinee, screening, approved, rejected, in_training, trained, onboarded, allocated, deployed, benched';
