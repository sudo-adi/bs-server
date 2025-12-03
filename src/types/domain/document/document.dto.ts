import type { Document } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type CreateDocumentDto = CreateDTO<Document>;
export type UpdateDocumentDto = UpdateDTO<Document>;

// Document verification DTO
export interface VerifyDocumentDto {
  verification_status: string;
  verified_by_user_id: string;
}
