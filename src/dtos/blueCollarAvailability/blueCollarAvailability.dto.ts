/**
 * Blue Collar Availability DTOs
 * Request/Response interfaces for the availability API
 */

/**
 * Query parameters for availability endpoint
 */
export interface BlueCollarAvailabilityQuery {
  // Required date range
  startDate: string;
  endDate: string;

  // Purpose filter
  purpose?: 'project' | 'training' | 'all';

  // Availability status filter
  availabilityStatus?: 'available' | 'unavailable' | 'all';

  // Profile filters
  skillCategoryIds?: string | string[];
  gender?: string;
  minAge?: string | number;
  maxAge?: string | number;
  stages?: string | string[];
  districts?: string | string[];
  states?: string | string[];
  search?: string;

  // Sorting
  sortBy?: 'name' | 'code' | 'age';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: string | number;
  limit?: string | number;

  // Exclusions for context-based queries
  excludeProjectId?: string;
  excludeBatchId?: string;
}

/**
 * Blocking event in response
 */
export interface BlockingEventDto {
  type: 'PROJECT' | 'TRAINING';
  id: string;
  code: string | null;
  name: string | null;
  startDate: string;
  endDate: string;
  status: string | null;
  overlapDays: number;
  location: string | null;
  // Project specific
  employer?: {
    id: string;
    name: string | null;
  };
  // Training specific
  programName?: string | null;
}

/**
 * Skill info in response
 */
export interface SkillDto {
  id: string;
  name: string | null;
  categoryType: string | null;
  yearsOfExperience: number | null;
  isPrimary: boolean | null;
}

/**
 * Address info in response
 */
export interface AddressDto {
  district: string | null;
  state: string | null;
}

/**
 * Profile info in response
 */
export interface BlueCollarProfileDto {
  id: string;
  code: string | null;
  fullName: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  gender: string | null;
  age: number | null;
  dateOfBirth: string | null;
  profilePhotoURL: string | null;
  phone: string | null;
  currentStage: string | null;
  skills: SkillDto[];
  address: AddressDto | null;
  blockingEvents?: BlockingEventDto[];
}

/**
 * Summary in response
 */
export interface AvailabilitySummaryDto {
  totalAvailable: number;
  totalUnavailable: number;
  unavailableByProject: number;
  unavailableByTraining: number;
}

/**
 * Pagination in response
 */
export interface AvailabilityPaginationDto {
  page: number;
  limit: number;
  totalAvailable: number;
  totalUnavailable: number;
  totalPagesAvailable: number;
  totalPagesUnavailable: number;
}

/**
 * Full response structure
 */
export interface BlueCollarAvailabilityResponse {
  success: boolean;
  data: {
    available: BlueCollarProfileDto[];
    unavailable: BlueCollarProfileDto[];
    summary: AvailabilitySummaryDto;
  };
  pagination: AvailabilityPaginationDto;
}

/**
 * Single profile availability check query
 */
export interface CheckProfileAvailabilityQuery {
  profileId: string;
  startDate: string;
  endDate: string;
  excludeProjectId?: string;
  excludeBatchId?: string;
}

/**
 * Single profile availability response
 */
export interface CheckProfileAvailabilityResponse {
  success: boolean;
  data: {
    isAvailable: boolean;
    blockingEvents: BlockingEventDto[];
  };
}

/**
 * Helper to parse query params
 */
export function parseAvailabilityQuery(query: BlueCollarAvailabilityQuery) {
  return {
    startDate: new Date(query.startDate),
    endDate: new Date(query.endDate),
    purpose: query.purpose as 'project' | 'training' | 'all' | undefined,
    availabilityStatus: query.availabilityStatus as 'available' | 'unavailable' | 'all' | undefined,
    skillCategoryIds: query.skillCategoryIds
      ? Array.isArray(query.skillCategoryIds)
        ? query.skillCategoryIds
        : query.skillCategoryIds.split(',')
      : undefined,
    gender: query.gender,
    minAge: query.minAge ? parseInt(String(query.minAge)) : undefined,
    maxAge: query.maxAge ? parseInt(String(query.maxAge)) : undefined,
    stages: query.stages
      ? Array.isArray(query.stages)
        ? query.stages
        : query.stages.split(',')
      : undefined,
    districts: query.districts
      ? Array.isArray(query.districts)
        ? query.districts
        : query.districts.split(',')
      : undefined,
    states: query.states
      ? Array.isArray(query.states)
        ? query.states
        : query.states.split(',')
      : undefined,
    search: query.search,
    sortBy: query.sortBy as 'name' | 'code' | 'age' | undefined,
    sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
    page: query.page ? parseInt(String(query.page)) : 1,
    limit: Math.min(query.limit ? parseInt(String(query.limit)) : 20, 100),
    excludeProjectId: query.excludeProjectId,
    excludeBatchId: query.excludeBatchId,
  };
}
