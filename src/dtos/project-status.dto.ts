import { ProjectHoldAttributableTo, ProjectStatus } from '@/types/enums';

/**
 * DTO for transitioning project status to ON_HOLD
 */
export interface HoldProjectDto {
  attributable_to: ProjectHoldAttributableTo;
  change_reason: string;
  status_date: Date;
  documents: {
    document_title: string;
    file_url: string;
  }[];
}

/**
 * DTO for resuming project from ON_HOLD
 */
export interface ResumeProjectDto {
  change_reason: string;
  status_date: Date;
}

/**
 * DTO for completing project
 */
export interface CompleteProjectDto {
  actual_end_date: Date;
  change_reason?: string;
  status_date: Date;
  documents?: {
    document_title: string;
    file_url: string;
  }[];
}

/**
 * DTO for short closing project
 */
export interface ShortCloseProjectDto {
  actual_end_date: Date;
  change_reason: string;
  status_date: Date;
  documents: {
    document_title: string;
    file_url: string;
  }[];
}

/**
 * DTO for terminating project
 */
export interface TerminateProjectDto {
  change_reason: string;
  status_date: Date;
  actual_end_date?: Date;
  documents: {
    document_title: string;
    file_url: string;
  }[];
}

/**
 * DTO for sharing workers with employer
 */
export interface ShareWorkersDto {
  profile_ids: string[];
  shared_by_user_id: string;
  shared_at: Date;
}

/**
 * DTO for starting project (transition to ONGOING)
 */
export interface StartProjectDto {
  actual_start_date: Date;
  status_date: Date;
}

/**
 * Generic status transition request
 */
export interface StatusTransitionRequestDto {
  to_status: ProjectStatus;
  change_reason?: string;
  attributable_to?: ProjectHoldAttributableTo;
  status_date: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  documents?: {
    document_title: string;
    file_url: string;
  }[];
  changed_by_user_id: string;
}
