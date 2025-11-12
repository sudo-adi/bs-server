-- ============================================================================
-- UPDATE PROJECT STATUS ENUM
-- Update project status values to: preparing, prepared, deployed, over
-- ============================================================================

-- First, update any existing status values to map to new values
UPDATE projects
SET status = 'over'
WHERE status NOT IN ('preparing', 'deployed');

-- Drop the old constraint if it exists
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Add new constraint with updated status values
ALTER TABLE projects
ADD CONSTRAINT projects_status_check
CHECK (status IN ('preparing', 'prepared', 'deployed', 'over'));

-- Add comment
COMMENT ON COLUMN projects.status IS 'Project operational status: preparing (onboarding workers), prepared (ready to deploy), deployed (active with employer), over (completed)';

SELECT 'Project status enum updated successfully!' as message;
