/**
 * Project Worker Assignment DTOs
 */

// ==================== REQUEST ====================

export interface AssignWorkerToProjectRequest {
  profileId: string;
  skillCategoryId?: string;
}

export interface RemoveWorkerFromProjectRequest {
  reason: string;
}

export interface BulkAssignWorkersRequest {
  workers: Array<{
    profileId: string;
    skillCategoryId?: string;
  }>;
}

export interface BulkRemoveWorkersRequest {
  assignmentIds: string[];
  reason: string;
}

// ==================== RESPONSE ====================

export interface ProjectWorkerAssignmentResponse {
  id: string;
  projectId: string | null;
  profileId: string | null;
  stage: string | null;
  matchedAt: Date | null;
  assignedAt: Date | null;
  deployedAt: Date | null;
  sharedAt: Date | null;
  removedAt: Date | null;
  removalReason: string | null;
  assignedByProfileId: string | null;
  removedByProfileId: string | null;
  sharedByProfileId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  profile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    workerCode: string | null;
    candidateCode: string | null;
    phone: string | null;
    currentStage: string | null;
  } | null;
  project?: {
    id: string;
    projectCode: string | null;
    name: string | null;
  } | null;
}

export interface BulkAssignmentResult {
  success: number;
  failed: number;
  assignments: ProjectWorkerAssignmentResponse[];
  errors: Array<{ profileId: string; error: string }>;
}

export interface BulkRemovalResult {
  success: number;
  failed: number;
  errors: Array<{ assignmentId: string; error: string }>;
}

// ==================== QUERY ====================

export interface ProjectAssignmentListQuery {
  projectId?: string;
  profileId?: string;
  status?: 'active' | 'removed' | 'all';
  page?: number;
  limit?: number;
}

export interface ProjectAssignmentStats {
  totalAssigned: number;
  currentlyActive: number;
  removed: number;
  bySkill: Array<{ skillId: string; skillName: string; count: number }>;
  byStage: Array<{ stage: string; count: number }>;
}
