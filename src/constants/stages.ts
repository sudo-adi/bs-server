/**
 * Profile Stage Constants
 * Centralized constants for all profile stages used throughout the system
 *
 * USAGE GUIDE:
 * - NEW_REGISTRATION: Initial signup, no BSC code assigned yet
 * - SCREENING: Under review by admin
 * - APPROVED: BSC code gets assigned at this stage
 * - REJECTED: Candidate rejected
 * - TRAINING_SCHEDULED: Enrolled in training batch, not yet started
 * - IN_TRAINING: Currently in active training (batch is ongoing)
 * - TRAINED: Completed training, ready to become worker
 * - WORKER: BSW code gets assigned, active worker
 * - BENCHED: Worker not assigned to any project
 * - MATCHED: Worker matched/selected for a project (internal selection)
 * - ASSIGNED: Worker assigned to project, shared with employer
 * - ONBOARDED: Worker onboarded to project
 * - ON_SITE: Worker deployed on project site (project started/ongoing)
 * - ON_HOLD: Worker/Project temporarily on hold
 */
export const PROFILE_STAGES = {
  // Initial registration stages (No BSC code)
  NEW_REGISTRATION: 'NEW_REGISTRATION',
  SCREENING: 'SCREENING',

  // Candidate stages (BSC code assigned when APPROVED)
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',

  // Training stages
  TRAINING_SCHEDULED: 'TRAINING_SCHEDULED',
  IN_TRAINING: 'IN_TRAINING',
  TRAINED: 'TRAINED',

  // Worker stages (BSW code assigned when WORKER)
  WORKER: 'WORKER',
  BENCHED: 'BENCHED',
  MATCHED: 'MATCHED',
  ASSIGNED: 'ASSIGNED',
  ONBOARDED: 'ONBOARDED',
  ON_SITE: 'ON_SITE',
  ON_HOLD: 'ON_HOLD',
} as const;

export type ProfileStage = (typeof PROFILE_STAGES)[keyof typeof PROFILE_STAGES];

/**
 * Stage to Code Assignment Mapping
 * Defines which stages trigger code assignment
 */
export const STAGE_CODE_ASSIGNMENT = {
  // BSC code assignment stages
  BSC_CODE_STAGES: [PROFILE_STAGES.APPROVED],

  // BSW code assignment stages
  BSW_CODE_STAGES: [PROFILE_STAGES.WORKER],

  // Stages before any code
  NO_CODE_STAGES: [
    PROFILE_STAGES.NEW_REGISTRATION,
    PROFILE_STAGES.SCREENING,
    PROFILE_STAGES.REJECTED,
  ],
} as const;

// Stages that allow project allocation
export const PROJECT_ALLOCATABLE_STAGES: ProfileStage[] = [
  PROFILE_STAGES.BENCHED,
  PROFILE_STAGES.TRAINED,
];

// Stages that indicate active training
export const TRAINING_STAGES: ProfileStage[] = [
  PROFILE_STAGES.TRAINING_SCHEDULED,
  PROFILE_STAGES.IN_TRAINING,
];

/**
 * Project Stage Constants
 * Used for: Project lifecycle management
 *
 * LIFECYCLE: APPROVED → PLANNING → SHARED → ONGOING → [END STATES]
 *
 * USAGE GUIDE:
 * - APPROVED: BS team approved project (initial stage when created)
 * - PLANNING: Started planning and filling worker requirements
 * - SHARED: Worker details shared with employer, awaiting project start
 * - ONGOING: Project active, workers on site
 * - ON_HOLD: Temporarily paused
 * - TERMINATED: Ended due to issues (after start)
 * - CANCELLED: Project cancelled (before or after start)
 * - SHORT_CLOSED: Closed before expected completion date
 * - COMPLETED: Successfully completed
 */
export const PROJECT_STAGES = {
  APPROVED: 'approved',
  PLANNING: 'planning',
  SHARED: 'shared',
  ONGOING: 'ongoing',
  ON_HOLD: 'on_hold',
  TERMINATED: 'terminated',
  CANCELLED: 'cancelled',
  SHORT_CLOSED: 'short_closed',
  COMPLETED: 'completed',
} as const;

export type ProjectStage = (typeof PROJECT_STAGES)[keyof typeof PROJECT_STAGES];

// Backward compatibility alias
export const PROJECT_STATUSES = PROJECT_STAGES;
export type ProjectStatus = ProjectStage;

/**
 * Project Document Type Constants
 * Used for: Categorizing documents attached to stage transitions
 */
export const PROJECT_DOCUMENT_TYPES = {
  // Stage transition documents
  START_PLANNING_DOC: 'START_PLANNING_DOC',
  SHARE_DOC: 'SHARE_DOC',
  START_PROJECT_DOC: 'START_PROJECT_DOC',
  HOLD_DOC: 'HOLD_DOC',
  RESUME_DOC: 'RESUME_DOC',
  COMPLETE_DOC: 'COMPLETE_DOC',
  SHORT_CLOSE_DOC: 'SHORT_CLOSE_DOC',
  TERMINATE_DOC: 'TERMINATE_DOC',
  CANCEL_DOC: 'CANCEL_DOC',

  // General project documents
  CONTRACT: 'CONTRACT',
  AGREEMENT: 'AGREEMENT',
  WORK_ORDER: 'WORK_ORDER',
  OTHER: 'OTHER',
} as const;

export type ProjectDocumentType = (typeof PROJECT_DOCUMENT_TYPES)[keyof typeof PROJECT_DOCUMENT_TYPES];

/**
 * Project Worker Assignment Status Constants
 * Used for: project_worker_assignments table status field
 *
 * LIFECYCLE: MATCHED → ASSIGNED → ON_SITE → COMPLETED/REMOVED
 *
 * USAGE GUIDE:
 * - MATCHED: Worker matched/selected for project (internal selection)
 * - ASSIGNED: Worker assigned to project, shared with employer
 * - ON_SITE: Worker deployed on site, project ongoing
 * - ON_HOLD: Assignment temporarily paused
 * - COMPLETED: Worker completed project work
 * - REMOVED: Worker removed from project
 */
export const ASSIGNMENT_STATUSES = {
  MATCHED: 'MATCHED',
  ASSIGNED: 'ASSIGNED',
  ON_SITE: 'ON_SITE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  REMOVED: 'REMOVED',
} as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[keyof typeof ASSIGNMENT_STATUSES];

/**
 * On-hold Attribution Types
 * Used to determine worker stage when project goes on hold
 *
 * BUSINESS RULES:
 * - EMPLOYER: Workers stay DEPLOYED (employer is responsible for delay)
 * - BUILDSEWA: Workers go to ON_HOLD (BuildSewa is responsible)
 * - FORCE_MAJEURE: Workers go to ON_HOLD (external factors)
 */
export const HOLD_ATTRIBUTIONS = {
  EMPLOYER: 'EMPLOYER',
  BUILDSEWA: 'BUILDSEWA',
  FORCE_MAJEURE: 'FORCE_MAJEURE',
} as const;

export type HoldAttribution = (typeof HOLD_ATTRIBUTIONS)[keyof typeof HOLD_ATTRIBUTIONS];

/**
 * Training Enrollment Status Constants
 * Used for: batch_enrollments table status field
 *
 * USAGE GUIDE:
 * - ENROLLED: Currently enrolled in training batch
 * - COMPLETED: Successfully completed training
 * - DROPPED: Left training before completion
 */
export const ENROLLMENT_STATUSES = {
  ENROLLED: 'ENROLLED',
  COMPLETED: 'COMPLETED',
  DROPPED: 'DROPPED',
} as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[keyof typeof ENROLLMENT_STATUSES];

/**
 * Employer Status Constants
 * Used for: employers table status field
 *
 * USAGE GUIDE:
 * - NEW: Just registered, awaiting approval
 * - APPROVED: Verified and approved to create projects
 * - REJECTED: Application rejected
 * - BLACKLISTED: Permanently blocked
 */
export const EMPLOYER_STATUSES = {
  NEW: 'NEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  BLACKLISTED: 'BLACKLISTED',
} as const;

export type EmployerStatus = (typeof EMPLOYER_STATUSES)[keyof typeof EMPLOYER_STATUSES];

/**
 * Training Batch Status Constants
 * Used for: training_batches table status field
 *
 * USAGE GUIDE:
 * - UPCOMING: Training scheduled but not started
 * - ONGOING: Training currently in progress
 * - COMPLETED: Training finished
 * - CANCELLED: Training cancelled
 */
export const TRAINING_BATCH_STATUSES = {
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type TrainingBatchStatus =
  (typeof TRAINING_BATCH_STATUSES)[keyof typeof TRAINING_BATCH_STATUSES];

/**
 * Helper function to check if a profile stage allows project allocation
 */
export function canAllocateToProject(stage: string | null | undefined): boolean {
  if (!stage) return false;
  return PROJECT_ALLOCATABLE_STAGES.includes(stage as ProfileStage);
}

/**
 * Helper function to check if a profile is currently in training
 */
export function isInTraining(stage: string | null | undefined): boolean {
  if (!stage) return false;
  return TRAINING_STAGES.includes(stage as ProfileStage);
}

/**
 * Get the next worker stage based on attribution when project is on hold
 *
 * Business Rules:
 * - EMPLOYER: Workers remain ON_SITE (employer caused the delay)
 * - BUILDSEWA: Workers go to ON_HOLD (BuildSewa responsible)
 * - FORCE_MAJEURE: Workers go to ON_HOLD (external factors)
 */
export function getHoldWorkerStage(attribution: string): ProfileStage {
  if (attribution === HOLD_ATTRIBUTIONS.EMPLOYER) {
    return PROFILE_STAGES.ON_SITE; // Workers remain on site if employer is responsible
  }
  return PROFILE_STAGES.ON_HOLD; // Workers go to on_hold if buildsewa or force majeure
}

/**
 * Human-readable labels for display
 */
export const PROFILE_STAGE_LABELS: Record<ProfileStage, string> = {
  [PROFILE_STAGES.NEW_REGISTRATION]: 'New Registration',
  [PROFILE_STAGES.SCREENING]: 'Screening',
  [PROFILE_STAGES.APPROVED]: 'Approved',
  [PROFILE_STAGES.REJECTED]: 'Rejected',
  [PROFILE_STAGES.TRAINING_SCHEDULED]: 'Training Scheduled',
  [PROFILE_STAGES.IN_TRAINING]: 'In Training',
  [PROFILE_STAGES.TRAINED]: 'Trained',
  [PROFILE_STAGES.WORKER]: 'Worker',
  [PROFILE_STAGES.BENCHED]: 'Benched',
  [PROFILE_STAGES.MATCHED]: 'Matched',
  [PROFILE_STAGES.ASSIGNED]: 'Assigned',
  [PROFILE_STAGES.ONBOARDED]: 'Onboarded',
  [PROFILE_STAGES.ON_SITE]: 'On Site',
  [PROFILE_STAGES.ON_HOLD]: 'On Hold',
};

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  [PROJECT_STAGES.APPROVED]: 'Approved',
  [PROJECT_STAGES.PLANNING]: 'Planning',
  [PROJECT_STAGES.SHARED]: 'Shared',
  [PROJECT_STAGES.ONGOING]: 'Ongoing',
  [PROJECT_STAGES.ON_HOLD]: 'On Hold',
  [PROJECT_STAGES.TERMINATED]: 'Terminated',
  [PROJECT_STAGES.CANCELLED]: 'Cancelled',
  [PROJECT_STAGES.SHORT_CLOSED]: 'Short Closed',
  [PROJECT_STAGES.COMPLETED]: 'Completed',
};

// Backward compatibility alias
export const PROJECT_STATUS_LABELS = PROJECT_STAGE_LABELS;

export const PROJECT_DOCUMENT_TYPE_LABELS: Record<ProjectDocumentType, string> = {
  [PROJECT_DOCUMENT_TYPES.START_PLANNING_DOC]: 'Start Planning Document',
  [PROJECT_DOCUMENT_TYPES.SHARE_DOC]: 'Share Document',
  [PROJECT_DOCUMENT_TYPES.START_PROJECT_DOC]: 'Start Project Document',
  [PROJECT_DOCUMENT_TYPES.HOLD_DOC]: 'Hold Document',
  [PROJECT_DOCUMENT_TYPES.RESUME_DOC]: 'Resume Document',
  [PROJECT_DOCUMENT_TYPES.COMPLETE_DOC]: 'Completion Document',
  [PROJECT_DOCUMENT_TYPES.SHORT_CLOSE_DOC]: 'Short Close Document',
  [PROJECT_DOCUMENT_TYPES.TERMINATE_DOC]: 'Termination Document',
  [PROJECT_DOCUMENT_TYPES.CANCEL_DOC]: 'Cancellation Document',
  [PROJECT_DOCUMENT_TYPES.CONTRACT]: 'Contract',
  [PROJECT_DOCUMENT_TYPES.AGREEMENT]: 'Agreement',
  [PROJECT_DOCUMENT_TYPES.WORK_ORDER]: 'Work Order',
  [PROJECT_DOCUMENT_TYPES.OTHER]: 'Other',
};

export const EMPLOYER_STATUS_LABELS: Record<EmployerStatus, string> = {
  [EMPLOYER_STATUSES.NEW]: 'New',
  [EMPLOYER_STATUSES.APPROVED]: 'Approved',
  [EMPLOYER_STATUSES.REJECTED]: 'Rejected',
  [EMPLOYER_STATUSES.BLACKLISTED]: 'Blacklisted',
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  [ASSIGNMENT_STATUSES.MATCHED]: 'Matched',
  [ASSIGNMENT_STATUSES.ASSIGNED]: 'Assigned',
  [ASSIGNMENT_STATUSES.ON_SITE]: 'On Site',
  [ASSIGNMENT_STATUSES.ON_HOLD]: 'On Hold',
  [ASSIGNMENT_STATUSES.COMPLETED]: 'Completed',
  [ASSIGNMENT_STATUSES.REMOVED]: 'Removed',
};

export const TRAINING_BATCH_STATUS_LABELS: Record<TrainingBatchStatus, string> = {
  [TRAINING_BATCH_STATUSES.UPCOMING]: 'Upcoming',
  [TRAINING_BATCH_STATUSES.ONGOING]: 'Ongoing',
  [TRAINING_BATCH_STATUSES.COMPLETED]: 'Completed',
  [TRAINING_BATCH_STATUSES.CANCELLED]: 'Cancelled',
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  [ENROLLMENT_STATUSES.ENROLLED]: 'Enrolled',
  [ENROLLMENT_STATUSES.COMPLETED]: 'Completed',
  [ENROLLMENT_STATUSES.DROPPED]: 'Dropped',
};

export const HOLD_ATTRIBUTION_LABELS: Record<HoldAttribution, string> = {
  [HOLD_ATTRIBUTIONS.EMPLOYER]: 'Employer',
  [HOLD_ATTRIBUTIONS.BUILDSEWA]: 'BuildSewa',
  [HOLD_ATTRIBUTIONS.FORCE_MAJEURE]: 'Force Majeure',
};
