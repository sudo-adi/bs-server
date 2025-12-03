import type { Project } from '@/types/prisma.types';
import type { NestedCreateDTO, UpdateDTO } from '@/types/shared';

export type CreateProjectDto = NestedCreateDTO<
  Project,
  {
    code?: string;
    contract_value?: number | string;
    revised_contract_value?: number | string;
    variation_order_value?: number | string;
    actual_cost_incurred?: number | string;
    misc_cost?: number | string;
    budget?: number | string;
    resource_requirements?: Array<{
      skill_category_id: string;
      required_count: number;
      notes?: string;
    }>;
  }
>;

export type UpdateProjectDto = UpdateDTO<Project> & {
  contract_value?: number | string;
  revised_contract_value?: number | string;
  variation_order_value?: number | string;
  actual_cost_incurred?: number | string;
  misc_cost?: number | string;
  budget?: number | string;
  resource_requirements?: Array<{
    skill_category_id: string;
    required_count: number;
    notes?: string;
  }>;
};

// CSV Import Types - Composed from Prisma types

// Project base fields (name is required, exclude system/relation fields)
type ProjectCsvBaseFields = Required<Pick<Project, 'name'>> & {
  employer_code: string; // Lookup field instead of employer_id
} & Partial<Omit<Project,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
  | 'deleted_by_user_id'
  | 'name' // Already in Required
  | 'employer_id' // Using employer_code instead
  | 'code' // Auto-generated
  | 'is_active'
  // Date fields - override below as strings
  | 'deployment_date'
  | 'award_date'
  | 'start_date'
  | 'end_date'
  | 'revised_completion_date'
  | 'actual_start_date'
  | 'actual_end_date'
  | 'termination_date'
  | 'is_accommodation_provided' // Override below as string
  // Relations
  | 'employers'
  | 'project_financials'
  | 'project_request_requirements'
  | 'project_requests'
  | 'project_resource_requirements'
  | 'project_worker_assignments'
  | 'users'
  | 'training_batches'
  | 'certificates'
>>;

// Date fields (CSV uses strings)
type ProjectCsvDateFields = {
  deployment_date?: string;
  award_date?: string;
  start_date?: string;
  end_date?: string;
  revised_completion_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  termination_date?: string;
};

// Project-specific CSV fields
type ProjectCsvSpecificFields = {
  is_accommodation_provided?: string; // CSV uses string representation
  current_attributable_to?: string;
  on_hold_reason?: string;
  termination_reason?: string;
};

// Financial fields (CSV uses string representation of numbers)
type ProjectCsvFinancialFields = {
  contract_value?: string;
  revised_contract_value?: string;
  budget?: string;
  variation_order_value?: string;
  actual_cost_incurred?: string;
  misc_cost?: string;
};

export type ProjectCsvRow = ProjectCsvBaseFields
  & ProjectCsvDateFields
  & ProjectCsvSpecificFields
  & ProjectCsvFinancialFields;

export interface ProjectImportRowResult {
  rowNumber: number;
  success: boolean;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  employerCode?: string;
  errors?: string[];
  warnings?: string[];
  data?: any; // Row data for debugging/display
}

export interface ProjectImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: ProjectImportRowResult[];
}

export interface ProjectImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

/**
 * Note: Related entity DTOs (ProjectFinancials, ProjectWorkerAssignment, etc.)
 * are defined separately. These types will be moved to appropriate domain folders.
 */
