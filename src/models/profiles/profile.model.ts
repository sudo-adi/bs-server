/**
 * Profile model - Re-exports types from Prisma schema
 * Uses centralized Prisma types instead of duplicating definitions
 */

// Re-export core Profile type from Prisma types
export type {
  Address,
  BankAccount,
  Document,
  Interaction,
  Profile,
  Qualification,
  StageTransition,
} from '@/types/prisma.types';

// Re-export profile-specific DTOs
export type { CreateProfileDto, UpdateProfileDto } from '@/types/prisma.types';

// Import required types for custom DTOs
import type {
  addresses,
  bank_accounts,
  batch_enrollments,
  documents,
  interactions,
  profile_skills,
  profiles,
  project_assignments,
  qualifications,
  stage_transitions,
  training_batches,
} from '@/generated/prisma';

// Custom DTOs specific to profile operations
export interface ChangeStageDto {
  to_stage: string;
  notes?: string;
  user_id: string; // UUID
}

export interface BlacklistProfileDto {
  reason: string;
  user_id: string; // UUID
}

// Profile with all related data
export interface ProfileWithDetails extends profiles {
  current_stage?: string | null; // Derived from latest stage_transitions
  addresses?: addresses[];
  profile_skills?: profile_skills[];
  qualifications?: qualifications[];
  batch_enrollments?: (batch_enrollments & {
    training_batches?: training_batches | null;
    training_days_left?: number | null; // Calculated field
  })[];
  interactions?: interactions[];
  documents?: documents[];
  bank_accounts?: bank_accounts[];
  stage_transitions?: stage_transitions[];
  project_assignments?: project_assignments[];
}
