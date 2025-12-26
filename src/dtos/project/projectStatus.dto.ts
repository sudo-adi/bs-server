import { HoldAttribution } from '@/constants/stages';

/**
 * Base interface for stage change requests
 * All stage transitions include userId and documentIds
 */
export interface BaseStageChangeRequest {
  userId: string;
  changeReason?: string;
  documentIds?: string[]; // Array of pre-uploaded document IDs
}

/**
 * Request body for starting project planning
 * Transition: APPROVED → PLANNING
 */
export interface StartPlanningRequest extends BaseStageChangeRequest {
  changeReason: string; // Required for this transition
}

/**
 * Request body for sharing project details with employer
 * Transition: PLANNING → SHARED, Workers MATCHED → ASSIGNED
 */
export interface ShareProjectRequest extends BaseStageChangeRequest {
  sharedAt?: string;
}

/**
 * Request body for starting a project
 * Transition: SHARED → ONSITE, Workers ASSIGNED → ON_SITE
 */
export interface StartProjectRequest extends BaseStageChangeRequest {
  actualStartDate?: string;
}

/**
 * Request body for putting a project on hold
 * Transition: ONSITE → ON_HOLD
 */
export interface HoldProjectRequest extends BaseStageChangeRequest {
  changeReason: string; // Required
  attributableTo: HoldAttribution;
}

/**
 * Request body for resuming a project from on_hold
 * Transition: ON_HOLD → ONSITE
 */
export interface ResumeProjectRequest extends BaseStageChangeRequest {
  resumeToStage?: string; // What stage to resume to (defaults to 'onsite')
}

/**
 * Request body for completing a project
 * Transition: ONSITE → COMPLETED
 */
export interface CompleteProjectRequest extends BaseStageChangeRequest {
  actualEndDate?: string;
}

/**
 * Request body for short-closing a project
 * Transition: ONSITE → SHORT_CLOSED
 */
export interface ShortCloseProjectRequest extends BaseStageChangeRequest {
  changeReason: string; // Required
  actualEndDate: string; // Required
}

/**
 * Request body for terminating a project
 * Transition: ONSITE → TERMINATED
 */
export interface TerminateProjectRequest extends BaseStageChangeRequest {
  changeReason: string; // Required
  terminationDate?: string;
  actualEndDate?: string;
}

/**
 * Request body for cancelling a project
 * Transition: Any stage → CANCELLED
 */
export interface CancelProjectRequest extends BaseStageChangeRequest {
  changeReason: string; // Required
}

/**
 * Generic update project stage request (for PATCH)
 */
export interface UpdateProjectStageRequest extends BaseStageChangeRequest {
  stage: string;
  attributableTo?: HoldAttribution;
  actualStartDate?: string;
  actualEndDate?: string;
  terminationDate?: string;
}

/**
 * Response for stage history with documents
 */
export interface StageHistoryWithDocuments {
  id: string;
  projectId: string;
  previousStage: string | null;
  newStage: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  changedByProfileId: string | null;
  changedAt: Date;
  documents: {
    id: string;
    fileName: string | null;
    documentType: string | null;
    documentUrl: string | null;
  }[];
}

// Legacy aliases for backward compatibility
export type UpdateProjectStatusRequest = UpdateProjectStageRequest;
export interface ProjectStatusDocument {
  documentType: string;
  documentUrl: string;
  fileName?: string;
  description?: string;
}

// Worker assignment DTOs are in projectWorkerAssignment.dto.ts
