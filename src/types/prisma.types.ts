/**
 * Central type definitions based on Prisma schema
 * These types extend Prisma generated types with application-specific DTOs
 */

import type {
  activity_logs,
  addresses,
  bank_accounts,
  batch_enrollments,
  document_categories,
  documents,
  employer_authorized_persons,
  employers,
  interaction_types,
  interactions,
  news_updates,
  profile_blacklist,
  profile_skills,
  profiles,
  project_assignments,
  project_financials,
  project_matched_profiles,
  project_request_requirements,
  project_requests,
  project_resource_requirements,
  projects,
  qualification_types,
  qualifications,
  role_permissions,
  roles,
  scraper_websites,
  skill_categories,
  social_media_platform_posts,
  social_media_posts,
  stage_transitions,
  training_batches,
  users,
} from '@/generated/prisma';

// Re-export Prisma types
export type {
  activity_logs as ActivityLog,
  addresses as Address,
  bank_accounts as BankAccount,
  batch_enrollments as BatchEnrollment,
  documents as Document,
  document_categories as DocumentCategory,
  employers as Employer,
  employer_authorized_persons as EmployerAuthorizedPerson,
  interactions as Interaction,
  interaction_types as InteractionType,
  news_updates as NewsUpdate,
  profiles as Profile,
  profile_blacklist as ProfileBlacklist,
  profile_skills as ProfileSkill,
  projects as Project,
  project_assignments as ProjectAssignment,
  project_financials as ProjectFinancials,
  project_matched_profiles as ProjectMatchedProfile,
  project_requests as ProjectRequest,
  project_request_requirements as ProjectRequestRequirement,
  project_resource_requirements as ProjectResourceRequirement,
  qualifications as Qualification,
  qualification_types as QualificationType,
  roles as Role,
  role_permissions as RolePermission,
  scraper_websites as ScraperWebsite,
  skill_categories as SkillCategory,
  social_media_platform_posts as SocialMediaPlatformPost,
  social_media_posts as SocialMediaPost,
  stage_transitions as StageTransition,
  training_batches as TrainingBatch,
  users as User,
};

// User DTOs
export interface CreateUserDto {
  email: string;
  username?: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_active?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_active?: boolean;
  last_login?: Date;
}

export interface UserWithRoles extends users {
  role?: roles | null;
}

// Profile DTOs - Aligned with profiles table schema
export interface CreateProfileDto {
  candidate_code?: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  first_name: string;
  middle_name?: string;
  last_name?: string;
  fathers_name?: string;
  gender?: string;
  date_of_birth?: Date;
  profile_photo_url?: string;
  is_active?: boolean;
}

export interface UpdateProfileDto {
  phone?: string;
  alt_phone?: string;
  email?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  fathers_name?: string;
  gender?: string;
  date_of_birth?: Date;
  profile_photo_url?: string;
  is_active?: boolean;
}

export interface ProfileWithRelations extends profiles {
  addresses?: addresses[];
  bank_accounts?: bank_accounts[];
  documents?: documents[];
  qualifications?: qualifications[];
  profile_skills?: profile_skills[];
  batch_enrollments?: batch_enrollments[];
  project_assignments?: project_assignments[];
  project_matched_profiles?: project_matched_profiles[];
  stage_transitions?: stage_transitions[];
  profile_blacklist?: profile_blacklist[];
}

// Project DTOs
export interface CreateProjectDto {
  name: string; // project name
  code?: string; // Auto-generated if not provided
  employer_id: string;
  location?: string;
  contact_phone?: string;
  deployment_date?: Date;
  award_date?: Date;
  start_date?: Date;
  end_date?: Date;
  revised_completion_date?: Date;
  status?: string;
  project_manager?: string;
  description?: string;
  po_co_number?: string;
  is_active?: boolean;
  is_accommodation_provided?: boolean;
  // Financial fields (stored in project_financials table)
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

export interface UpdateProjectDto {
  name?: string; // project name
  employer_id?: string;
  location?: string;
  contact_phone?: string;
  deployment_date?: Date;
  award_date?: Date;
  start_date?: Date;
  end_date?: Date;
  revised_completion_date?: Date;
  status?: string;
  project_manager?: string;
  description?: string;
  po_co_number?: string;
  is_active?: boolean;
  is_accommodation_provided?: boolean;
  // Financial fields (stored in project_financials table)
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

export interface ProjectWithDetails extends projects {
  employers?: employers | null;
  project_resource_requirements?: project_resource_requirements[];
  project_assignments?: project_assignments[];
  project_requests?: project_requests[];
  project_matched_profiles?: project_matched_profiles[];
  project_financials?: project_financials | null;
  project_request_requirements?: project_request_requirements[];
}

// Employer DTOs
export interface CreateEmployerDto {
  company_name: string;
  client_name: string;
  email: string;
  password: string;
  phone: string;
  alt_phone?: string;
  registered_address?: string;
  company_registration_number?: string;
  gst_number?: string;

  // Authorized Person Details (Required)
  authorized_person_name: string;
  authorized_person_designation: string;
  authorized_person_email: string;
  authorized_person_contact: string;
  authorized_person_address: string;
}

export interface UpdateEmployerDto {
  company_name?: string;
  client_name?: string;
  email?: string;
  phone?: string;
  alt_phone?: string;
  registered_address?: string;
  company_registration_number?: string;
  gst_number?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface RegisterEmployerDto {
  // Employer/Company Details
  company_name: string;
  client_name: string;
  email: string;
  password: string;
  phone: string;
  alt_phone?: string;
  registered_address?: string;
  company_registration_number?: string;
  gst_number?: string;

  // Authorized Person Details (Required)
  authorized_person_name: string;
  authorized_person_designation: string;
  authorized_person_email: string;
  authorized_person_contact: string;
  authorized_person_address: string;

  // Project Information (Required)
  project_name: string;
  project_description: string;
  site_address: string;
  city: string;
  district: string;
  state: string;
  landmark?: string;
  postal_code: string;

  // Optional project fields
  project_type?: string;
  duration_months?: number;

  // Worker Requirements (Required)
  worker_requirements: Array<{
    category: string;
    count: number;
  }>;
}

export interface VerifyEmployerDto {
  verified_by_user_id: string;
}

export interface EmployerLoginDto {
  email: string;
  password: string;
}

// Extended employer types with relations
export interface EmployerWithProjects extends employers {
  projects?: projects[];
  employer_authorized_persons?: employer_authorized_persons[];
  project_requests?: project_requests[];
}

export interface EmployerWithDetails extends employers {
  projects?: projects[];
  employer_authorized_persons?: employer_authorized_persons[];
  project_requests?: project_requests[];
  users_employers_verified_by_user_idTousers?: users | null;
  users_employers_deleted_by_user_idTousers?: users | null;
}

export interface ProjectRequestWithDetails extends project_requests {
  employers?: employers | null;
  projects?: projects | null;
  users?: users | null;
}

// Training Batch DTOs - Aligned with Prisma schema
export interface CreateTrainingBatchDto {
  name: string; // Prisma: name @db.VarChar(255)
  program_name: string; // Prisma: program_name @db.VarChar(255)
  skill_category_id?: string; // Prisma: skill_category_id @db.Uuid - Training is for specific skill
  provider?: string; // Prisma: provider @db.VarChar(255)
  trainer_name?: string; // Prisma: trainer_name @db.VarChar(255)
  start_date?: Date; // Prisma: start_date @db.Date
  end_date?: Date; // Prisma: end_date @db.Date
  duration_days?: number; // Prisma: duration_days Int
  max_capacity?: number; // Prisma: max_capacity Int
  status?: string; // Prisma: status @default("upcoming") @db.VarChar(50)
  location?: string; // Prisma: location @db.VarChar(255)
  description?: string; // Prisma: description String
  created_by_user_id?: string; // Prisma: created_by_user_id @db.Uuid
}

export interface UpdateTrainingBatchDto {
  name?: string;
  program_name?: string;
  skill_category_id?: string;
  provider?: string;
  trainer_name?: string;
  start_date?: Date;
  end_date?: Date;
  duration_days?: number;
  max_capacity?: number;
  status?: string;
  location?: string;
  description?: string;
}

export interface TrainingBatchWithEnrollments extends training_batches {
  batch_enrollments?: (batch_enrollments & {
    profiles?: profiles | null;
  })[];
  skill_categories?: skill_categories | null;
  enrolled_count?: number; // Virtual field: count of active enrollments
}

// Batch Enrollment DTOs - Aligned with Prisma schema
export interface CreateBatchEnrollmentDto {
  profile_id: string; // Prisma: profile_id @db.Uuid
  batch_id: string; // Prisma: batch_id @db.Uuid
  enrollment_date?: Date; // Prisma: enrollment_date @default(now()) @db.Timestamp(6)
  status?: string; // Prisma: status @default("enrolled") @db.VarChar(50)
  notes?: string; // Prisma: notes String
  enrolled_by_user_id?: string; // Prisma: enrolled_by_user_id @db.Uuid
}

export interface UpdateBatchEnrollmentDto {
  status?: string; // Prisma: status @db.VarChar(50)
  completion_date?: Date; // Prisma: completion_date @db.Date
  attendance_percentage?: number; // Prisma: attendance_percentage @db.Decimal(5, 2)
  score?: number; // Prisma: score @db.Decimal(5, 2)
  notes?: string; // Prisma: notes String
}

export interface BatchEnrollmentWithDetails extends batch_enrollments {
  profiles?: profiles & {
    profile_skills?: (profile_skills & {
      skill_categories?: skill_categories | null;
    })[];
  } | null;
  training_batches?: training_batches | null;
  primary_skill_category_id?: string; // Virtual field
  primary_skill_category_name?: string; // Virtual field
}

// Project Assignment DTOs (formerly Project Deployment)
export interface CreateProjectAssignmentDto {
  profile_id: string;
  project_id: string;
  assignment_date?: Date; // Maps to deployment_date in DB
  expected_end_date?: Date;
  status?: string;
  assigned_by_user_id?: string;
}

export interface UpdateProjectAssignmentDto {
  expected_end_date?: Date;
  actual_end_date?: Date;
  status?: string;
  performance_rating?: number;
}

// Legacy alias for backward compatibility
export type CreateProjectDeploymentDto = CreateProjectAssignmentDto;
export type UpdateProjectDeploymentDto = UpdateProjectAssignmentDto;

// Address DTOs
export interface CreateAddressDto {
  profile_id: string;
  address_type?: string;
  house_number?: string;
  village_or_city?: string;
  district?: string;
  state?: string;
  postal_code?: string;
  landmark?: string;
  police_station?: string;
  post_office?: string;
  is_current?: boolean;
}

export interface UpdateAddressDto {
  address_type?: string;
  house_number?: string;
  village_or_city?: string;
  district?: string;
  state?: string;
  postal_code?: string;
  landmark?: string;
  police_station?: string;
  post_office?: string;
  is_current?: boolean;
}

// Bank Account DTOs
export interface CreateBankAccountDto {
  profile_id: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name?: string;
  branch_name?: string;
  account_type?: string;
  is_primary?: boolean;
}

export interface UpdateBankAccountDto {
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  branch_name?: string;
  account_type?: string;
  is_primary?: boolean;
  is_verified?: boolean;
  verification_status?: string;
  verified_at?: Date;
  verified_by_user_id?: string;
}

// Document DTOs
export interface CreateDocumentDto {
  profile_id?: string;
  document_category_id?: string;
  qualification_id?: string;
  batch_enrollment_id?: string;
  document_number?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  expiry_date?: Date;
  uploaded_by_user_id?: string;
}

export interface UpdateDocumentDto {
  document_category_id?: string;
  document_number?: string;
  file_name?: string;
  file_url?: string;
  file_size?: number;
  verification_status?: string;
  verified_at?: Date;
  verified_by_user_id?: string;
  expiry_date?: Date;
}

// Qualification DTOs - Aligned with qualifications table schema
export interface CreateQualificationDto {
  profile_id: string;
  qualification_type_id?: string;
  institution_name?: string;
  field_of_study?: string;
  year_of_completion?: number;
  percentage_or_grade?: string;
}

export interface UpdateQualificationDto {
  qualification_type_id?: string;
  institution_name?: string;
  field_of_study?: string;
  year_of_completion?: number;
  percentage_or_grade?: string;
}

// Profile Skill DTOs - Aligned with profile_skills table
export interface CreateProfileSkillDto {
  profile_id: string;
  skill_category_id: string;
  years_of_experience?: number;
  is_primary?: boolean;
  verified_by_user_id?: string;
}

export interface UpdateProfileSkillDto {
  skill_category_id?: string;
  years_of_experience?: number;
  is_primary?: boolean;
}

// Interaction DTOs
export interface CreateInteractionDto {
  profile_id: string;
  interaction_type_id?: string;
  interaction_date?: Date;
  subject?: string;
  description?: string;
  outcome?: string;
  next_follow_up_date?: Date;
  created_by_user_id?: string;
}

export interface UpdateInteractionDto {
  interaction_type_id?: string;
  interaction_date?: Date;
  subject?: string;
  description?: string;
  outcome?: string;
  next_follow_up_date?: Date;
}

// Activity Log DTOs
export interface CreateActivityLogDto {
  user_id: string;
  action: string;
  module: string;
  record_id?: number;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
}

// Common pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

// Common filter types
export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface StatusFilter {
  status?: string | string[];
}

export interface SearchFilter {
  search?: string;
}

// Role DTOs
export interface CreateRoleDto {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface RoleWithPermissions extends roles {
  permissions?: role_permissions[];
}

// Role Permission DTOs
export interface CreateRolePermissionDto {
  role_id: string;
  module_name: string;
  can_view?: boolean;
  can_manage?: boolean;
  can_export?: boolean;
  is_super_admin?: boolean;
}

export interface UpdateRolePermissionDto {
  can_view?: boolean;
  can_manage?: boolean;
  can_export?: boolean;
  is_super_admin?: boolean;
}

// Document Category DTOs
export interface CreateDocumentCategoryDto {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateDocumentCategoryDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// Employer Authorized Person DTOs
export interface CreateEmployerAuthorizedPersonDto {
  employer_id: string;
  name?: string;
  designation?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_primary?: boolean;
}

export interface UpdateEmployerAuthorizedPersonDto {
  name?: string;
  designation?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_primary?: boolean;
}

// Project Request DTOs (employer creates project requests)
export interface CreateProjectRequestDto {
  employer_id: string;
  project_title: string;
  project_description?: string;
  location?: string;
  estimated_start_date?: Date;
  estimated_duration_days?: number;
  estimated_budget?: number;
  additional_notes?: string;
}

export interface UpdateProjectRequestDto {
  project_title?: string;
  project_description?: string;
  location?: string;
  estimated_start_date?: Date;
  estimated_duration_days?: number;
  estimated_budget?: number;
  additional_notes?: string;
  status?: string;
}

export interface ReviewProjectRequestDto {
  reviewed_by_user_id: string;
  status: 'approved' | 'rejected';
  project_id?: string; // If approved, link to created project
}

// Interaction Type DTOs
export interface CreateInteractionTypeDto {
  name: string;
  is_active?: boolean;
}

export interface UpdateInteractionTypeDto {
  name?: string;
  is_active?: boolean;
}

// Profile Blacklist DTOs
export interface CreateProfileBlacklistDto {
  profile_id: string;
  reason?: string;
  blacklisted_by_user_id?: string;
  is_active?: boolean;
}

export interface UpdateProfileBlacklistDto {
  reason?: string;
  unblacklisted_at?: Date;
  unblacklisted_by_user_id?: string;
  is_active?: boolean;
}

// Project Financials DTOs
export interface CreateProjectFinancialsDto {
  project_id: string;
  contract_value?: number;
  revised_contract_value?: number;
  variation_order_value?: number;
  actual_cost_incurred?: number;
  misc_cost?: number;
  budget?: number;
}

export interface UpdateProjectFinancialsDto {
  contract_value?: number;
  revised_contract_value?: number;
  variation_order_value?: number;
  actual_cost_incurred?: number;
  misc_cost?: number;
  budget?: number;
}

// Project Matched Profile DTOs
export interface CreateProjectMatchedProfileDto {
  project_id: string;
  profile_id: string;
  skill_category_id: string;
  shared_with_employer?: boolean;
  status?: string;
  match_score?: number;
  is_benched?: boolean;
  is_trained?: boolean;
  shared_by_user_id?: string;
}

export interface UpdateProjectMatchedProfileDto {
  shared_with_employer?: boolean;
  shared_at?: Date;
  shared_by_user_id?: string;
  status?: string;
  employer_notes?: string;
  employer_reviewed_at?: Date;
  match_score?: number;
  is_benched?: boolean;
  is_trained?: boolean;
}

export interface ProjectMatchedProfileWithDetails extends project_matched_profiles {
  profiles?: profiles;
  projects?: projects;
  skill_categories?: skill_categories;
  users?: users | null;
}

// Qualification Type DTOs
export interface CreateQualificationTypeDto {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateQualificationTypeDto {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// Project Request Requirements DTOs
export interface CreateProjectRequestRequirementDto {
  project_request_id: string;
  skill_category_id: string;
  required_count: number;
  notes?: string;
}

export interface UpdateProjectRequestRequirementDto {
  skill_category_id?: string;
  required_count?: number;
  notes?: string;
}
