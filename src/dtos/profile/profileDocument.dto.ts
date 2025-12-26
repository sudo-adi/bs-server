import { ProfileDocument } from '@/generated/prisma';

/**
 * DTO for creating profile document
 * Omits: id, createdAt, updatedAt, uploadedByProfileId
 */
export type CreateProfileDocumentDto = Omit<
  ProfileDocument,
  'id' | 'createdAt' | 'updatedAt' | 'uploadedByProfileId'
>;

/**
 * DTO for updating profile document
 */
export type UpdateProfileDocumentDto = Partial<
  Omit<ProfileDocument, 'id' | 'createdAt' | 'updatedAt' | 'uploadedByProfileId'>
>;

/**
 * DTO for profile document response
 */
export type ProfileDocumentResponseDto = ProfileDocument;
