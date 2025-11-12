// Training Batch model - Aligned with Prisma schema
import type { training_batches, batch_enrollments, profiles, skill_categories } from '@/generated/prisma';

export interface TrainingBatch extends training_batches {}

export interface CreateTrainingBatchDto {
  name: string; // Prisma: name @db.VarChar(255)
  program_name: string; // Prisma: program_name @db.VarChar(255)
  skill_category_id?: string; // Prisma: skill_category_id @db.Uuid
  provider?: string; // Prisma: provider @db.VarChar(255)
  trainer_name?: string; // Prisma: trainer_name @db.VarChar(255)
  start_date?: Date; // Prisma: start_date @db.Date
  end_date?: Date; // Prisma: end_date @db.Date
  duration_days?: number; // Prisma: duration_days Int
  max_capacity?: number; // Prisma: max_capacity Int
  status?: string; // Prisma: status @default("upcoming") @db.VarChar(50)
  location?: string; // Prisma: location @db.VarChar(255)
  description?: string; // Prisma: description String
  created_by_user_id?: string; // Prisma: created_by_user_id @db.Uuid
}

export interface UpdateTrainingBatchDto {
  name?: string;
  program_name?: string;
  skill_category_id?: string;
  provider?: string;
  trainer_name?: string;
  start_date?: Date;
  end_date?: Date;
  duration_days?: number;
  max_capacity?: number;
  status?: string;
  location?: string;
  description?: string;
}

export interface TrainingBatchWithEnrollments extends training_batches {
  batch_enrollments?: (batch_enrollments & { profiles?: profiles | null })[];
  skill_categories?: skill_categories | null;
  enrolled_count?: number; // Virtual field
}
