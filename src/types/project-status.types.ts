import type { project_status_documents, project_status_history, projects } from '@/generated/prisma';
import { ProjectHoldAttributableTo, ProjectStatus } from './enums';

// DTO for changing project status
export interface ChangeProjectStatusDto {
  to_status: ProjectStatus;
  change_reason?: string;
  attributable_to?: ProjectHoldAttributableTo; // Required for ON_HOLD
  status_date: Date;
  documents?: StatusDocumentDto[];
  changed_by_user_id: string;
}

// DTO for status documents
export interface StatusDocumentDto {
  document_title: string;
  file_url: string;
  uploaded_by_user_id?: string;
}

// Response type for status change
export interface ProjectStatusChangeResponse {
  project: projects;
  status_history: project_status_history;
  documents: project_status_documents[];
  affected_workers?: WorkerStateChangeResult[];
}

// Alias for backward compatibility
export type ProjectStatusTransitionResult = ProjectStatusChangeResponse;

// Worker state change result
export interface WorkerStateChangeResult {
  profile_id: string;
  candidate_code: string;
  from_stage: string | null;
  to_stage: string;
  success: boolean;
  error?: string;
}

// Project status history with relations
export interface ProjectStatusHistoryWithDocuments extends project_status_history {
  project_status_documents: project_status_documents[];
  projects?: projects;
  users?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

// Validation result
export interface StatusTransitionValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Project with status metadata
export interface ProjectWithStatusMetadata extends projects {
  is_delayed?: boolean;
  days_remaining?: number;
  workers_assigned_count?: number;
  required_workers_count?: number;
  can_transition_to?: ProjectStatus[];
}
