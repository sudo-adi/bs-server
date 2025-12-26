/**
 * Employer Portal DTOs
 * Request/Response types for employer-facing APIs
 */

// ============================================================================
// Project Request DTOs
// ============================================================================

export interface CreateProjectRequestDto {
  projectTitle: string;
  projectDescription?: string;
  location?: string;
  estimatedStartDate?: string;
  estimatedDurationDays?: number;
  estimatedBudget?: number;
  additionalNotes?: string;
  requirements?: {
    skillCategoryId: string;
    requiredCount: number;
  }[];
}

export interface ProjectRequestListItemDto {
  id: string;
  projectTitle: string | null;
  location: string | null;
  status: string | null;
  estimatedStartDate: Date | null;
  estimatedBudget: number | null;
  createdAt: Date | null;
  reviewedAt: Date | null;
}

export interface ProjectRequestDetailDto {
  id: string;
  projectTitle: string | null;
  projectDescription: string | null;
  location: string | null;
  estimatedStartDate: Date | null;
  estimatedDurationDays: number | null;
  estimatedBudget: number | null;
  additionalNotes: string | null;
  status: string | null;
  createdAt: Date | null;
  reviewedAt: Date | null;
  requirements: {
    id: string;
    skillCategory: {
      id: string;
      name: string | null;
    } | null;
    requiredCount: number | null;
  }[];
}

// ============================================================================
// Project DTOs (Employer View)
// ============================================================================

export interface ProjectListItemDto {
  id: string;
  projectCode: string | null;
  name: string | null;
  location: string | null;
  stage: string | null;
  isShared: boolean;
  deploymentDate: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date | null;
}

export interface ProjectDetailsDto {
  id: string;
  projectCode: string | null;
  name: string | null;
  stage: string | null;
  isShared: boolean;
  message?: string;
  projectDetails?: {
    location: string | null;
    description: string | null;
    deploymentDate: Date | null;
    startDate: Date | null;
    endDate: Date | null;
    actualStartDate: Date | null;
    actualEndDate: Date | null;
    contactPhone: string | null;
    poCoNumber: string | null;
    isAccommodationProvided: boolean | null;
    projectManager: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
  documents?: ProjectDocumentDto[];
  stageHistory?: StageHistoryDto[];
  workers?: WorkerRestrictedDto[];
  resourceRequirements?: ResourceRequirementDto[];
}

export interface ProjectDocumentDto {
  id: string;
  documentType: string | null;
  fileName: string | null;
  documentUrl: string | null;
  createdAt: Date | null;
}

export interface StageHistoryDto {
  id: string;
  previousStage: string | null;
  newStage: string | null;
  reason: string | null;
  changedAt: Date | null;
  documents: ProjectDocumentDto[];
}

export interface WorkerRestrictedDto {
  id: string;
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  bloodGroup: string | null;
  assignedAt: Date | null;
  deployedAt: Date | null;
}

export interface ResourceRequirementDto {
  skillCategory: {
    id: string;
    name: string | null;
  } | null;
  requiredCount: number | null;
  assignedCount: number;
}

// ============================================================================
// Employer Info DTO
// ============================================================================

export interface EmployerInfoDto {
  id: string;
  employerCode: string | null;
  companyName: string | null;
  clientName: string | null;
  email: string | null;
  phone: string | null;
  altPhone: string | null;
  registeredAddress: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  postalCode: string | null;
  landmark: string | null;
  gstNumber: string | null;
  companyRegistrationNumber: string | null;
  logoUrl: string | null;
  isVerified: boolean | null;
  isActive: boolean | null;
  authorizedPersons: AuthorizedPersonDto[];
}

export interface AuthorizedPersonDto {
  id: string;
  name: string | null;
  designation: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isPrimary: boolean | null;
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface ProjectRequestQueryParams {
  status?: 'pending' | 'approved' | 'rejected' | 'project_created';
  page?: number;
  limit?: number;
}

export interface ProjectQueryParams {
  stage?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
