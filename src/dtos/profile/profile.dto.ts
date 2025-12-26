import {
  Prisma,
  Profile,
  ProfileCategoryAssignment,
  ProfileRoleAssignment,
} from '@/generated/prisma';
import {
  CreateProfileAddressDto,
  ProfileAddressResponseDto,
  UpdateProfileAddressDto,
} from './profileAddress.dto';
import {
  CreateProfileBankAccountDto,
  ProfileBankAccountResponseDto,
  UpdateProfileBankAccountDto,
} from './profileBankAccount.dto';
import {
  CreateProfileDocumentDto,
  ProfileDocumentResponseDto,
  UpdateProfileDocumentDto,
} from './profileDocument.dto';
import {
  CreateProfileIdentityDto,
  ProfileIdentityResponseDto,
  UpdateProfileIdentityDto,
} from './profileIdentity.dto';
import {
  CreateProfileLanguageDto,
  ProfileLanguageResponseDto,
  UpdateProfileLanguageDto,
} from './profileLanguage.dto';
import {
  CreateProfileQualificationDto,
  ProfileQualificationResponseDto,
  UpdateProfileQualificationDto,
} from './profileQualification.dto';
import {
  CreateProfileSkillDto,
  ProfileSkillResponseDto,
  UpdateProfileSkillDto,
} from './profileSkill.dto';

/**
 * Fields excluded from CreateProfileDto
 * These are auto-generated or system-managed fields
 */
type CreateExcludedFields =
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'candidateCode'
  | 'workerCode'
  | 'candidateCodeAssignedAt'
  | 'workerCodeAssignedAt'
  | 'candidateApprovedAt'
  | 'workerConvertedAt'
  | 'candidateApprovedByProfileId'
  | 'passwordHash'
  | 'deletedAt'
  | 'undeletedAt'
  | 'deactivatedAt'
  | 'reactivatedAt'
  | 'deletedByProfileId'
  | 'undeletedByProfileId'
  | 'deactivatedByProfileId'
  | 'reactivatedByProfileId'
  | 'verifiedAt'
  | 'verifiedByProfileId';

/**
 * Fields excluded from UpdateProfileDto
 * Only excludes immutable fields, allows service to set timestamps
 */
type UpdateExcludedFields = 'id' | 'createdAt' | 'updatedAt' | 'passwordHash';

/**
 * Utility type for nested update operations
 * Adds id and _delete fields for update/delete operations
 */
export type NestedUpdate<T> = T & {
  id?: string;
  _delete?: boolean;
};

/**
 * DTO for profile response with all relations
 * Omits sensitive fields like passwordHash
 */
export type ProfileDto = Omit<Profile, 'passwordHash'> & {
  identity?: ProfileIdentityResponseDto | null;
  addresses?: ProfileAddressResponseDto[];
  bankAccounts?: ProfileBankAccountResponseDto[];
  documents?: ProfileDocumentResponseDto[];
  qualifications?: ProfileQualificationResponseDto[];
  skills?: ProfileSkillResponseDto[];
  languages?: ProfileLanguageResponseDto[];
  roleAssignments?: ProfileRoleAssignment[];
  categoryAssignments?: ProfileCategoryAssignment[];
};

/**
 * DTO for profile list (summary view)
 * Only includes essential fields for listing
 */
export type ProfileListDto = Pick<
  Profile,
  | 'id'
  | 'candidateCode'
  | 'workerCode'
  | 'profilePhotoURL'
  | 'workerType'
  | 'profileType'
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'phone'
  | 'email'
  | 'isActive'
  | 'currentStage'
  | 'createdAt'
  | 'altPhone'
>;
/**
 * DTO for creating profile
 * Omits auto-generated and system-managed fields
 */
export type CreateProfileDto = Partial<Omit<Profile, CreateExcludedFields>> & {
  firstName: string;
  lastName: string;
  phone: string;
  identity?: CreateProfileIdentityDto;
  addresses?: CreateProfileAddressDto[];
  bankAccounts?: CreateProfileBankAccountDto[];
  documents?: CreateProfileDocumentDto[];
  qualifications?: CreateProfileQualificationDto[];
  skills?: CreateProfileSkillDto[];
  languages?: CreateProfileLanguageDto[];
};

/**
 * DTO for updating profile
 * Omits only immutable fields, allows service to set timestamps and codes
 */
export type UpdateProfileDto = Partial<Omit<Profile, UpdateExcludedFields>> & {
  identity?: UpdateProfileIdentityDto;
  addresses?: NestedUpdate<UpdateProfileAddressDto>[];
  bankAccounts?: NestedUpdate<UpdateProfileBankAccountDto>[];
  documents?: NestedUpdate<UpdateProfileDocumentDto>[];
  qualifications?: NestedUpdate<UpdateProfileQualificationDto>[];
  skills?: NestedUpdate<UpdateProfileSkillDto>[];
  languages?: NestedUpdate<UpdateProfileLanguageDto>[];
};

/**
 * Query parameters for listing profiles with filters
 */
export interface ProfileListQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  workerType?: string; // "blue", "white", or "internal"
  profileType?: string; // "worker" or "candidate"
  isActive?: boolean;
  isDeleted?: boolean; // Filter by deleted status (deletedAt is set)
  currentStage?: string;
  gender?: string;
  state?: string;
  candidateCode?: string;
  workerCode?: string;
  codePrefix?: string;
}

/**
 * Response type for profile operations
 */
export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: ProfileDto;
}

/**
 * Response type for profile list
 */
export interface ProfileListResponse {
  success: boolean;
  data: ProfileListDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * DTO for approving candidate
 */
export interface ApproveCandidateDto {
  candidateCode?: string;
}

/**
 * DTO for rejecting candidate
 */
export interface RejectCandidateDto {
  reason: string;
  userId: string;
}

/**
 * DTO for converting candidate to worker
 */
export interface ConvertToWorkerDto {
  workerCode?: string;
  userId?: string;
}

/**
 * DTO for deactivating profile
 */
export interface DeactivateProfileDto {
  reason?: string;
  metadata?: Prisma.JsonValue;
}

/**
 * DTO for reactivating profile
 */
export interface ReactivateProfileDto {
  reason?: string;
  metadata?: Prisma.JsonValue;
}

/**
 * DTO for changing profile stage
 */
export interface ChangeStageDto {
  toStage: string;
  notes?: string;
  userId: string;
}
