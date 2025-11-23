-- Add new fields to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS status_change_reason TEXT,
ADD COLUMN IF NOT EXISTS actual_start_date DATE,
ADD COLUMN IF NOT EXISTS actual_end_date DATE,
ADD COLUMN IF NOT EXISTS current_attributable_to VARCHAR(50);

-- Add previous_stage field to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS previous_stage VARCHAR(50);

-- Create project_status_history table
CREATE TABLE IF NOT EXISTS project_status_history (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  change_reason TEXT,
  attributable_to VARCHAR(50),
  status_date TIMESTAMP(6) NOT NULL,
  changed_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP(6) DEFAULT NOW()
);

-- Create indexes for project_status_history
CREATE INDEX IF NOT EXISTS idx_project_status_history_project_date
ON project_status_history(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_status_history_status
ON project_status_history(to_status);

-- Create project_status_documents table
CREATE TABLE IF NOT EXISTS project_status_documents (
  id SERIAL PRIMARY KEY,
  project_status_history_id INTEGER NOT NULL REFERENCES project_status_history(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  document_title VARCHAR(500) NOT NULL,
  file_url VARCHAR(1000) NOT NULL,
  uploaded_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP(6) DEFAULT NOW()
);

-- Create indexes for project_status_documents
CREATE INDEX IF NOT EXISTS idx_project_status_documents_project
ON project_status_documents(project_id);

CREATE INDEX IF NOT EXISTS idx_project_status_documents_history
ON project_status_documents(project_status_history_id);

CREATE INDEX IF NOT EXISTS idx_project_status_documents_status
ON project_status_documents(status);

-- Add comments to new columns
COMMENT ON COLUMN projects.status_changed_at IS 'Timestamp when project status was last changed';
COMMENT ON COLUMN projects.status_change_reason IS 'Reason for the last status change';
COMMENT ON COLUMN projects.actual_start_date IS 'Actual date when project started';
COMMENT ON COLUMN projects.actual_end_date IS 'Actual date when project ended';
COMMENT ON COLUMN projects.current_attributable_to IS 'Current attributable party for ON_HOLD status';
COMMENT ON COLUMN profiles.previous_stage IS 'Previous stage before current assignment (for rollback on termination)';

-- Add comments to new tables
COMMENT ON TABLE project_status_history IS 'Tracks all status changes for projects with metadata';
COMMENT ON TABLE project_status_documents IS 'Stores documents associated with project status changes';
