import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { WorkerDocumentDto } from '@/dtos/worker/worker.dto';
import { uploadProfileDocument } from '@/utils/fileStorage';
import { sanitizeFilename } from '@/middlewares/upload.middleware';

export class WorkerDocumentUploadOperation {
  /**
   * Upload a document for worker's profile
   */
  static async execute(
    profileId: string,
    file: Express.Multer.File,
    documentTypeId?: string,
    description?: string
  ): Promise<WorkerDocumentDto> {
    try {
      // Verify profile exists and is a blue-collar worker
      const profile = await prisma.profile.findUnique({
        where: { id: profileId, deletedAt: null, workerType: 'blue' },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Upload file
      const filename = sanitizeFilename(file.originalname);
      const result = await uploadProfileDocument(file.buffer, filename, profileId);

      // Create document record
      const document = await prisma.profileDocument.create({
        data: {
          profileId,
          documentUrl: result.url,
          documentTypeId: documentTypeId || null,
          uploadedByProfileId: profileId,
        },
        include: {
          documentType: {
            include: {
              documentCategory: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      logger.info('Worker document uploaded', { profileId, documentId: document.id });

      return {
        id: document.id,
        documentUrl: document.documentUrl,
        documentNumber: document.documentNumber,
        documentType: document.documentType
          ? {
              id: document.documentType.id,
              name: document.documentType.name,
              documentCategory: document.documentType.documentCategory
                ? {
                    id: document.documentType.documentCategory.id,
                    name: document.documentType.documentCategory.name,
                  }
                : null,
            }
          : null,
        createdAt: document.createdAt,
      };
    } catch (error: any) {
      logger.error('Error uploading worker document', { error, profileId });
      throw new Error(error.message || 'Failed to upload document');
    }
  }

  /**
   * Delete a document from worker's profile
   */
  static async delete(profileId: string, documentId: string): Promise<void> {
    try {
      // Verify document belongs to this profile
      const document = await prisma.profileDocument.findFirst({
        where: { id: documentId, profileId },
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Delete from database (file cleanup can be done separately)
      await prisma.profileDocument.delete({
        where: { id: documentId },
      });

      logger.info('Worker document deleted', { profileId, documentId });
    } catch (error: any) {
      logger.error('Error deleting worker document', { error, profileId, documentId });
      throw new Error(error.message || 'Failed to delete document');
    }
  }

  /**
   * Get all documents for worker
   */
  static async getAll(profileId: string): Promise<WorkerDocumentDto[]> {
    try {
      const documents = await prisma.profileDocument.findMany({
        where: { profileId },
        include: {
          documentType: {
            include: {
              documentCategory: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return documents.map((doc) => ({
        id: doc.id,
        documentUrl: doc.documentUrl,
        documentNumber: doc.documentNumber,
        documentType: doc.documentType
          ? {
              id: doc.documentType.id,
              name: doc.documentType.name,
              documentCategory: doc.documentType.documentCategory
                ? {
                    id: doc.documentType.documentCategory.id,
                    name: doc.documentType.documentCategory.name,
                  }
                : null,
            }
          : null,
        createdAt: doc.createdAt,
      }));
    } catch (error: any) {
      logger.error('Error fetching worker documents', { error, profileId });
      throw new Error(error.message || 'Failed to fetch documents');
    }
  }
}
