import type { Employer } from '@/types/prisma.types';
import type { LoginDTO, NestedCreateDTO, PartialUpdateDTO } from '@/types/shared';

export type CreateEmployerDto = NestedCreateDTO<
  Employer,
  {
    password: string;
    authorized_person_name: string;
    authorized_person_designation: string;
    authorized_person_email: string;
    authorized_person_contact: string;
    authorized_person_address: string;
  }
>;

export type UpdateEmployerDto = PartialUpdateDTO<
  Employer,
  | 'company_name'
  | 'client_name'
  | 'email'
  | 'phone'
  | 'alt_phone'
  | 'registered_address'
  | 'company_registration_number'
  | 'gst_number'
  | 'is_active'
  | 'is_verified'
>;

export type EmployerLoginDto = LoginDTO<Employer, 'email'> & {
  password: string;
};

// CSV Import Types - Composed from Prisma types

// Employer base fields (required fields + password, exclude system/relation fields)
type EmployerCsvBaseFields = Required<
  Pick<Employer, 'company_name' | 'client_name' | 'email' | 'phone'>
> & {
  password: string; // Required for CSV import
} & Partial<
    Omit<
      Employer,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'deleted_at'
      | 'deleted_by_user_id'
      | 'verified_at'
      | 'verified_by_user_id'
      | 'company_name' // Already in Required
      | 'client_name' // Already in Required
      | 'email' // Already in Required
      | 'phone' // Already in Required
      | 'is_active'
      | 'is_verified'
      | 'verification_status'
      | 'employer_code'
      // Relations
      | 'employer_authorized_persons'
      | 'project_requests'
      | 'projects'
      | 'users_employers_deleted_by_user_idTousers'
      | 'users_employers_verified_by_user_idTousers'
    >
  >;

// Authorized person fields (flattened from EmployerAuthorizedPerson)
type AuthorizedPersonCsvFields = {
  authorized_person_name?: string;
  authorized_person_designation?: string;
  authorized_person_email?: string;
  authorized_person_phone?: string;
  authorized_person_address?: string;
};

export type EmployerCsvRow = EmployerCsvBaseFields & AuthorizedPersonCsvFields;

export interface EmployerImportRowResult {
  rowNumber: number;
  success: boolean;
  employerId?: string;
  employerCode?: string;
  errors?: string[];
  warnings?: string[];
  data?: any; // Row data for debugging/display
}

export interface EmployerImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: EmployerImportRowResult[];
}

export interface EmployerImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}
