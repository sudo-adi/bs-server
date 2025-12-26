/// <reference path="../../types/express.d.ts" />
import logger from '@/config/logger';
import prisma from '@/config/prisma';
import {
  sanitizeFilename,
  uploadProfileDocument as uploadDocHandler,
  uploadKycDocument as uploadKycHandler,
  uploadProfilePhoto as uploadPhotoHandler,
  uploadProjectDocument as uploadProjDocHandler,
} from '@/middlewares/upload.middleware';
import {
  deleteFile,
  getSignedUrl,
  getStorageStatus,
  uploadKycDocument,
  uploadProfileDocument,
  uploadProfilePhoto,
  uploadProjectDocument,
  uploadSkillCertificate,
  uploadTrainingCertificate,
} from '@/utils/fileStorage';
import { Request, Response } from 'express';

export class UploadController {
  /**
   * Upload profile photo
   * POST /api/v1/profiles/:id/photo
   */
  async uploadProfilePhoto(req: Request, res: Response): Promise<void> {
    uploadPhotoHandler(req, res, async (err) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
        return;
      }

      try {
        const { id } = req.params;
        const file = req.file;

        if (!file) {
          res.status(400).json({
            success: false,
            message: 'No file uploaded',
          });
          return;
        }

        // Check if profile exists
        const profile = await prisma.profile.findUnique({
          where: { id, deletedAt: null },
        });

        if (!profile) {
          res.status(404).json({
            success: false,
            message: 'Profile not found',
          });
          return;
        }

        // Delete old photo if exists
        if (profile.profilePhotoURL) {
          try {
            await deleteFile(profile.profilePhotoURL);
          } catch (deleteError) {
            logger.warn('Failed to delete old profile photo', { deleteError });
          }
        }

        // Upload new photo
        const filename = sanitizeFilename(file.originalname);
        const result = await uploadProfilePhoto(file.buffer, filename, id);

        // Update profile with new photo URL
        await prisma.profile.update({
          where: { id },
          data: { profilePhotoURL: result.url },
        });

        logger.info('Profile photo uploaded', { profileId: id, url: result.url });

        res.status(200).json({
          success: true,
          message: 'Profile photo uploaded successfully',
          data: {
            url: result.url,
            storageType: result.storageType,
          },
        });
      } catch (error: any) {
        logger.error('Profile photo upload error', { error });
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload profile photo',
        });
      }
    });
  }

  /**
   * Delete profile photo
   * DELETE /api/v1/profiles/:id/photo
   */
  async deleteProfilePhoto(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if profile exists
      const profile = await prisma.profile.findUnique({
        where: { id, deletedAt: null },
      });

      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
        return;
      }

      if (!profile.profilePhotoURL) {
        res.status(400).json({
          success: false,
          message: 'No profile photo to delete',
        });
        return;
      }

      // Delete the file
      await deleteFile(profile.profilePhotoURL);

      // Update profile to remove photo URL
      await prisma.profile.update({
        where: { id },
        data: { profilePhotoURL: null },
      });

      logger.info('Profile photo deleted', { profileId: id });

      res.status(200).json({
        success: true,
        message: 'Profile photo deleted successfully',
      });
    } catch (error: any) {
      logger.error('Profile photo delete error', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete profile photo',
      });
    }
  }

  /**
   * Upload profile document
   * POST /api/v1/profiles/:id/documents/upload
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    uploadDocHandler(req, res, async (err) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
        return;
      }

      try {
        const { id } = req.params;
        const { documentType, expiryDate } = req.body;
        const file = req.file;

        if (!file) {
          res.status(400).json({
            success: false,
            message: 'No file uploaded',
          });
          return;
        }

        if (!documentType) {
          res.status(400).json({
            success: false,
            message: 'Document type is required',
          });
          return;
        }

        // Check if profile exists
        const profile = await prisma.profile.findUnique({
          where: { id, deletedAt: null },
        });

        if (!profile) {
          res.status(404).json({
            success: false,
            message: 'Profile not found',
          });
          return;
        }

        // Upload document
        const filename = sanitizeFilename(file.originalname);
        const result = await uploadProfileDocument(file.buffer, filename, id);

        // Look up document type by name to get UUID (if documentType is not already a UUID)
        let documentTypeId: string | null = null;
        if (documentType) {
          // Check if documentType is already a valid UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(documentType)) {
            documentTypeId = documentType;
          } else {
            // Look up by name
            const docType = await prisma.documentType.findFirst({
              where: {
                name: {
                  equals: documentType,
                  mode: 'insensitive',
                },
              },
            });
            documentTypeId = docType?.id || null;
          }
        }

        // Create document record
        const document = await prisma.profileDocument.create({
          data: {
            profileId: id,
            documentTypeId: documentTypeId,
            documentUrl: result.url,
            uploadedByProfileId: req.user?.id || id,
          },
        });

        logger.info('Profile document uploaded', {
          profileId: id,
          documentId: document.id,
        });

        res.status(201).json({
          success: true,
          message: 'Document uploaded successfully',
          data: {
            id: document.id,
            documentTypeId: document.documentTypeId,
            documentUrl: document.documentUrl,
            storageType: result.storageType,
          },
        });
      } catch (error: any) {
        logger.error('Document upload error', { error });
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload document',
        });
      }
    });
  }

  /**
   * Upload KYC document
   * POST /api/v1/profiles/:id/kyc/upload
   */
  async uploadKycDocument(req: Request, res: Response): Promise<void> {
    uploadKycHandler(req, res, async (err) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
        return;
      }

      try {
        const { id } = req.params;
        const { documentType, expiryDate } = req.body;
        const file = req.file;

        if (!file) {
          res.status(400).json({
            success: false,
            message: 'No file uploaded',
          });
          return;
        }

        if (!documentType) {
          res.status(400).json({
            success: false,
            message: 'KYC document type is required',
          });
          return;
        }

        // Validate KYC document types
        const validKycTypes = ['aadhar', 'pan', 'passport', 'voter_id', 'driving_license'];
        if (!validKycTypes.includes(documentType)) {
          res.status(400).json({
            success: false,
            message: `Invalid KYC document type. Must be one of: ${validKycTypes.join(', ')}`,
          });
          return;
        }

        // Check if profile exists
        const profile = await prisma.profile.findUnique({
          where: { id, deletedAt: null },
        });

        if (!profile) {
          res.status(404).json({
            success: false,
            message: 'Profile not found',
          });
          return;
        }

        // Upload document
        const filename = sanitizeFilename(file.originalname);
        const result = await uploadKycDocument(file.buffer, filename, id);

        // Create document record (old documents remain, can be managed separately)
        const document = await prisma.profileDocument.create({
          data: {
            profileId: id,
            documentTypeId: documentType, // Now expects documentTypeId
            documentUrl: result.url,
            uploadedByProfileId: req.user?.id || id,
          },
        });

        logger.info('KYC document uploaded', {
          profileId: id,
          documentId: document.id,
          type: documentType,
        });

        res.status(201).json({
          success: true,
          message: 'KYC document uploaded successfully',
          data: {
            id: document.id,
            documentTypeId: document.documentTypeId,
            documentUrl: document.documentUrl,
            storageType: result.storageType,
          },
        });
      } catch (error: any) {
        logger.error('KYC document upload error', { error });
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload KYC document',
        });
      }
    });
  }

  /**
   * Upload project document
   * POST /api/v1/projects/:id/documents/upload
   */
  async uploadProjectDocument(req: Request, res: Response): Promise<void> {
    uploadProjDocHandler(req, res, async (err) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
        return;
      }

      try {
        const { id } = req.params;
        const { documentType } = req.body;
        const file = req.file;

        if (!file) {
          res.status(400).json({
            success: false,
            message: 'No file uploaded',
          });
          return;
        }

        if (!documentType) {
          res.status(400).json({
            success: false,
            message: 'Document type is required',
          });
          return;
        }

        // Check if project exists
        const project = await prisma.profile.findUnique({
          where: { id, deletedAt: null },
        });

        if (!project) {
          res.status(404).json({
            success: false,
            message: 'Project not found',
          });
          return;
        }

        // Upload document
        const filename = sanitizeFilename(file.originalname);
        const result = await uploadProjectDocument(file.buffer, filename, id);

        // Create document record
        const document = await prisma.projectDocument.create({
          data: {
            projectId: id,
            documentType,
            documentUrl: result.url,
            uploadedByProfileId: req.user?.id,
          },
        });

        logger.info('Project document uploaded', {
          projectId: id,
          documentId: document.id,
        });

        res.status(201).json({
          success: true,
          message: 'Project document uploaded successfully',
          data: {
            id: document.id,
            documentType: document.documentType,
            documentUrl: document.documentUrl,
            storageType: result.storageType,
          },
        });
      } catch (error: any) {
        logger.error('Project document upload error', { error });
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload project document',
        });
      }
    });
  }

  /**
   * Upload training certificate
   * POST /api/v1/profiles/:id/certificates/training
   */
  async uploadTrainingCertificate(req: Request, res: Response): Promise<void> {
    uploadDocHandler(req, res, async (err) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
        return;
      }

      try {
        const { id } = req.params;
        const { batchId, certificateNumber } = req.body;
        const file = req.file;

        if (!file) {
          res.status(400).json({
            success: false,
            message: 'No file uploaded',
          });
          return;
        }

        // Check if profile exists
        const profile = await prisma.profile.findUnique({
          where: { id, deletedAt: null },
        });

        if (!profile) {
          res.status(404).json({
            success: false,
            message: 'Profile not found',
          });
          return;
        }

        // Upload certificate
        const filename = sanitizeFilename(file.originalname);
        const result = await uploadTrainingCertificate(file.buffer, filename, id);

        // Update or create certificate record if batchId provided
        if (batchId) {
          await prisma.profileTrainingCertificate.upsert({
            where: {
              id: batchId, // Using batchId as unique identifier for upsert
            },
            update: {
              certificateNumber: certificateNumber || undefined,
            },
            create: {
              profileId: id,
              trainingBatchId: batchId,
              certificateNumber: certificateNumber || `CERT-${Date.now()}`,
              issuedDate: new Date(),
              issuedByProfileId: req.user?.id,
            },
          });
        }

        logger.info('Training certificate uploaded', {
          profileId: id,
          url: result.url,
        });

        res.status(201).json({
          success: true,
          message: 'Training certificate uploaded successfully',
          data: {
            url: result.url,
            storageType: result.storageType,
          },
        });
      } catch (error: any) {
        logger.error('Training certificate upload error', { error });
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload training certificate',
        });
      }
    });
  }

  /**
   * Upload skill certificate
   * POST /api/v1/profiles/:id/certificates/skill
   */
  async uploadSkillCertificate(req: Request, res: Response): Promise<void> {
    uploadDocHandler(req, res, async (err) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
        return;
      }

      try {
        const { id } = req.params;
        const { skillName, issuingAuthority, expiryDate } = req.body;
        const file = req.file;

        if (!file) {
          res.status(400).json({
            success: false,
            message: 'No file uploaded',
          });
          return;
        }

        // Check if profile exists
        const profile = await prisma.profile.findUnique({
          where: { id, deletedAt: null },
        });

        if (!profile) {
          res.status(404).json({
            success: false,
            message: 'Profile not found',
          });
          return;
        }

        // Upload certificate
        const filename = sanitizeFilename(file.originalname);
        const result = await uploadSkillCertificate(file.buffer, filename, id);

        // Store as a profile document with certificate type
        const document = await prisma.profileDocument.create({
          data: {
            profileId: id,
            // Note: skill certificates should have a proper documentTypeId for 'skill_certificate'
            documentUrl: result.url,
            uploadedByProfileId: req.user?.id || id,
          },
        });

        logger.info('Skill certificate uploaded', {
          profileId: id,
          documentId: document.id,
          skillName,
        });

        res.status(201).json({
          success: true,
          message: 'Skill certificate uploaded successfully',
          data: {
            id: document.id,
            url: result.url,
            skillName,
            issuingAuthority,
            storageType: result.storageType,
          },
        });
      } catch (error: any) {
        logger.error('Skill certificate upload error', { error });
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to upload skill certificate',
        });
      }
    });
  }

  /**
   * Get storage status
   * GET /api/v1/storage/status
   */
  async getStorageStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = getStorageStatus();
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get storage status',
      });
    }
  }

  /**
   * Get signed URL for viewing a document
   * POST /api/v1/documents/signed-url
   * Body: { url: string }
   */
  async getDocumentSignedUrl(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          message: 'URL is required',
        });
        return;
      }

      const { signedUrl, contentType } = await getSignedUrl(url);

      res.status(200).json({
        success: true,
        data: {
          signedUrl,
          contentType,
          expiresIn: 3600, // 1 hour
        },
      });
    } catch (error: any) {
      logger.error('Error getting signed URL', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get signed URL',
      });
    }
  }
}

export default new UploadController();
