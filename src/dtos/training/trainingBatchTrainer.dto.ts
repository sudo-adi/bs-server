/**
 * Training Batch Trainer DTOs
 */

// ==================== REQUEST ====================

export interface AssignTrainerToBatchDto {
  batchId: string;
  trainerProfileId: string;
  isPrimary?: boolean;
}

export interface UpdateBatchTrainerDto {
  isPrimary?: boolean;
}

// ==================== RESPONSE ====================

export interface TrainingBatchTrainerResponse {
  id: string;
  batchId: string | null;
  trainerProfileId: string | null;
  isPrimary: boolean | null;
  assignedAt: Date | null;
  assignedByProfileId: string | null;
  removedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  trainerProfile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    workerCode: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  batch?: {
    id: string;
    batchCode: string | null;
    name: string | null;
  } | null;
}

// ==================== QUERY ====================

export interface BatchTrainerListQuery {
  batchId?: string;
  trainerProfileId?: string;
  includeRemoved?: boolean;
  page?: number;
  limit?: number;
}
