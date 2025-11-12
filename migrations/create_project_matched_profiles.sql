-- Migration: Create Project Matched Profiles Table
-- This table tracks profiles that have been matched and shared with employers for specific projects

-- =============================================================================
-- CREATE PROJECT_MATCHED_PROFILES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS project_matched_profiles (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_category_id UUID NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,

  -- Sharing and status tracking
  shared_with_employer BOOLEAN NOT NULL DEFAULT FALSE,
  shared_at TIMESTAMP,
  shared_by_user_id UUID REFERENCES users(id),

  -- Worker status
  status VARCHAR(50) NOT NULL DEFAULT 'matched'
    CHECK (status IN ('matched', 'shared', 'approved_by_employer', 'rejected_by_employer', 'onboarded', 'deployed')),

  -- Employer feedback
  employer_notes TEXT,
  employer_reviewed_at TIMESTAMP,

  -- Matching metadata
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  years_of_experience INTEGER,
  is_benched BOOLEAN DEFAULT FALSE,
  is_trained BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique combination of project, profile, and skill
  UNIQUE(project_id, profile_id, skill_category_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_project_matched_profiles_project ON project_matched_profiles(project_id);
CREATE INDEX idx_project_matched_profiles_profile ON project_matched_profiles(profile_id);
CREATE INDEX idx_project_matched_profiles_skill ON project_matched_profiles(skill_category_id);
CREATE INDEX idx_project_matched_profiles_status ON project_matched_profiles(status);
CREATE INDEX idx_project_matched_profiles_shared ON project_matched_profiles(shared_with_employer);

-- =============================================================================
-- UPDATE TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_project_matched_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_matched_profiles_updated_at ON project_matched_profiles;
CREATE TRIGGER trigger_update_project_matched_profiles_updated_at
  BEFORE UPDATE ON project_matched_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_project_matched_profiles_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE project_matched_profiles IS 'Tracks worker profiles matched to projects and their sharing status with employers';
COMMENT ON COLUMN project_matched_profiles.shared_with_employer IS 'Whether this profile has been shared with the employer';
COMMENT ON COLUMN project_matched_profiles.status IS 'Profile status: matched (selected), shared (sent to employer), approved_by_employer, rejected_by_employer, onboarded, deployed';
COMMENT ON COLUMN project_matched_profiles.match_score IS 'Matching score 0-100 based on skill proficiency and experience';
COMMENT ON COLUMN project_matched_profiles.is_benched IS 'Whether the worker was benched when matched';
COMMENT ON COLUMN project_matched_profiles.is_trained IS 'Whether the worker completed relevant training';
