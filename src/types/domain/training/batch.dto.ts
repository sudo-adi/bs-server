import type { TrainingBatch, Trainer } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type CreateTrainingBatchDto = CreateDTO<TrainingBatch>;
export type UpdateTrainingBatchDto = UpdateDTO<TrainingBatch>;

// CSV Import Types - Composed from Prisma types

// Trainer CSV row (name, phone, password are required, exclude system/relation fields)
export type TrainerCsvRow = Required<Pick<Trainer, 'name' | 'phone'>> & {
  password: string; // Required for CSV import
} & Partial<Omit<Trainer,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'name' // Already in Required
  | 'phone' // Already in Required
  | 'employee_code' // Auto-generated
  | 'is_active'
  | 'created_by_user_id'
  // Relations
  | 'users'
  | 'training_batches'
>>;

export interface TrainerImportRowResult {
  rowNumber: number;
  success: boolean;
  trainerId?: string;
  employeeCode?: string;
  errors?: string[];
  warnings?: string[];
  data?: any; // Row data for debugging/display
}

export interface TrainerImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: TrainerImportRowResult[];
}

export interface TrainerImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}
