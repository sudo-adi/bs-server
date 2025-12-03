import type { ProjectWorkerAssignment } from '@/types/prisma.types';
import type { UpdateDTO } from '@/types/shared';

// ============= Base DTOs =============

// Create DTO: Only project_id, profile_id, and skill_category_id are required
// Other fields like assigned_by_user_id, dates, and removal fields are optional
export type CreateProjectWorkerAssignmentDto = Pick<
  ProjectWorkerAssignment,
  'project_id' | 'profile_id' | 'skill_category_id'
> &
  Partial<
    Omit<
      ProjectWorkerAssignment,
      'id' | 'project_id' | 'profile_id' | 'skill_category_id' | 'created_at' | 'updated_at'
    >
  >;

export type UpdateProjectWorkerAssignmentDto = UpdateDTO<
  ProjectWorkerAssignment,
  | 'project_id' // Cannot change project
  | 'profile_id' // Cannot change worker
  | 'skill_category_id' // Cannot change skill
>;

// ============= Bulk Operations =============

/**
 * Bulk create assignments for a project
 */
export interface BulkCreateAssignmentsDto {
  project_id: string;
  assigned_by_user_id: string;
  assignments: Array<{
    profile_id: string;
    skill_category_id: string;
    assigned_date?: Date | string;
    notes?: string;
  }>;
}

/**
 * Remove/deactivate an assignment
 */
export interface RemoveAssignmentDto {
  removed_by_user_id: string;
  removal_reason?: string;
  removal_date?: Date | string;
}

// ============= Filters & Queries =============

/**
 * Filters for querying project worker assignments
 */
export interface ProjectWorkerAssignmentFilters {
  project_id?: string;
  profile_id?: string;
  skill_category_id?: string;
  status?: 'active' | 'removed' | 'all';
  from_date?: Date;
  to_date?: Date;
  page?: number;
  limit?: number;
}

// ============= Relations =============

/**
 * Project worker assignment with all relations populated
 */
export interface ProjectWorkerAssignmentWithRelations extends ProjectWorkerAssignment {
  profiles?: {
    id: string;
    first_name: string;
    last_name: string | null;
    candidate_code: string;
  };
  projects?: {
    id: string;
    project_name: string;
    project_code: string | null;
  };
  skill_categories?: {
    id: string;
    category_name: string;
  };
  users_project_worker_assignments_assigned_by_user_idTousers?: {
    id: string;
    full_name: string | null;
  };
  users_project_worker_assignments_removed_by_user_idTousers?: {
    id: string;
    full_name: string | null;
  };
}

// ============= Validation =============

/**
 * Conflict type for assignment validation
 */
export interface AssignmentConflict {
  type: 'project' | 'training';
  id: string;
  code: string;
  name: string;
  start_date: Date;
  end_date: Date;
  overlap_days: number;
}

/**
 * Result of validating a worker-project assignment
 */
export interface AssignmentValidationResult {
  valid: boolean;
  error?: string;
  conflicts?: AssignmentConflict[];
}
