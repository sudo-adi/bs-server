/**
 * Code Management Constants
 * Centralized constants for all entity codes used throughout the system
 */

/**
 * Entity types that have unique codes
 */
export const CODE_ENTITY_TYPES = {
  CANDIDATE: 'candidate',
  WORKER: 'worker',
  EMPLOYER: 'employer',
  PROJECT: 'project',
  TRAINING_BATCH: 'training_batch',
} as const;

export type CodeEntityType = (typeof CODE_ENTITY_TYPES)[keyof typeof CODE_ENTITY_TYPES];

/**
 * Code prefixes for different entity types
 */
export const CODE_PREFIXES = {
  CANDIDATE: 'BSC',
  WORKER: 'BSW',
  EMPLOYER: 'BSE',
  PROJECT: 'BSP',
  TRAINING_BATCH: 'BST',
} as const;

export type CodePrefix = (typeof CODE_PREFIXES)[keyof typeof CODE_PREFIXES];

/**
 * Code formats and configurations
 */
export const CODE_CONFIG = {
  [CODE_ENTITY_TYPES.CANDIDATE]: {
    prefix: CODE_PREFIXES.CANDIDATE,
    length: 5, // BSC-00001
    fieldName: 'candidateCode',
    assignedAtField: 'candidateCodeAssignedAt',
  },
  [CODE_ENTITY_TYPES.WORKER]: {
    prefix: CODE_PREFIXES.WORKER,
    length: 5, // BSW-00001
    fieldName: 'workerCode',
    assignedAtField: 'workerCodeAssignedAt',
  },
  [CODE_ENTITY_TYPES.EMPLOYER]: {
    prefix: CODE_PREFIXES.EMPLOYER,
    length: 4, // BSE-00001
    fieldName: 'employerCode',
    assignedAtField: null,
  },
  [CODE_ENTITY_TYPES.PROJECT]: {
    prefix: CODE_PREFIXES.PROJECT,
    length: 4, // BSP-00001
    fieldName: 'code',
    assignedAtField: null,
  },
  [CODE_ENTITY_TYPES.TRAINING_BATCH]: {
    prefix: CODE_PREFIXES.TRAINING_BATCH,
    length: 4, // BST-00001
    fieldName: 'code',
    assignedAtField: null,
  },
} as const;

/**
 * Helper type for code configuration
 */
export type CodeConfiguration = (typeof CODE_CONFIG)[CodeEntityType];

/**
 * Map entity types to their table names in Prisma
 */
export const ENTITY_TABLE_MAP = {
  [CODE_ENTITY_TYPES.CANDIDATE]: 'profile',
  [CODE_ENTITY_TYPES.WORKER]: 'profile',
  [CODE_ENTITY_TYPES.EMPLOYER]: 'employer',
  [CODE_ENTITY_TYPES.PROJECT]: 'project',
  [CODE_ENTITY_TYPES.TRAINING_BATCH]: 'trainingBatch',
} as const;
