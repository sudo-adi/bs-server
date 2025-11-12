// Re-export Document type from Prisma types
export type { Document, CreateDocumentDto, UpdateDocumentDto } from '@/types/prisma.types';

// Additional DTOs specific to document operations
export interface VerifyDocumentDto {
  verification_status: string;
  verified_by_user_id: string;
}
