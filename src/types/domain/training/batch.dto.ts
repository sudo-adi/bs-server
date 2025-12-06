import type { TrainingBatch } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type CreateTrainingBatchDto = CreateDTO<TrainingBatch>;
export type UpdateTrainingBatchDto = UpdateDTO<TrainingBatch>;

// CSV Import Types - Composed from Prisma types

// Trainer CSV row - trainers are now profiles with additional metadata
// For CSV import, we need profile data + trainer metadata
export type TrainerCsvRow = {
  // Required profile fields
  first_name: string;
  phone: string;
  password: string; // For profile creation

  // Optional profile fields
  middle_name?: string;
  last_name?: string;
  email?: string;
  date_of_birth?: Date | string;
  gender?: string;

  // Optional trainer-specific fields
  specialization?: string;
  certifications?: string;
  years_of_experience?: number;
  bio?: string;
};

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
