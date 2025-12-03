import { ProjectHoldAttributableTo, ProjectStatus } from '@/types/enums';
import type { Project, ProjectStatusDocument, ProjectStatusHistory } from '@/types/prisma.types';

export interface ChangeProjectStatusDto {
  to_status: ProjectStatus;
  change_reason?: string;
  attributable_to?: ProjectHoldAttributableTo;
  status_date: Date;
  documents?: StatusDocumentDto[];
  changed_by_user_id: string;
}

export interface StatusDocumentDto {
  document_title: string;
  file_url: string;
  uploaded_by_user_id?: string;
}

export interface ProjectStatusChangeResponse {
  project: Project;
  status_history: ProjectStatusHistory;
  documents: ProjectStatusDocument[];
  affected_workers?: WorkerStateChangeResult[];
}

export interface WorkerStateChangeResult {
  profile_id: string;
  candidate_code: string;
  from_stage: string | null;
  to_stage: string;
  success: boolean;
  error?: string;
}

export interface StatusTransitionValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Extended type for status history with related documents and user details
export type ProjectStatusHistoryWithDocuments = ProjectStatusHistory & {
  project_status_documents: ProjectStatusDocument[];
  users: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  projects?: {
    id: string;
    code: string;
    name: string;
  };
};

// Result type for status transition operations
export interface ProjectStatusTransitionResult {
  success: boolean;
  project: Project;
  status_history: ProjectStatusHistoryWithDocuments;
  documents: ProjectStatusDocument[];
  affected_workers?: WorkerStateChangeResult[];
  errors?: string[];
  warnings?: string[];
}
