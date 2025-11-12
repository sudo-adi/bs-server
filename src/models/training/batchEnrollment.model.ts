// Batch Enrollment model - Aligned with Prisma schema
import type {
  batch_enrollments,
  profile_skills,
  profiles,
  skill_categories,
  training_batches,
} from '@/generated/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';

export interface BatchEnrollment extends batch_enrollments {}

export interface CreateBatchEnrollmentDto {
  batch_id: string; // Prisma: batch_id @db.Uuid
  profile_id: string; // Prisma: profile_id @db.Uuid
  enrollment_date?: Date; // Prisma: enrollment_date @default(now()) @db.Timestamp(6)
  status?: string; // Prisma: status @default("enrolled") @db.VarChar(50)
  enrolled_by_user_id?: string; // Prisma: enrolled_by_user_id @db.Uuid
  notes?: string; // Prisma: notes String
}

export interface UpdateBatchEnrollmentDto {
  completion_date?: Date; // Prisma: completion_date @db.Date
  status?: string; // Prisma: status @db.VarChar(50)
  attendance_percentage?: Decimal; // Prisma: attendance_percentage @db.Decimal(5, 2)
  score?: Decimal; // Prisma: score @db.Decimal(5, 2)
  notes?: string; // Prisma: notes String
}

export interface BatchEnrollmentWithDetails extends batch_enrollments {
  profiles?:
    | (profiles & {
        profile_skills?:
          | (profile_skills & {
              skill_categories?: skill_categories | null;
            })[]
          | null;
      })
    | null;
  training_batches?: training_batches | null;
  primary_skill_category_id?: string; // Virtual field
  primary_skill_category_name?: string; // Virtual field
}
