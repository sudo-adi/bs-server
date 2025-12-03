import type { Employer, EmployerAuthorizedPerson } from '@/types/prisma.types';
import { Decimal } from '@prisma/client/runtime/library';

// Base employer data (excludes system-managed fields)
type BaseEmployerData = Omit<
  Employer,
  | 'id'
  | 'employer_code' // Auto-generated
  | 'password_hash' // Will be hashed from password field
  | 'is_active' // Has default
  | 'is_verified' // Has default
  | 'verified_at'
  | 'verified_by_user_id'
  | 'last_login'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
  | 'deleted_by_user_id'
  // Relations
  | 'employer_authorized_persons'
  | 'project_requests'
  | 'projects'
  | 'users_employers_deleted_by_user_idTousers'
  | 'users_employers_verified_by_user_idTousers'
>;

// Authorized person fields (based on EmployerAuthorizedPerson table, excluding system fields)
type AuthorizedPersonData = Omit<
  EmployerAuthorizedPerson,
  'id' | 'employer_id' | 'created_at' | 'updated_at'
>;

/**
 * RegisterEmployerDto: Complete employer registration DTO
 * Composed from Prisma types with custom mappings for registration flow
 */
export interface RegisterEmployerDto extends BaseEmployerData {
  // Password field (will be hashed to password_hash)
  password: string;

  // Authorized Person Details (from EmployerAuthorizedPerson table)
  authorized_person_name: AuthorizedPersonData['name'];
  authorized_person_designation: AuthorizedPersonData['designation'];
  authorized_person_email: AuthorizedPersonData['email'];
  authorized_person_contact: AuthorizedPersonData['phone'];
  authorized_person_address: AuthorizedPersonData['address'];

  // Project Request Information (maps to project_requests table)
  project_name: string; // Maps to project_title
  project_description: string; // Maps to project_description

  // Location details (will be combined into location field)
  site_address: string;
  city: string;
  district: string;
  state: string;
  landmark?: string;
  postal_code: string;

  // Optional project request fields
  estimated_start_date?: Date | string;
  estimated_duration_days?: number;
  estimated_budget?: Decimal | number;
  additional_notes?: string;

  // Worker Requirements (for project_request_requirements table)
  worker_requirements: Array<{
    category: string; // Skill category name
    count: number; // required_count
    notes?: string;
  }>;
}

/**
 * VerifyEmployerDto: For verifying employer accounts
 */
export interface VerifyEmployerDto {
  verified_by_user_id: string;
}
