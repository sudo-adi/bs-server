import type { Address, BankAccount, Profile, Qualification } from '@/types/prisma.types';
import type { UpdateDTO } from '@/types/shared';

// Create Profile DTO - Only required fields: phone, first_name
// All other fields are optional
export type CreateProfileDto = Pick<Profile, 'phone' | 'first_name'> &
  Partial<
    Omit<
      Profile,
      | 'id' // Auto-generated UUID
      | 'candidate_code' // Auto-generated
      | 'phone' // Already required above
      | 'first_name' // Already required above
      | 'created_at' // Auto-set
      | 'updated_at' // Auto-set
      | 'deleted_at' // Soft delete field
      | 'deleted_by_user_id' // Soft delete field
      | 'previous_stage' // System-managed
      | 'current_stage' // System-managed (has default 'new')
      | 'is_active' // Has default value (true)
      // Relations
      | 'addresses'
      | 'bank_accounts'
      | 'batch_enrollments'
      | 'certificates'
      | 'documents'
      | 'interactions'
      | 'profile_blacklist'
      | 'profile_salary_slips'
      | 'profile_skills'
      | 'users'
      | 'project_worker_assignments'
      | 'qualifications'
      | 'stage_transitions'
    >
  >;

// Update DTO excludes system-managed stage fields
export type UpdateProfileDto = UpdateDTO<
  Profile,
  | 'candidate_code' // Cannot be updated
  | 'previous_stage' // System-managed
  | 'current_stage' // System-managed
>;

// Stage change DTO
export interface ChangeStageDto {
  to_stage: string;
  notes?: string;
  user_id: string; // UUID
}

// Blacklist profile DTO
export interface BlacklistProfileDto {
  reason: string;
  user_id: string; // UUID
}

// Profile fields for CSV (first_name and phone required, exclude system/relation fields)
type ProfileCsvFields = Required<Pick<Profile, 'first_name' | 'phone'>> &
  Partial<
    Omit<
      Profile,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'deleted_at'
      | 'deleted_by_user_id'
      | 'first_name' // Already in Required
      | 'phone' // Already in Required
      | 'candidate_code'
      | 'previous_stage'
      | 'current_stage'
      | 'is_active'
      | 'date_of_birth' // Override below
      | 'profile_photo_url'
      // Relations
      | 'addresses'
      | 'bank_accounts'
      | 'batch_enrollments'
      | 'documents'
      | 'interactions'
      | 'profile_blacklist'
      | 'profile_skills'
      | 'project_worker_assignments'
      | 'qualifications'
      | 'stage_transitions'
      | 'users'
      | 'certificates'
    >
  > & {
    date_of_birth?: string; // CSV uses string format (YYYY-MM-DD)
  };

// Address fields for CSV (all optional, exclude system/relation fields)
type AddressCsvFields = Partial<
  Omit<Address, 'id' | 'created_at' | 'updated_at' | 'profile_id' | 'profiles' | 'is_current'>
>;

// Bank account fields for CSV (all optional, exclude system/relation fields)
type BankAccountCsvFields = Partial<
  Omit<
    BankAccount,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'profile_id'
    | 'verified_by_user_id'
    | 'is_primary'
    | 'is_verified'
    | 'verification_status'
    | 'verified_at'
    | 'profiles'
    | 'users'
  >
>;

// Qualification fields for CSV (all optional, exclude system/relation fields)
type QualificationCsvFields = Partial<
  Omit<
    Qualification,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'profile_id'
    | 'qualification_type_id'
    | 'year_of_completion' // Override below
    | 'profiles'
    | 'qualification_types'
    | 'documents'
  >
> & {
  qualification_type?: string; // Type name instead of ID
  year_of_completion?: string; // CSV uses string instead of number
};

// Skill fields for CSV
type SkillCsvFields = {
  skill_category?: string; // Category name instead of ID
  years_of_experience?: string; // CSV uses string
};

// Document fields for CSV
type DocumentCsvFields = {
  doc_type?: string;
  doc_number?: string;
};

// Statutory fields (custom to profile)
type StatutoryCsvFields = {
  esic_number?: string;
  uan_number?: string;
  pf_account_number?: string;
  pan_number?: string;
  health_insurance_policy_number?: string;
};

// Combine all CSV fields into ProfileCsvRow
export type ProfileCsvRow = ProfileCsvFields &
  AddressCsvFields &
  BankAccountCsvFields &
  QualificationCsvFields &
  SkillCsvFields &
  DocumentCsvFields &
  StatutoryCsvFields;

export interface ImportRowResult {
  rowNumber: number;
  success: boolean;
  profileId?: string;
  candidateCode?: string;
  errors?: string[];
  warnings?: string[];
  data?: any; // Row data for debugging/display
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: ImportRowResult[];
}

export interface ImportOptions {
  importType: 'candidate' | 'worker';
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

/**
 * Note: Related entity DTOs (Address, BankAccount, Document, Qualification, etc.)
 * are now in their respective domain folders. Import from:
 * - @/types/domain/address
 * - @/types/domain/bank-account
 * - @/types/domain/document
 * - @/types/domain/qualification
 * - @/types/domain/interaction
 * - @/types/domain/blacklist
 */
