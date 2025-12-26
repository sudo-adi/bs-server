import { ProjectRequest, ProjectRequestRequirement } from '@/generated/prisma';

/**
 * Fields excluded from Create DTO
 */
type CreateExcludedFields =
  | 'id'
  | 'employerId'
  | 'projectId'
  | 'status'
  | 'reviewedAt'
  | 'reviewedByProfileId'
  | 'createdAt'
  | 'updatedAt';

/**
 * Fields excluded from Update DTO
 */
type UpdateExcludedFields =
  | 'id'
  | 'employerId'
  | 'projectId'
  | 'status'
  | 'reviewedAt'
  | 'reviewedByProfileId'
  | 'createdAt'
  | 'updatedAt';

/**
 * DTO for creating project request
 */
export type CreateProjectRequestDto = Partial<Omit<ProjectRequest, CreateExcludedFields>> & {
  projectTitle: string;
  requirements?: CreateProjectRequestRequirementDto[];
};

/**
 * DTO for updating project request
 */
export type UpdateProjectRequestDto = Partial<Omit<ProjectRequest, UpdateExcludedFields>>;

/**
 * Response DTO for project request
 */
export type ProjectRequestResponseDto = ProjectRequest & {
  requirements?: ProjectRequestRequirement[];
  employer?: {
    id: string;
    companyName: string | null;
    employerCode: string | null;
  } | null;
  reviewedByProfile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

/**
 * DTO for project request list (summary view)
 */
export type ProjectRequestListDto = Pick<
  ProjectRequest,
  | 'id'
  | 'projectTitle'
  | 'location'
  | 'status'
  | 'estimatedStartDate'
  | 'estimatedBudget'
  | 'createdAt'
>;

/**
 * DTO for creating project request requirement
 */
export interface CreateProjectRequestRequirementDto {
  skillCategoryId: string;
  requiredCount: number;
}

/**
 * DTO for reviewing (approving/rejecting) a project request
 */
export interface ReviewProjectRequestDto {
  status: 'approved' | 'rejected';
  projectId: string;
  reviewedByProfileId: string;
}

/**
 * Query parameters for listing project requests
 */
export interface ProjectRequestListQuery {
  page?: number;
  limit?: number;
  status?: string;
  employerId?: string;
}

/**
 * Response type for project request list
 */
export interface ProjectRequestListResponse {
  success: boolean;
  data: ProjectRequestListDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
