import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { WorkerIdentityUpdateDto, WorkerProfileUpdateDto } from '@/dtos/worker/worker.dto';
import workerService from '@/services/worker';
import { deleteFile, uploadProfilePhoto } from '@/utils/fileStorage';
import { sanitizeFilename } from '@/middlewares/upload.middleware';
import { Request, Response } from 'express';

/**
 * Worker Self-Service Controller
 * Handles blue-collar worker self-service APIs
 */
export class WorkerSelfController {
  // ==========================================================================
  // PROFILE
  // ==========================================================================

  /**
   * GET /api/worker/me
   * Get worker's own profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.user?.id;

      if (!profileId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const profile = await workerService.getProfile(profileId);

      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Profile not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      logger.error('Error getting worker profile', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get profile',
      });
    }
  }

  /**
   * PATCH /api/worker/me
   * Update worker's own profile (limited fields)
   * Supports profile photo upload via multipart/form-data
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.user?.id;

      if (!profileId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Handle profile photo upload if present
      if (req.file) {
        // Get current profile to check for existing photo
        const currentProfile = await prisma.profile.findUnique({
          where: { id: profileId },
          select: { profilePhotoURL: true },
        });

        // Delete old photo if exists
        if (currentProfile?.profilePhotoURL) {
          try {
            await deleteFile(currentProfile.profilePhotoURL);
          } catch (deleteError) {
            logger.warn('Failed to delete old profile photo', { deleteError });
          }
        }

        // Upload new photo
        const filename = sanitizeFilename(req.file.originalname);
        const result = await uploadProfilePhoto(req.file.buffer, filename, profileId);

        // Update profile photo URL
        await prisma.profile.update({
          where: { id: profileId },
          data: { profilePhotoURL: result.url },
        });
      }

      // Parse body data (may be JSON string in multipart)
      let updateData: WorkerProfileUpdateDto = {};
      if (req.body.data) {
        try {
          updateData = JSON.parse(req.body.data);
        } catch {
          updateData = req.body.data;
        }
      } else {
        // Try to parse individual fields
        if (req.body.altPhone) updateData.altPhone = req.body.altPhone;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.addresses) {
          updateData.addresses =
            typeof req.body.addresses === 'string'
              ? JSON.parse(req.body.addresses)
              : req.body.addresses;
        }
        if (req.body.bankAccounts) {
          updateData.bankAccounts =
            typeof req.body.bankAccounts === 'string'
              ? JSON.parse(req.body.bankAccounts)
              : req.body.bankAccounts;
        }
        if (req.body.languages) {
          updateData.languages =
            typeof req.body.languages === 'string'
              ? JSON.parse(req.body.languages)
              : req.body.languages;
        }
      }

      // Update profile data if any
      if (Object.keys(updateData).length > 0) {
        await workerService.updateProfile(profileId, updateData);
      }

      // Fetch updated profile
      const updatedProfile = await workerService.getProfile(profileId);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile,
      });
    } catch (error: any) {
      logger.error('Error updating worker profile', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  // ==========================================================================
  // IDENTITY
  // ==========================================================================

  /**
   * PATCH /api/worker/me/identity
   * Update identity info with document uploads
   */
  async updateIdentity(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.user?.id;

      if (!profileId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Parse identity data
      let identityData: WorkerIdentityUpdateDto = {};
      if (req.body.data) {
        try {
          identityData = JSON.parse(req.body.data);
        } catch {
          identityData = req.body.data;
        }
      } else {
        // Parse individual fields
        if (req.body.aadhaarNumber) identityData.aadhaarNumber = req.body.aadhaarNumber;
        if (req.body.panNumber) identityData.panNumber = req.body.panNumber;
        if (req.body.esicNumber) identityData.esicNumber = req.body.esicNumber;
        if (req.body.uanNumber) identityData.uanNumber = req.body.uanNumber;
        if (req.body.pfAccountNumber) identityData.pfAccountNumber = req.body.pfAccountNumber;
        if (req.body.healthInsurancePolicy)
          identityData.healthInsurancePolicy = req.body.healthInsurancePolicy;
        if (req.body.healthInsuranceProvider)
          identityData.healthInsuranceProvider = req.body.healthInsuranceProvider;
        if (req.body.healthInsuranceExpiry)
          identityData.healthInsuranceExpiry = req.body.healthInsuranceExpiry;
      }

      // Extract uploaded files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const identityFiles: any = {};

      if (files) {
        if (files.aadhaarDocument?.[0]) identityFiles.aadhaarDocument = files.aadhaarDocument[0];
        if (files.panDocument?.[0]) identityFiles.panDocument = files.panDocument[0];
        if (files.esicDocument?.[0]) identityFiles.esicDocument = files.esicDocument[0];
        if (files.uanDocument?.[0]) identityFiles.uanDocument = files.uanDocument[0];
        if (files.pfDocument?.[0]) identityFiles.pfDocument = files.pfDocument[0];
        if (files.healthInsuranceDocument?.[0])
          identityFiles.healthInsuranceDocument = files.healthInsuranceDocument[0];
      }

      await workerService.updateIdentity(profileId, identityData, identityFiles);

      // Fetch updated profile
      const updatedProfile = await workerService.getProfile(profileId);

      res.status(200).json({
        success: true,
        message: 'Identity updated successfully',
        data: updatedProfile?.identity,
      });
    } catch (error: any) {
      logger.error('Error updating worker identity', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update identity',
      });
    }
  }

  // ==========================================================================
  // DOCUMENTS
  // ==========================================================================

  /**
   * GET /api/worker/me/documents
   * Get all documents for worker
   */
  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.user?.id;

      if (!profileId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const documents = await workerService.getDocuments(profileId);

      res.status(200).json({
        success: true,
        data: documents,
      });
    } catch (error: any) {
      logger.error('Error getting worker documents', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get documents',
      });
    }
  }

  /**
   * POST /api/worker/me/documents
   * Upload a document
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.user?.id;

      if (!profileId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      const { documentTypeId, description } = req.body;

      const document = await workerService.uploadDocument(
        profileId,
        req.file,
        documentTypeId,
        description
      );

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document,
      });
    } catch (error: any) {
      logger.error('Error uploading worker document', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload document',
      });
    }
  }

  /**
   * DELETE /api/worker/me/documents/:id
   * Delete a document
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.user?.id;
      const { id: documentId } = req.params;

      if (!profileId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      await workerService.deleteDocument(profileId, documentId);

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting worker document', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete document',
      });
    }
  }

  // ==========================================================================
  // PROJECTS
  // ==========================================================================

  /**
   * GET /api/worker/me/projects
   * Get worker's assigned projects
   */
  async getProjects(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.user?.id;

      if (!profileId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const status = req.query.status as 'active' | 'completed' | 'all' | undefined;

      const result = await workerService.getProjects(profileId, { status });

      res.status(200).json({
        success: true,
        data: result.projects,
        total: result.total,
      });
    } catch (error: any) {
      logger.error('Error getting worker projects', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get projects',
      });
    }
  }

  // ==========================================================================
  // TRAININGS
  // ==========================================================================

  /**
   * GET /api/worker/me/trainings
   * Get worker's training enrollments
   */
  async getTrainings(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.user?.id;

      if (!profileId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const status = req.query.status as 'enrolled' | 'completed' | 'dropped' | 'all' | undefined;

      const result = await workerService.getTrainings(profileId, { status });

      res.status(200).json({
        success: true,
        data: result.trainings,
        total: result.total,
      });
    } catch (error: any) {
      logger.error('Error getting worker trainings', { error });
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get trainings',
      });
    }
  }
}

export const workerSelfController = new WorkerSelfController();
export default workerSelfController;
