import { AppError } from '@/middlewares/errorHandler';
import { certificateService } from '@/services/certificates';
import {
  BatchCertificateRequest,
  CertificateType,
  GenerateCertificateOptions,
  IssueCertificateRequest,
} from '@/types';
import { NextFunction, Request, Response } from 'express';

export class CertificateController {
  /**
   * Issue certificate to single or multiple profiles
   * POST /api/v1/certificates/issue
   */
  issueCertificates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        profileIds,
        certificateType,
        trainingBatchId,
        projectId,
        metadata,
      }: IssueCertificateRequest = req.body;
      const issuedByUserId = req.user?.id;

      if (!profileIds || profileIds.length === 0) {
        throw new AppError('Profile IDs are required', 400);
      }

      if (!certificateType || !Object.values(CertificateType).includes(certificateType)) {
        throw new AppError('Valid certificate type is required (training or project)', 400);
      }

      // Validate type-specific requirements
      if (certificateType === CertificateType.TRAINING && !trainingBatchId) {
        throw new AppError('Training batch ID is required for training certificates', 400);
      }

      if (certificateType === CertificateType.PROJECT && !projectId) {
        throw new AppError('Project ID is required for project certificates', 400);
      }

      const certificates = [];
      const errors = [];

      for (const profileId of profileIds) {
        try {
          const options: GenerateCertificateOptions = {
            profileId,
            certificateType,
            trainingBatchId,
            projectId,
            metadata: {
              candidateName: metadata?.candidateName || '',
              candidateCode: metadata?.candidateCode || '',
              ...metadata,
            },
          };

          const certificate = await certificateService.issueCertificate(options, issuedByUserId);
          certificates.push(certificate);
        } catch (error) {
          errors.push({
            profileId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Issued ${certificates.length} certificate(s)`,
        data: {
          certificates,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Issue certificates to entire training batch
   * POST /api/v1/certificates/batch/:batchId
   */
  issueBatchCertificates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { batchId } = req.params;
      const { profileIds }: { profileIds?: string[] } = req.body;
      const issuedByUserId = req.user?.id;

      if (!batchId) {
        throw new AppError('Batch ID is required', 400);
      }

      const request: BatchCertificateRequest = {
        batchId,
        profileIds,
      };

      const certificates = await certificateService.issueBatchCertificates(request, issuedByUserId);

      res.status(201).json({
        success: true,
        message: `Issued ${certificates.length} certificates to batch`,
        data: certificates,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get certificates by profile
   * GET /api/v1/certificates/profile/:profileId
   */
  getProfileCertificates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { profileId } = req.params;

      if (!profileId) {
        throw new AppError('Profile ID is required', 400);
      }

      const certificates = await certificateService.getProfileCertificates(profileId);

      res.status(200).json({
        success: true,
        data: certificates,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get certificate by ID
   * GET /api/v1/certificates/:certificateId
   */
  getCertificateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { certificateId } = req.params;

      if (!certificateId) {
        throw new AppError('Certificate ID is required', 400);
      }

      const certificate = await certificateService.getCertificateById(certificateId);

      res.status(200).json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get certificates with filters
   * GET /api/v1/certificates
   */
  getCertificates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        profileId,
        certificateType,
        trainingBatchId,
        projectId,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
      } = req.query;

      const result = await certificateService.getCertificates({
        profileId: profileId as string,
        certificateType: certificateType as CertificateType,
        trainingBatchId: trainingBatchId as string,
        projectId: projectId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new CertificateController();
