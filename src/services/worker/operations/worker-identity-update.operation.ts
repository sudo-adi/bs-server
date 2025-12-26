import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { WorkerIdentityUpdateDto } from '@/dtos/worker/worker.dto';
import { uploadKycDocument } from '@/utils/fileStorage';
import { sanitizeFilename } from '@/middlewares/upload.middleware';

interface UploadedFiles {
  aadhaarDocument?: Express.Multer.File;
  panDocument?: Express.Multer.File;
  esicDocument?: Express.Multer.File;
  uanDocument?: Express.Multer.File;
  pfDocument?: Express.Multer.File;
  healthInsuranceDocument?: Express.Multer.File;
}

export class WorkerIdentityUpdateOperation {
  /**
   * Update worker's identity info with document uploads
   */
  static async execute(
    profileId: string,
    data: WorkerIdentityUpdateDto,
    files: UploadedFiles
  ): Promise<void> {
    try {
      // Verify profile exists and is a blue-collar worker
      const profile = await prisma.profile.findUnique({
        where: { id: profileId, deletedAt: null, workerType: 'blue' },
        include: { identity: true },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Upload documents and get their IDs
      const documentIds: Record<string, string | undefined> = {};

      const uploadTasks = Object.entries(files).map(async ([key, file]) => {
        if (!file) return;

        const filename = sanitizeFilename(file.originalname);
        const result = await uploadKycDocument(file.buffer, filename, profileId);

        // Create document record
        const doc = await prisma.profileDocument.create({
          data: {
            profileId,
            documentUrl: result.url,
            uploadedByProfileId: profileId,
          },
        });

        documentIds[key] = doc.id;
      });

      await Promise.all(uploadTasks);

      // Build identity update data
      const identityData: any = {
        updatedAt: new Date(),
      };

      // Only update fields that are provided
      if (data.aadhaarNumber !== undefined) identityData.aadhaarNumber = data.aadhaarNumber;
      if (data.panNumber !== undefined) identityData.panNumber = data.panNumber;
      if (data.esicNumber !== undefined) identityData.esicNumber = data.esicNumber;
      if (data.uanNumber !== undefined) identityData.uanNumber = data.uanNumber;
      if (data.pfAccountNumber !== undefined) identityData.pfAccountNumber = data.pfAccountNumber;
      if (data.healthInsurancePolicy !== undefined)
        identityData.healthInsurancePolicy = data.healthInsurancePolicy;
      if (data.healthInsuranceProvider !== undefined)
        identityData.healthInsuranceProvider = data.healthInsuranceProvider;
      if (data.healthInsuranceExpiry !== undefined) {
        identityData.healthInsuranceExpiry = new Date(data.healthInsuranceExpiry);
      }

      // Add document IDs
      if (documentIds.aadhaarDocument) identityData.aadhaarDocumentId = documentIds.aadhaarDocument;
      if (documentIds.panDocument) identityData.panDocumentId = documentIds.panDocument;
      if (documentIds.esicDocument) identityData.esicDocumentId = documentIds.esicDocument;
      if (documentIds.uanDocument) identityData.uanDocumentId = documentIds.uanDocument;
      if (documentIds.pfDocument) identityData.pfDocumentId = documentIds.pfDocument;
      if (documentIds.healthInsuranceDocument)
        identityData.healthInsuranceDocumentId = documentIds.healthInsuranceDocument;

      // Upsert identity record
      if (profile.identity) {
        await prisma.profileIdentity.update({
          where: { id: profile.identity.id },
          data: identityData,
        });
      } else {
        await prisma.profileIdentity.create({
          data: {
            ...identityData,
            profileId,
            createdAt: new Date(),
          },
        });
      }

      logger.info('Worker identity updated', { profileId });
    } catch (error: any) {
      logger.error('Error updating worker identity', { error, profileId });
      throw new Error(error.message || 'Failed to update worker identity');
    }
  }
}
