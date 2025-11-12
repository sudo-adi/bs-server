// Database Enum Types
// This file contains all enum values used across the application

// Profile Stage Enum
export enum ProfileStage {
  NEW_REGISTRATION = 'new registration',
  NEW_JOINEE = 'new_joinee',
  SCREENING = 'screening',
  INTERVIEWED = 'interviewed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  TRAINING = 'training', // Legacy value
  IN_TRAINING = 'in_training',
  TRAINED = 'trained',
  ONBOARDED = 'onboarded',
  ALLOCATED = 'allocated',
  DEPLOYED = 'deployed',
  BENCHED = 'benched',
}

export const PROFILE_STAGES = Object.values(ProfileStage);

// Batch Enrollment Status Enum
export enum BatchEnrollmentStatus {
  ENROLLED = 'enrolled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
  FAILED = 'failed',
}

export const BATCH_ENROLLMENT_STATUSES = Object.values(BatchEnrollmentStatus);

// Project Assignment Status Enum
export enum ProjectAssignmentStatus {
  ASSIGNED = 'assigned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
}

export const PROJECT_ASSIGNMENT_STATUSES = Object.values(ProjectAssignmentStatus);

// Project Matched Profile Status Enum
export enum ProjectMatchedProfileStatus {
  MATCHED = 'matched',
  SHARED = 'shared',
  ONBOARDED = 'onboarded',
}

export const PROJECT_MATCHED_PROFILE_STATUSES = Object.values(ProjectMatchedProfileStatus);

// Project Status Enum
export enum ProjectStatus {
  PLANNING = 'planning',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const PROJECT_STATUSES = Object.values(ProjectStatus);

// Project Request Status Enum
export enum ProjectRequestStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  PROJECT_CREATED = 'project_created',
  REJECTED = 'rejected',
}

export const PROJECT_REQUEST_STATUSES = Object.values(ProjectRequestStatus);

// Verification Status Enum (for Bank Accounts and Documents)
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
}

export const VERIFICATION_STATUSES = Object.values(VerificationStatus);

// Training Batch Status Enum
export enum TrainingBatchStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const TRAINING_BATCH_STATUSES = Object.values(TrainingBatchStatus);

// Helper function to validate enum values
export function isValidEnumValue<T extends string>(value: string, enumValues: T[]): value is T {
  return enumValues.includes(value as T);
}

// Stage transition rules
export const STAGE_TRANSITION_RULES: Record<string, ProfileStage[]> = {
  [ProfileStage.NEW_REGISTRATION]: [
    ProfileStage.NEW_JOINEE,
    ProfileStage.SCREENING,
    ProfileStage.REJECTED,
  ],
  [ProfileStage.NEW_JOINEE]: [ProfileStage.SCREENING, ProfileStage.REJECTED],
  [ProfileStage.SCREENING]: [
    ProfileStage.INTERVIEWED,
    ProfileStage.APPROVED,
    ProfileStage.REJECTED,
  ],
  [ProfileStage.INTERVIEWED]: [ProfileStage.APPROVED, ProfileStage.REJECTED],
  [ProfileStage.APPROVED]: [
    ProfileStage.TRAINING,
    ProfileStage.IN_TRAINING,
    ProfileStage.ONBOARDED,
  ],
  [ProfileStage.REJECTED]: [], // Terminal state
  [ProfileStage.TRAINING]: [ProfileStage.TRAINED, ProfileStage.REJECTED], // Legacy
  [ProfileStage.IN_TRAINING]: [ProfileStage.TRAINED, ProfileStage.REJECTED],
  [ProfileStage.TRAINED]: [ProfileStage.ONBOARDED],
  [ProfileStage.ONBOARDED]: [ProfileStage.ALLOCATED],
  [ProfileStage.ALLOCATED]: [ProfileStage.DEPLOYED, ProfileStage.BENCHED],
  [ProfileStage.DEPLOYED]: [ProfileStage.BENCHED, ProfileStage.ALLOCATED],
  [ProfileStage.BENCHED]: [ProfileStage.ALLOCATED, ProfileStage.DEPLOYED],
};

// Helper function to validate stage transitions
export function isValidStageTransition(fromStage: ProfileStage, toStage: ProfileStage): boolean {
  const allowedTransitions = STAGE_TRANSITION_RULES[fromStage] || [];
  return allowedTransitions.includes(toStage);
}

// Map batch enrollment status to profile stage
export function mapBatchEnrollmentStatusToProfileStage(
  enrollmentStatus: BatchEnrollmentStatus
): ProfileStage | null {
  switch (enrollmentStatus) {
    case BatchEnrollmentStatus.ENROLLED:
    case BatchEnrollmentStatus.IN_PROGRESS:
      return ProfileStage.IN_TRAINING;
    case BatchEnrollmentStatus.COMPLETED:
      return ProfileStage.TRAINED;
    case BatchEnrollmentStatus.DROPPED:
    case BatchEnrollmentStatus.FAILED:
      return null; // Don't auto-update stage for failed/dropped
    default:
      return null;
  }
}

// Map project assignment status to profile stage
export function mapProjectAssignmentStatusToProfileStage(
  assignmentStatus: ProjectAssignmentStatus
): ProfileStage | null {
  switch (assignmentStatus) {
    case ProjectAssignmentStatus.ASSIGNED:
      return ProfileStage.ALLOCATED;
    case ProjectAssignmentStatus.ACTIVE:
      return ProfileStage.DEPLOYED;
    case ProjectAssignmentStatus.COMPLETED:
    case ProjectAssignmentStatus.TERMINATED:
      return ProfileStage.BENCHED;
    default:
      return null;
  }
}
