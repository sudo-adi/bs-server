-- Migration: Add Project Requirements Workflow
-- This migration adds support for:
-- 1. Employer project requirements (before creating actual projects)
-- 2. Project skill requirements (track required vs allocated workers by skill)
-- 3. Onboarding vs deployment status for workers

-- =============================================================================
-- 1. CREATE EMPLOYER PROJECT REQUIREMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS employer_project_requirements (
  id SERIAL PRIMARY KEY,
  employer_id INTEGER NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
  project_title VARCHAR(255) NOT NULL,
  project_description TEXT,
  location VARCHAR(255),
  estimated_start_date DATE,
  estimated_duration_days INTEGER,
  estimated_budget DECIMAL(15, 2),
  required_workers_count INTEGER,
  additional_notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'project_created', 'rejected')),
  reviewed_by_user_id INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employer_project_requirements_employer ON employer_project_requirements(employer_id);
CREATE INDEX idx_employer_project_requirements_status ON employer_project_requirements(status);
CREATE INDEX idx_employer_project_requirements_project ON employer_project_requirements(project_id);

-- =============================================================================
-- 2. CREATE PROJECT SKILL REQUIREMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS project_skill_requirements (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_category_id INTEGER NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  required_count INTEGER NOT NULL DEFAULT 0,
  allocated_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, skill_category_id)
);

CREATE INDEX idx_project_skill_requirements_project ON project_skill_requirements(project_id);
CREATE INDEX idx_project_skill_requirements_skill ON project_skill_requirements(skill_category_id);

-- =============================================================================
-- 3. ALTER PROJECT_DEPLOYMENTS TABLE - ADD STATUS COLUMN
-- =============================================================================
-- Add status column to track onboarded vs deployed
ALTER TABLE project_deployments
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'onboarded'
CHECK (status IN ('onboarded', 'deployed'));

CREATE INDEX IF NOT EXISTS idx_project_deployments_status ON project_deployments(status);

-- =============================================================================
-- 4. ALTER PROJECTS TABLE - UPDATE STATUS COLUMN
-- =============================================================================
-- Update projects status to use enum values
-- First, update existing data to match new enum
UPDATE projects
SET status = 'preparing'
WHERE status NOT IN ('preparing', 'deployed', 'completed', 'cancelled');

-- Add constraint (PostgreSQL will need to drop and recreate the column or use ALTER TYPE)
-- For safety, we'll just add a check constraint
ALTER TABLE projects
ADD CONSTRAINT projects_status_check
CHECK (status IN ('preparing', 'deployed', 'completed', 'cancelled'));

-- =============================================================================
-- 5. UPDATE TRIGGERS
-- =============================================================================

-- Trigger to update employer_project_requirements.updated_at
CREATE OR REPLACE FUNCTION update_employer_project_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_employer_project_requirements_updated_at ON employer_project_requirements;
CREATE TRIGGER trigger_update_employer_project_requirements_updated_at
  BEFORE UPDATE ON employer_project_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_employer_project_requirements_updated_at();

-- Trigger to update project_skill_requirements.updated_at
CREATE OR REPLACE FUNCTION update_project_skill_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_skill_requirements_updated_at ON project_skill_requirements;
CREATE TRIGGER trigger_update_project_skill_requirements_updated_at
  BEFORE UPDATE ON project_skill_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_project_skill_requirements_updated_at();

-- =============================================================================
-- 6. SEED DATA (OPTIONAL)
-- =============================================================================

-- Example: Update existing projects to have status='preparing' if null
UPDATE projects SET status = 'preparing' WHERE status IS NULL;

-- Example: For existing project_deployments, set status to 'deployed' if actual_end_date is null
UPDATE project_deployments SET status = 'deployed' WHERE actual_end_date IS NULL AND status IS NULL;

COMMENT ON TABLE employer_project_requirements IS 'Stores initial project requirements from employer signup before project creation';
COMMENT ON TABLE project_skill_requirements IS 'Tracks required worker counts by skill category for each project';
COMMENT ON COLUMN project_deployments.status IS 'Worker deployment status: onboarded (assigned but not deployed) or deployed (actively working)';
COMMENT ON COLUMN projects.status IS 'Project status: preparing (gathering workers), deployed (active with employer), completed, or cancelled';
