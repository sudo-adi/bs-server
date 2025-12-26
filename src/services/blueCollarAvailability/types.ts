/**
 * Blue Collar Profile Availability Types
 * Types for checking availability of blue collar profiles for projects and training
 */

/**
 * Blocking event - represents a project or training that blocks a profile's availability
 */
export interface BlockingEvent {
  type: 'PROJECT' | 'TRAINING';
  id: string;
  code: string | null;
  name: string | null;
  startDate: Date;
  endDate: Date;
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
 * Skill info for profile response
 */
export interface SkillInfo {
  id: string;
  name: string | null;
  categoryType: string | null;
  yearsOfExperience: number | null;
  isPrimary: boolean | null;
}

/**
 * Address info for profile response
 */
export interface AddressInfo {
  district: string | null;
  state: string | null;
}

/**
 * Blue collar profile info in availability response
 */
export interface BlueCollarProfileInfo {
  id: string;
  code: string | null;
  fullName: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  gender: string | null;
  age: number | null;
  dateOfBirth: Date | null;
  profilePhotoURL: string | null;
  phone: string | null;
  currentStage: string | null;
  skills: SkillInfo[];
  address: AddressInfo | null;
  blockingEvents?: BlockingEvent[];
}

/**
 * Filters for availability query
 */
export interface BlueCollarAvailabilityFilters {
  startDate: Date;
  endDate: Date;
  purpose?: 'project' | 'training' | 'all';
  availabilityStatus?: 'available' | 'unavailable' | 'all';
  skillCategoryIds?: string[];
  gender?: string;
  minAge?: number;
  maxAge?: number;
  stages?: string[];
  districts?: string[];
  states?: string[];
  search?: string;
  sortBy?: 'name' | 'code' | 'age';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  excludeProjectId?: string;
  excludeBatchId?: string;
}

/**
 * Summary of availability counts
 */
export interface AvailabilitySummary {
  totalAvailable: number;
  totalUnavailable: number;
  unavailableByProject: number;
  unavailableByTraining: number;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  totalAvailable: number;
  totalUnavailable: number;
  totalPagesAvailable: number;
  totalPagesUnavailable: number;
}

/**
 * Response from getProfilesWithAvailability
 */
export interface ProfileAvailabilityResponse {
  available: BlueCollarProfileInfo[];
  unavailable: BlueCollarProfileInfo[];
  summary: AvailabilitySummary;
  pagination: PaginationInfo;
}

/**
 * Result of checking single profile availability
 */
export interface SingleProfileAvailabilityResult {
  isAvailable: boolean;
  blockingEvents: BlockingEvent[];
}
