/**
 * System-wide status enums based on business rules
 * All values are UPPERCASE for consistency
 */

/**
 * Candidate Training Status
 * Describes the training state of a candidate
 */
export enum CandidateTrainingStatus {
  NOT_TRAINED = 'NOT_TRAINED',
  SCHEDULED = 'SCHEDULED', // Normal training
  SCHEDULED_RESKILL = 'SCHEDULED_RESKILL', // Reskill training
  ONGOING_RESKILL = 'ONGOING_RESKILL', // Reskill training in progress
  TRAINED = 'TRAINED',
}

/**
 * Project Status
 * Describes the current state of a project
 *
 * Flow: APPROVED → PLANNING → ONSITE → [END STATES]
 */
export enum ProjectStatus {
  APPROVED = 'APPROVED', // BS team approved project for planning
  PLANNING = 'PLANNING', // Started planning and filling worker requirements
  ONSITE = 'ONSITE', // Project active on site (workers deployed)
  ON_HOLD = 'ON_HOLD', // Project on hold (affects worker status)
  TERMINATED = 'TERMINATED', // Project was ongoing and terminated
  SHORT_CLOSED = 'SHORT_CLOSED', // Project closed before ending date
  COMPLETED = 'COMPLETED', // Project completed on time
}

/**
 * Worker Status on Project
 * Describes a worker's relationship to a specific project
 */
export enum WorkerStatusOnProject {
  MATCHED = 'MATCHED', // Selected for project
  ALLOCATED = 'ALLOCATED', // Worker allocated to project
  DEPLOYED = 'DEPLOYED', // Worker on site
  ON_HOLD = 'ON_HOLD', // Project is on hold
  COMPLETED = 'COMPLETED', // Worker completed work
  REMOVED = 'REMOVED', // Worker removed from project
}

/**
 * Candidate Status
 * Describes the lifecycle stage of a candidate
 */
export enum CandidateStatus {
  NEW_REGISTRATION = 'NEW_REGISTRATION',
  SCREENING = 'SCREENING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BLACKLISTED = 'BLACKLISTED',
}

/**
 * Training Batch Status
 * Describes the state of a training batch
 */
export enum TrainingBatchStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Trainer Status
 * Describes the current state of a trainer
 */
export enum TrainerStatus {
  ASSIGNED = 'ASSIGNED',
  ON_SITE = 'ON_SITE',
  BENCHED = 'BENCHED',
}

/**
 * Employer Status
 * Describes the lifecycle stage of an employer
 */
export enum EmployerStatus {
  NEW = 'NEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  BLACKLISTED = 'BLACKLISTED',
}

/**
 * Profile Stages (Combined candidate and worker stages)
 * Used for the currentStage field in profiles
 */
export enum ProfileStage {
  // Candidate stages
  NEW_REGISTRATION = 'NEW_REGISTRATION',
  SCREENING = 'SCREENING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',

  // Training stages
  TRAINING = 'TRAINING',
  TRAINED = 'TRAINED',

  // Worker stages
  WORKER = 'WORKER',
  BENCHED = 'BENCHED',
  MATCHED = 'MATCHED',
  ALLOCATED = 'ALLOCATED',
  ONBOARDED = 'ONBOARDED',
  DEPLOYED = 'DEPLOYED',
  ON_HOLD = 'ON_HOLD',
}

/**
 * Hold Attribution
 * Determines worker stage when project goes on hold
 */
export enum HoldAttribution {
  EMPLOYER = 'EMPLOYER', // Workers stay DEPLOYED
  BUILDSEWA = 'BUILDSEWA', // Workers go to ON_HOLD
  FORCE_MAJEURE = 'FORCE_MAJEURE', // Workers go to ON_HOLD
}

/**
 * Enrollment Status
 * Status of worker enrollment in training batch
 */
export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

/**
 * Code Prefixes
 */
export const CODE_PREFIXES = {
  CANDIDATE: 'BSC', // BuildSewa Candidate
  WORKER: 'BSW', // BuildSewa Worker
  EMPLOYER: 'BSE', // BuildSewa Employer
  PROJECT: 'BSP', // BuildSewa Project
  TRAINING_BATCH: 'BST', // BuildSewa Training
} as const;

/**
 * Helper functions for validation
 */
export const isValidCandidateTrainingStatus = (status: string): boolean => {
  return Object.values(CandidateTrainingStatus).includes(status as CandidateTrainingStatus);
};

export const isValidProjectStatus = (status: string): boolean => {
  return Object.values(ProjectStatus).includes(status as ProjectStatus);
};

export const isValidWorkerStatusOnProject = (status: string): boolean => {
  return Object.values(WorkerStatusOnProject).includes(status as WorkerStatusOnProject);
};

export const isValidCandidateStatus = (status: string): boolean => {
  return Object.values(CandidateStatus).includes(status as CandidateStatus);
};

export const isValidTrainingBatchStatus = (status: string): boolean => {
  return Object.values(TrainingBatchStatus).includes(status as TrainingBatchStatus);
};

export const isValidTrainerStatus = (status: string): boolean => {
  return Object.values(TrainerStatus).includes(status as TrainerStatus);
};

export const isValidEmployerStatus = (status: string): boolean => {
  return Object.values(EmployerStatus).includes(status as EmployerStatus);
};

export const isValidProfileStage = (stage: string): boolean => {
  return Object.values(ProfileStage).includes(stage as ProfileStage);
};

export const isValidHoldAttribution = (attribution: string): boolean => {
  return Object.values(HoldAttribution).includes(attribution as HoldAttribution);
};

export const isValidEnrollmentStatus = (status: string): boolean => {
  return Object.values(EnrollmentStatus).includes(status as EnrollmentStatus);
};

/**
 * Status labels for display
 */
export const CANDIDATE_TRAINING_STATUS_LABELS: Record<CandidateTrainingStatus, string> = {
  [CandidateTrainingStatus.NOT_TRAINED]: 'Not Trained',
  [CandidateTrainingStatus.SCHEDULED]: 'Scheduled',
  [CandidateTrainingStatus.SCHEDULED_RESKILL]: 'Scheduled (Reskill)',
  [CandidateTrainingStatus.ONGOING_RESKILL]: 'Ongoing (Reskill)',
  [CandidateTrainingStatus.TRAINED]: 'Trained',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.APPROVED]: 'Approved',
  [ProjectStatus.PLANNING]: 'Planning',
  [ProjectStatus.ONSITE]: 'On Site',
  [ProjectStatus.ON_HOLD]: 'On Hold',
  [ProjectStatus.TERMINATED]: 'Terminated',
  [ProjectStatus.SHORT_CLOSED]: 'Short Closed',
  [ProjectStatus.COMPLETED]: 'Completed',
};

export const WORKER_STATUS_ON_PROJECT_LABELS: Record<WorkerStatusOnProject, string> = {
  [WorkerStatusOnProject.MATCHED]: 'Matched',
  [WorkerStatusOnProject.ALLOCATED]: 'Allocated',
  [WorkerStatusOnProject.DEPLOYED]: 'Deployed',
  [WorkerStatusOnProject.ON_HOLD]: 'On Hold',
  [WorkerStatusOnProject.COMPLETED]: 'Completed',
  [WorkerStatusOnProject.REMOVED]: 'Removed',
};

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  [CandidateStatus.NEW_REGISTRATION]: 'New Registration',
  [CandidateStatus.SCREENING]: 'Screening',
  [CandidateStatus.APPROVED]: 'Approved',
  [CandidateStatus.REJECTED]: 'Rejected',
  [CandidateStatus.BLACKLISTED]: 'Blacklisted',
};

export const TRAINING_BATCH_STATUS_LABELS: Record<TrainingBatchStatus, string> = {
  [TrainingBatchStatus.UPCOMING]: 'Upcoming',
  [TrainingBatchStatus.ONGOING]: 'Ongoing',
  [TrainingBatchStatus.COMPLETED]: 'Completed',
  [TrainingBatchStatus.CANCELLED]: 'Cancelled',
};

export const TRAINER_STATUS_LABELS: Record<TrainerStatus, string> = {
  [TrainerStatus.ASSIGNED]: 'Assigned',
  [TrainerStatus.ON_SITE]: 'On Site',
  [TrainerStatus.BENCHED]: 'Benched',
};

export const EMPLOYER_STATUS_LABELS: Record<EmployerStatus, string> = {
  [EmployerStatus.NEW]: 'New',
  [EmployerStatus.APPROVED]: 'Approved',
  [EmployerStatus.REJECTED]: 'Rejected',
  [EmployerStatus.BLACKLISTED]: 'Blacklisted',
};

export const PROFILE_STAGE_LABELS: Record<ProfileStage, string> = {
  [ProfileStage.NEW_REGISTRATION]: 'New Registration',
  [ProfileStage.SCREENING]: 'Screening',
  [ProfileStage.APPROVED]: 'Approved',
  [ProfileStage.REJECTED]: 'Rejected',
  [ProfileStage.TRAINING]: 'Training',
  [ProfileStage.TRAINED]: 'Trained',
  [ProfileStage.WORKER]: 'Worker',
  [ProfileStage.BENCHED]: 'Benched',
  [ProfileStage.MATCHED]: 'Matched',
  [ProfileStage.ALLOCATED]: 'Allocated',
  [ProfileStage.ONBOARDED]: 'Onboarded',
  [ProfileStage.DEPLOYED]: 'Deployed',
  [ProfileStage.ON_HOLD]: 'On Hold',
};

export const HOLD_ATTRIBUTION_LABELS: Record<HoldAttribution, string> = {
  [HoldAttribution.EMPLOYER]: 'Employer',
  [HoldAttribution.BUILDSEWA]: 'BuildSewa',
  [HoldAttribution.FORCE_MAJEURE]: 'Force Majeure',
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.ENROLLED]: 'Enrolled',
  [EnrollmentStatus.COMPLETED]: 'Completed',
  [EnrollmentStatus.DROPPED]: 'Dropped',
};
