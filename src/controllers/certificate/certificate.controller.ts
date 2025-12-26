import { certificateService } from '@/services/certificate/certificate.service';
import { Request, Response } from 'express';

export class CertificateController {
  /**
   * Generate certificates for all completed enrollments in a batch
   * POST /training-batches/:batchId/certificates/generate
   */
  async generateBatchCertificates(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;
      const issuedByProfileId = req.user?.id;

      const result = await certificateService.generateBatchCertificates(batchId, issuedByProfileId);

      res.status(200).json({
        success: true,
        message: `Generated ${result.successful} certificates (${result.failed} failed)`,
        data: result,
      });
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to generate certificates',
      });
    }
  }

  /**
   * Distribute certificates to selected profiles in a batch
   * POST /training-batches/:batchId/certificates/distribute
   * Body: { profileIds: string[] }
   */
  async distributeCertificates(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;
      const { profileIds } = req.body;

      if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'profileIds array is required',
        });
        return;
      }

      const result = await certificateService.distributeCertificates(batchId, {
        profileIds,
        issuedByProfileId: req.user?.id,
      });

      res.status(200).json({
        success: true,
        message: `Distributed ${result.successful} certificates (${result.failed} failed)`,
        data: result,
      });
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to distribute certificates',
      });
    }
  }

  /**
   * Get all certificates for a batch
   * GET /training-batches/:batchId/certificates
   */
  async getBatchCertificates(req: Request, res: Response): Promise<void> {
    try {
      const { batchId } = req.params;
      const certificates = await certificateService.getBatchCertificates(batchId);

      res.status(200).json({
        success: true,
        data: certificates,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch certificates',
      });
    }
  }

  /**
   * Get all certificates for a profile
   * GET /profiles/:profileId/certificates
   */
  async getProfileCertificates(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const certificates = await certificateService.getProfileCertificates(profileId);

      res.status(200).json({
        success: true,
        data: certificates,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch certificates',
      });
    }
  }

  /**
   * Get certificate by ID
   * GET /certificates/:certificateId
   */
  async getCertificateById(req: Request, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;
      const certificate = await certificateService.getCertificateById(certificateId);

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: 'Certificate not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: certificate,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch certificate',
      });
    }
  }

  /**
   * Get certificate download URL
   * GET /certificates/:certificateId/download
   */
  async getCertificateDownloadUrl(req: Request, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;
      const downloadUrl = await certificateService.getCertificateDownloadUrl(certificateId);

      res.status(200).json({
        success: true,
        data: { downloadUrl },
      });
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to get download URL',
      });
    }
  }

  /**
   * Delete certificate
   * DELETE /certificates/:certificateId
   */
  async deleteCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;
      await certificateService.deleteCertificate(certificateId);

      res.status(200).json({
        success: true,
        message: 'Certificate deleted successfully',
      });
    } catch (error: any) {
      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || 'Failed to delete certificate',
      });
    }
  }
}

export const certificateController = new CertificateController();
export default certificateController;
