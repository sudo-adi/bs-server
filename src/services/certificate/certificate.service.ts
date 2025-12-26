import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ENROLLMENT_STATUSES } from '@/constants/stages';
import { s3StorageService } from '@/services/storage/s3.service';

interface CertificateData {
  profileId: string;
  profileName: string;
  candidateCode: string | null;
  batchName: string;
  batchCode: string | null;
  programName: string | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  batchStartDate: Date | null;
  batchEndDate: Date | null;
  completionDate: Date | null;
}

interface GenerateCertificateResult {
  certificateId: string;
  profileId: string;
  profileName: string;
  certificateNumber: string;
  certificateFileUrl: string;
  success: boolean;
  error?: string;
}

interface DistributeCertificatesRequest {
  profileIds: string[];
  issuedByProfileId?: string;
}

interface DistributeCertificatesResult {
  total: number;
  successful: number;
  failed: number;
  results: GenerateCertificateResult[];
}

class CertificateService {
  /**
   * Generate certificate number
   * Format: CERT-BATCHCODE-PROFILECODE-YYYYMMDD
   */
  private generateCertificateNumber(
    batchCode: string | null,
    candidateCode: string | null
  ): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const batch = batchCode || 'BTH';
    const profile = candidateCode || 'XXX';
    return `CERT-${batch}-${profile}-${dateStr}`;
  }

  /**
   * Generate certificate content as text file
   */
  private generateCertificateContent(data: CertificateData): string {
    const startDate = data.actualStartDate || data.batchStartDate;
    const endDate = data.actualEndDate || data.completionDate || data.batchEndDate;

    const formatDate = (date: Date | null): string => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    return `
================================================================================
                         TRAINING COMPLETION CERTIFICATE
================================================================================

This is to certify that

    Name: ${data.profileName}
    Candidate ID: ${data.candidateCode || 'N/A'}

has successfully completed the training program:

    Program: ${data.programName || data.batchName}
    Batch: ${data.batchName} (${data.batchCode || 'N/A'})

Training Period:
    Start Date: ${formatDate(startDate)}
    End Date: ${formatDate(endDate)}

Certificate Issued On: ${formatDate(new Date())}

================================================================================
                              BuildSewa
================================================================================
`.trim();
  }

  /**
   * Generate and upload certificate for a single profile
   */
  async generateCertificate(
    enrollmentId: string,
    issuedByProfileId?: string
  ): Promise<GenerateCertificateResult> {
    try {
      // Get enrollment with profile and batch details
      const enrollment = await prisma.trainingBatchEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              candidateCode: true,
            },
          },
          batch: {
            select: {
              id: true,
              name: true,
              code: true,
              programName: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });

      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      if (!enrollment.profile) {
        throw new Error('Profile not found for enrollment');
      }

      if (!enrollment.batch) {
        throw new Error('Batch not found for enrollment');
      }

      if (enrollment.status !== ENROLLMENT_STATUSES.COMPLETED) {
        throw new Error(
          'Enrollment is not completed. Only completed enrollments can receive certificates.'
        );
      }

      // Check if certificate already exists
      const existingCert = await prisma.profileTrainingCertificate.findFirst({
        where: {
          profileId: enrollment.profileId,
          trainingBatchId: enrollment.batchId,
        },
      });

      if (existingCert) {
        return {
          certificateId: existingCert.id,
          profileId: enrollment.profile.id,
          profileName: `${enrollment.profile.firstName} ${enrollment.profile.lastName}`,
          certificateNumber: existingCert.certificateNumber || '',
          certificateFileUrl: existingCert.certificateFileUrl || '',
          success: true,
          error: 'Certificate already exists',
        };
      }

      // Prepare certificate data
      const profileName =
        `${enrollment.profile.firstName || ''} ${enrollment.profile.lastName || ''}`.trim();
      const certData: CertificateData = {
        profileId: enrollment.profile.id,
        profileName,
        candidateCode: enrollment.profile.candidateCode,
        batchName: enrollment.batch.name || '',
        batchCode: enrollment.batch.code,
        programName: enrollment.batch.programName,
        actualStartDate: enrollment.actualStartDate,
        actualEndDate: enrollment.actualEndDate,
        batchStartDate: enrollment.batch.startDate,
        batchEndDate: enrollment.batch.endDate,
        completionDate: enrollment.completionDate,
      };

      // Generate certificate content
      const content = this.generateCertificateContent(certData);
      const buffer = Buffer.from(content, 'utf-8');

      // Generate certificate number
      const certificateNumber = this.generateCertificateNumber(
        enrollment.batch.code,
        enrollment.profile.candidateCode
      );

      // Upload to S3
      const filename = `${certificateNumber}.txt`;
      const uploadResult = await s3StorageService.uploadTrainingCertificate(
        buffer,
        filename,
        enrollment.profile.id
      );

      // Create certificate record
      const certificate = await prisma.profileTrainingCertificate.create({
        data: {
          profileId: enrollment.profileId,
          trainingBatchId: enrollment.batchId,
          certificateNumber,
          certificateFileUrl: uploadResult.url,
          certificateFileS3Key: uploadResult.key,
          issuedByProfileId,
          issuedDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info('Certificate generated successfully', {
        certificateId: certificate.id,
        profileId: enrollment.profileId,
        batchId: enrollment.batchId,
        certificateNumber,
      });

      return {
        certificateId: certificate.id,
        profileId: enrollment.profile.id,
        profileName,
        certificateNumber,
        certificateFileUrl: uploadResult.url,
        success: true,
      };
    } catch (error: any) {
      logger.error('Failed to generate certificate', { enrollmentId, error: error.message });
      return {
        certificateId: '',
        profileId: '',
        profileName: '',
        certificateNumber: '',
        certificateFileUrl: '',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Distribute certificates to selected profiles in a batch
   */
  async distributeCertificates(
    batchId: string,
    request: DistributeCertificatesRequest
  ): Promise<DistributeCertificatesResult> {
    const { profileIds, issuedByProfileId } = request;

    // Get batch to verify it exists
    const batch = await prisma.trainingBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error('Training batch not found');
    }

    // Get completed enrollments for selected profiles
    const enrollments = await prisma.trainingBatchEnrollment.findMany({
      where: {
        batchId,
        profileId: { in: profileIds },
        status: ENROLLMENT_STATUSES.COMPLETED,
      },
      include: {
        profile: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (enrollments.length === 0) {
      throw new Error('No completed enrollments found for the selected profiles');
    }

    const results: GenerateCertificateResult[] = [];
    let successful = 0;
    let failed = 0;

    // Generate certificate for each enrollment
    for (const enrollment of enrollments) {
      const result = await this.generateCertificate(enrollment.id, issuedByProfileId);
      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    logger.info('Certificates distributed', {
      batchId,
      total: enrollments.length,
      successful,
      failed,
    });

    return {
      total: enrollments.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Generate certificates for all completed enrollments in a batch
   */
  async generateBatchCertificates(
    batchId: string,
    issuedByProfileId?: string
  ): Promise<DistributeCertificatesResult> {
    // Get all completed enrollments
    const enrollments = await prisma.trainingBatchEnrollment.findMany({
      where: {
        batchId,
        status: ENROLLMENT_STATUSES.COMPLETED,
      },
      select: { profileId: true },
    });

    if (enrollments.length === 0) {
      throw new Error('No completed enrollments found in this batch');
    }

    const profileIds = enrollments
      .map((e) => e.profileId)
      .filter((id): id is string => id !== null);

    return this.distributeCertificates(batchId, { profileIds, issuedByProfileId });
  }

  /**
   * Get certificates for a profile
   */
  async getProfileCertificates(profileId: string): Promise<any[]> {
    return prisma.profileTrainingCertificate.findMany({
      where: { profileId },
      include: {
        trainingBatch: {
          select: {
            id: true,
            name: true,
            code: true,
            programName: true,
            startDate: true,
            endDate: true,
          },
        },
        issuedByProfile: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { issuedDate: 'desc' },
    });
  }

  /**
   * Get certificates for a batch
   */
  async getBatchCertificates(batchId: string): Promise<any[]> {
    return prisma.profileTrainingCertificate.findMany({
      where: { trainingBatchId: batchId },
      include: {
        profile: {
          select: { id: true, firstName: true, lastName: true, candidateCode: true },
        },
        issuedByProfile: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { issuedDate: 'desc' },
    });
  }

  /**
   * Get certificate by ID
   */
  async getCertificateById(certificateId: string): Promise<any> {
    return prisma.profileTrainingCertificate.findUnique({
      where: { id: certificateId },
      include: {
        profile: {
          select: { id: true, firstName: true, lastName: true, candidateCode: true },
        },
        trainingBatch: {
          select: { id: true, name: true, code: true, programName: true },
        },
        issuedByProfile: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  /**
   * Get presigned download URL for certificate
   */
  async getCertificateDownloadUrl(certificateId: string): Promise<string> {
    const certificate = await prisma.profileTrainingCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    if (!certificate.certificateFileS3Key) {
      throw new Error('Certificate file not found');
    }

    return s3StorageService.getPresignedDownloadUrl(
      certificate.certificateFileS3Key,
      s3StorageService.parseS3Url(certificate.certificateFileUrl!).bucketType
    );
  }

  /**
   * Delete certificate
   */
  async deleteCertificate(certificateId: string): Promise<void> {
    const certificate = await prisma.profileTrainingCertificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    // Delete from S3 if exists
    if (certificate.certificateFileS3Key) {
      try {
        await s3StorageService.deleteFileByUrl(certificate.certificateFileUrl!);
      } catch (error) {
        logger.warn('Failed to delete certificate from S3', { certificateId, error });
      }
    }

    // Delete from database
    await prisma.profileTrainingCertificate.delete({
      where: { id: certificateId },
    });

    logger.info('Certificate deleted', { certificateId });
  }
}

export const certificateService = new CertificateService();
export default certificateService;
