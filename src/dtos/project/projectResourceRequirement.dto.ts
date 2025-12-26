/**
 * Project Resource Requirement DTOs
 */

// ==================== REQUEST ====================

export interface CreateProjectResourceRequirementDto {
  projectId: string;
  skillCategoryId: string;
  requiredCount: number;
}

export interface UpdateProjectResourceRequirementDto {
  requiredCount?: number;
}

export interface BulkCreateResourceRequirementsDto {
  projectId: string;
  requirements: Array<{
    skillCategoryId: string;
    requiredCount: number;
  }>;
}

// ==================== RESPONSE ====================

export interface ProjectResourceRequirementResponse {
  id: string;
  projectId: string | null;
  skillCategoryId: string | null;
  requiredCount: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  skillCategory?: {
    id: string;
    name: string | null;
    categoryType: string | null;
  } | null;
  project?: {
    id: string;
    projectCode: string | null;
    name: string | null;
  } | null;
}

export interface ResourceRequirementSummary {
  totalRequired: number;
  totalAssigned: number;
  remaining: number;
  requirements: Array<{
    skillCategoryId: string;
    skillName: string;
    required: number;
    assigned: number;
    remaining: number;
  }>;
}

// ==================== QUERY ====================

export interface ProjectResourceRequirementListQuery {
  projectId?: string;
  skillCategoryId?: string;
  page?: number;
  limit?: number;
}
