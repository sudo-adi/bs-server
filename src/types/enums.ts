// Database Enum Types
// This file contains all enum values used across the application

// Profile Stage Enum
export enum ProfileStage {
  NEW_REGISTRATION = 'new_registration',
  SCREENING = 'screening',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  TRAINING = 'training', // Legacy value
  TRAINED = 'trained',
  ALLOCATED = 'allocated',
  ONBOARDED = 'onboarded',
  DEPLOYED = 'deployed',
  ON_HOLD = 'on_hold',
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
export enum ProjectWorkerAssignmentStatus {
  MATCHED = 'matched',
  SHARED = 'shared',
}

export const PROJECT_MATCHED_PROFILE_STATUSES = Object.values(ProjectWorkerAssignmentStatus);

// Project Status Enum
export enum ProjectStatus {
  PLANNING = 'planning',
  APPROVED = 'approved',
  WORKERS_SHARED = 'workers_shared',
  ONGOING = 'ongoing',
  REQUIREMENT_NOT_FULFILLED = 'requirement_not_fulfilled',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  SHORT_CLOSED = 'short_closed',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled',
}

export const PROJECT_STATUSES = Object.values(ProjectStatus);

// Project Hold Attributable To Enum
export enum ProjectHoldAttributableTo {
  EMPLOYER = 'employer',
  BUILDSEWA = 'buildsewa',
  FORCE_MAJEURE = 'force_majeure',
}

export const PROJECT_HOLD_ATTRIBUTABLE_TO_VALUES = Object.values(ProjectHoldAttributableTo);

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
  [ProfileStage.NEW_REGISTRATION]: [ProfileStage.SCREENING, ProfileStage.APPROVED, ProfileStage.REJECTED],
  [ProfileStage.SCREENING]: [ProfileStage.APPROVED, ProfileStage.REJECTED],
  [ProfileStage.APPROVED]: [ProfileStage.TRAINING, ProfileStage.ONBOARDED, ProfileStage.BENCHED],
  [ProfileStage.REJECTED]: [], // Terminal state
  [ProfileStage.TRAINING]: [ProfileStage.TRAINED, ProfileStage.REJECTED], // Legacy
  [ProfileStage.TRAINED]: [ProfileStage.ONBOARDED],
  [ProfileStage.ONBOARDED]: [ProfileStage.ALLOCATED],
  [ProfileStage.ALLOCATED]: [ProfileStage.DEPLOYED, ProfileStage.BENCHED],
  [ProfileStage.DEPLOYED]: [ProfileStage.BENCHED, ProfileStage.ALLOCATED, ProfileStage.ON_HOLD],
  [ProfileStage.ON_HOLD]: [ProfileStage.DEPLOYED, ProfileStage.BENCHED, ProfileStage.TRAINING],
  [ProfileStage.BENCHED]: [ProfileStage.ALLOCATED, ProfileStage.DEPLOYED],
};

// Project Status transition rules
export const PROJECT_STATUS_TRANSITION_RULES: Record<string, ProjectStatus[]> = {
  [ProjectStatus.PLANNING]: [ProjectStatus.APPROVED, ProjectStatus.CANCELLED],
  [ProjectStatus.APPROVED]: [
    ProjectStatus.WORKERS_SHARED,
    ProjectStatus.REQUIREMENT_NOT_FULFILLED,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.WORKERS_SHARED]: [ProjectStatus.ONGOING, ProjectStatus.CANCELLED],
  [ProjectStatus.REQUIREMENT_NOT_FULFILLED]: [
    ProjectStatus.WORKERS_SHARED,
    ProjectStatus.CANCELLED,
  ],
  [ProjectStatus.ONGOING]: [
    ProjectStatus.ON_HOLD,
    ProjectStatus.COMPLETED,
    ProjectStatus.SHORT_CLOSED,
    ProjectStatus.TERMINATED,
  ],
  [ProjectStatus.ON_HOLD]: [ProjectStatus.ONGOING, ProjectStatus.TERMINATED],
  [ProjectStatus.COMPLETED]: [], // Terminal state
  [ProjectStatus.SHORT_CLOSED]: [], // Terminal state
  [ProjectStatus.TERMINATED]: [], // Terminal state
  [ProjectStatus.CANCELLED]: [], // Terminal state
};

// Helper function to validate stage transitions
export function isValidStageTransition(fromStage: ProfileStage, toStage: ProfileStage): boolean {
  const allowedTransitions = STAGE_TRANSITION_RULES[fromStage] || [];
  return allowedTransitions.includes(toStage);
}

// Helper function to validate project status transitions
export function isValidProjectStatusTransition(
  fromStatus: ProjectStatus,
  toStatus: ProjectStatus
): boolean {
  const allowedTransitions = PROJECT_STATUS_TRANSITION_RULES[fromStatus] || [];
  return allowedTransitions.includes(toStatus);
}

// Helper function to check if status requires documents
export function projectStatusRequiresDocuments(status: ProjectStatus): boolean {
  return [
    ProjectStatus.ON_HOLD,
    ProjectStatus.COMPLETED,
    ProjectStatus.SHORT_CLOSED,
    ProjectStatus.TERMINATED,
  ].includes(status);
}

// Helper function to check if status requires attributable_to field
export function projectStatusRequiresAttributable(status: ProjectStatus): boolean {
  return status === ProjectStatus.ON_HOLD;
}

// Map batch enrollment status to profile stage
export function mapBatchEnrollmentStatusToProfileStage(
  enrollmentStatus: BatchEnrollmentStatus
): ProfileStage | null {
  switch (enrollmentStatus) {
    case BatchEnrollmentStatus.ENROLLED:
    case BatchEnrollmentStatus.IN_PROGRESS:
      return ProfileStage.TRAINING;
    case BatchEnrollmentStatus.COMPLETED:
      return ProfileStage.TRAINED;
    case BatchEnrollmentStatus.DROPPED:
    case BatchEnrollmentStatus.FAILED:
      return null; // Don't auto-update stage for failed/dropped
    default:
      return null;
  }
}

// Map project matched profile status to profile stage
export function mapProjectWorkerAssignmentStatusToProfileStage(
  matchedStatus: ProjectWorkerAssignmentStatus
): ProfileStage | null {
  switch (matchedStatus) {
    case ProjectWorkerAssignmentStatus.MATCHED:
      return ProfileStage.ALLOCATED;
    case ProjectWorkerAssignmentStatus.SHARED:
      return ProfileStage.ONBOARDED;
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
