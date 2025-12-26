import { Project } from '@/generated/prisma';

/**
 * Skill requirement with counts for display
 */
export interface SkillRequirementWithCount {
  skillCategoryId: string;
  skillCategoryName: string;
  requiredCount: number;
  assignedCount: number;
}

/**
 * DTO for project list item (minimal data for listing)
 */
export interface ProjectListDto {
  id: string;
  projectCode: string | null;
  name: string | null;
  location: string | null;
  stage: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean | null;
  employerId: string | null;
  createdAt: Date | null;
  skillRequirements: SkillRequirementWithCount[];
}

/**
 * Resource requirement with skill details and counts
 */
export interface ResourceRequirementDto {
  id: string;
  skillCategoryId: string | null;
  requiredCount: number;
  assignedCount: number;
  skillCategory: {
    id: string;
    name: string | null;
  } | null;
}

/**
 * DTO for project detail (full data)
 */
export type ProjectDetailDto = Omit<Project, 'deletedByProfileId'> & {
  employer?: {
    id: string;
    companyName: string | null;
    employerCode?: string | null;
  } | null;
  projectManager?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  createdBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  resourceRequirements?: ResourceRequirementDto[];
  workerAssignments?: any[];
  financials?: any[];
  stageHistory?: any[];
  skillRequirements?: SkillRequirementWithCount[];
};

/**
 * DTO for project response (create/update)
 */
export type ProjectResponseDto = Omit<Project, 'deletedAt' | 'deletedByProfileId'>;

/**
 * Resource requirement for project creation
 */
export interface CreateResourceRequirementInput {
  skillCategoryId?: string;
  skill_category_id?: string;
  required_count?: number;
  requiredCount?: number;
}

/**
 * Request body for creating a project
 * Accepts both camelCase and snake_case for frontend compatibility
 */
export interface CreateProjectRequest {
  name: string;
  location?: string;
  // Accept both cases
  contactPhone?: string;
  contact_phone?: string;
  deploymentDate?: string;
  deployment_date?: string;
  awardDate?: string;
  award_date?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  revisedCompletionDate?: string;
  revised_completion_date?: string;
  status?: string;
  projectManagerProfileId?: string;
  project_manager?: string;
  description?: string;
  poCoNumber?: string;
  isActive?: boolean;
  isAccommodationProvided?: boolean;
  is_accommodation_provided?: boolean;
  employerId?: string;
  // Financial fields
  contractValue?: number;
  contract_value?: number;
  revisedContractValue?: number;
  revised_contract_value?: number;
  variationOrderValue?: number;
  variation_order_value?: number;
  actualCostIncurred?: number;
  actual_cost_incurred?: number;
  miscCost?: number;
  misc_cost?: number;
  budget?: number;
  // Resource requirements
  resourceRequirements?: CreateResourceRequirementInput[];
  resource_requirements?: CreateResourceRequirementInput[];
}

/**
 * Request body for updating a project
 * Accepts both camelCase and snake_case for frontend compatibility
 */
export type UpdateProjectRequest = Partial<CreateProjectRequest> & {
  actualStartDate?: string;
  actual_start_date?: string;
  actualEndDate?: string;
  actual_end_date?: string;
  currentAttributableTo?: string;
  onHoldReason?: string;
  terminationDate?: string;
  termination_date?: string;
  terminationReason?: string;
  termination_reason?: string;
};

/**
 * Query parameters for listing projects
 */
export interface ProjectListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  isActive?: boolean;
  employerId?: string;
  projectManagerProfileId?: string;
}

/**
 * Valid project statuses
 */
export const PROJECT_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'in_progress',
  'on_hold',
  'completed',
  'terminated',
  'cancelled',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
