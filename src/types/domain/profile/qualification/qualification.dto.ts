import type { Qualification } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type CreateQualificationDto = CreateDTO<Qualification>;
export type UpdateQualificationDto = UpdateDTO<Qualification>;

// Qualification verification DTO
export interface VerifyQualificationDto {
  verified_by_user_id: string;
}

export interface VerifyQualificationDto {
  verified_by_user_id: string;
}
