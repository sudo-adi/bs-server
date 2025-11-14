// Re-export Qualification types from Prisma types
export type {
  CreateQualificationDto,
  Qualification,
  UpdateQualificationDto,
} from '@/types/prisma.types';

// Additional DTOs specific to qualification operations
export interface VerifyQualificationDto {
  verified_by_user_id: string;
}
