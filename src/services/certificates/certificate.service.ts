import { PrismaClient } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  BatchCertificateRequest,
  CertificateFilter,
  CertificateMetadata,
  CertificateResponse,
  CertificateType,
  GenerateCertificateOptions,
  PDFGenerationOptions,
  SupabaseUploadResult,
} from '@/types';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export class CertificateService {
  private readonly BUCKET_NAME = 'certificates';
  private readonly ORGANIZATION_NAME = 'BuildSewa';

  /**
   * Generate certificate number
   */
  private generateCertificateNumber(type: CertificateType): string {
    const prefix = type === CertificateType.TRAINING ? 'TC' : 'PC';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Generate PDF certificate
   */
  private async generatePDF(options: PDFGenerationOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 72, right: 72 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Certificate styling
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const centerX = pageWidth / 2;

        // Border
        doc
          .rect(30, 30, pageWidth - 60, pageHeight - 60)
          .lineWidth(3)
          .stroke('#1e40af');

        doc
          .rect(40, 40, pageWidth - 80, pageHeight - 80)
          .lineWidth(1)
          .stroke('#1e40af');

        // Header
        doc
          .fontSize(36)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('CERTIFICATE', centerX, 80, { align: 'center', width: pageWidth });

        doc
          .fontSize(20)
          .font('Helvetica')
          .fillColor('#64748b')
          .text('OF COMPLETION', centerX, 125, { align: 'center', width: pageWidth });

        // Organization name
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text(options.organizationName, centerX, 165, { align: 'center', width: pageWidth });

        // Main content
        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#475569')
          .text('This is to certify that', centerX, 210, { align: 'center', width: pageWidth });

        // Candidate name
        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text(options.candidateName, centerX, 240, { align: 'center', width: pageWidth });

        // Candidate code
        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#64748b')
          .text(`(${options.candidateCode})`, centerX, 275, { align: 'center', width: pageWidth });

        // Certificate type specific content
        if (options.certificateType === CertificateType.TRAINING) {
          doc
            .fontSize(12)
            .font('Helvetica')
            .fillColor('#475569')
            .text('has successfully completed the training program', centerX, 310, {
              align: 'center',
              width: pageWidth,
            });

          doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .fillColor('#1e40af')
            .text(options.courseName || options.batchName || 'Training Program', centerX, 340, {
              align: 'center',
              width: pageWidth - 144,
            });

          if (options.duration) {
            doc
              .fontSize(11)
              .font('Helvetica')
              .fillColor('#64748b')
              .text(`Duration: ${options.duration}`, centerX, 380, {
                align: 'center',
                width: pageWidth,
              });
          }

          if (options.score) {
            doc
              .fontSize(11)
              .fillColor('#10b981')
              .text(`Score: ${options.score}`, centerX, 400, { align: 'center', width: pageWidth });
          }
        } else {
          doc
            .fontSize(12)
            .font('Helvetica')
            .fillColor('#475569')
            .text('has successfully completed the project', centerX, 310, {
              align: 'center',
              width: pageWidth,
            });

          doc
            .fontSize(20)
            .font('Helvetica-Bold')
            .fillColor('#1e40af')
            .text(options.projectName || 'Project', centerX, 340, {
              align: 'center',
              width: pageWidth - 144,
            });
        }

        // Completion date
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#64748b')
          .text(`Completed on: ${options.completionDate}`, centerX, 430, {
            align: 'center',
            width: pageWidth,
          });

        // Certificate number
        doc
          .fontSize(10)
          .fillColor('#94a3b8')
          .text(`Certificate No: ${options.certificateNumber}`, centerX, 460, {
            align: 'center',
            width: pageWidth,
          });

        // Issue date
        doc
          .fontSize(10)
          .fillColor('#94a3b8')
          .text(`Issue Date: ${options.issueDate}`, centerX, 480, {
            align: 'center',
            width: pageWidth,
          });

        // Footer signature area
        const signY = pageHeight - 120;
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text('Authorized Signatory', 100, signY, { width: 200, align: 'center' });

        doc
          .moveTo(100, signY - 10)
          .lineTo(300, signY - 10)
          .stroke('#cbd5e1');

        if (options.trainerName) {
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text('Training Instructor', pageWidth - 300, signY, { width: 200, align: 'center' });

          doc
            .moveTo(pageWidth - 300, signY - 10)
            .lineTo(pageWidth - 100, signY - 10)
            .stroke('#cbd5e1');

          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#64748b')
            .text(options.trainerName, pageWidth - 300, signY + 20, {
              width: 200,
              align: 'center',
            });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Upload PDF to Supabase storage
   */
  private async uploadToSupabase(
    pdfBuffer: Buffer,
    certificateNumber: string,
    profileId: string
  ): Promise<SupabaseUploadResult> {
    const fileName = `${certificateNumber}_${profileId}_${Date.now()}.pdf`;
    const filePath = `${profileId}/${fileName}`;

    const { error } = await supabase.storage.from(this.BUCKET_NAME).upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

    if (error) {
      throw new AppError(`Failed to upload certificate: ${error.message}`, 500);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      bucket: this.BUCKET_NAME,
    };
  }

  /**
   * Issue certificate to single profile
   */
  async issueCertificate(
    options: GenerateCertificateOptions,
    issuedByUserId?: string
  ): Promise<CertificateResponse> {
    // Fetch profile data
    const profile = await prisma.profiles.findUnique({
      where: { id: options.profileId },
      select: {
        id: true,
        candidate_code: true,
        first_name: true,
        middle_name: true,
        last_name: true,
      },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    const candidateName =
      `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name || ''}`.trim();

    // Generate certificate number
    const certificateNumber = this.generateCertificateNumber(options.certificateType);

    // Prepare PDF options
    const pdfOptions: PDFGenerationOptions = {
      candidateName,
      candidateCode: profile.candidate_code,
      certificateNumber,
      certificateType: options.certificateType,
      courseName: options.metadata.courseName,
      batchName: options.metadata.batchName,
      projectName: options.metadata.projectName,
      duration: options.metadata.duration,
      completionDate: options.metadata.completionDate || new Date().toLocaleDateString(),
      issueDate: new Date().toLocaleDateString(),
      organizationName: this.ORGANIZATION_NAME,
      score: options.metadata.score,
      trainerName: options.metadata.trainerName,
      skills: options.metadata.skills,
    };

    // Generate PDF
    const pdfBuffer = await this.generatePDF(pdfOptions);

    // Upload to Supabase
    const uploadResult = await this.uploadToSupabase(pdfBuffer, certificateNumber, profile.id);

    // Save to database
    const certificate = await prisma.certificates.create({
      data: {
        profile_id: profile.id,
        certificate_type: options.certificateType,
        certificate_url: uploadResult.url,
        certificate_number: certificateNumber,
        training_batch_id: options.trainingBatchId,
        project_id: options.projectId,
        issued_by_user_id: issuedByUserId,
        metadata: options.metadata as any,
      },
    });

    return {
      id: certificate.id,
      profileId: certificate.profile_id,
      certificateType: certificate.certificate_type as CertificateType,
      certificateUrl: certificate.certificate_url,
      certificateNumber: certificate.certificate_number,
      issuedDate: certificate.issued_date,
      metadata: certificate.metadata as CertificateMetadata,
    };
  }

  /**
   * Issue certificates to entire training batch
   */
  async issueBatchCertificates(
    request: BatchCertificateRequest,
    issuedByUserId?: string
  ): Promise<CertificateResponse[]> {
    // Fetch batch details
    const batch = await prisma.training_batches.findUnique({
      where: { id: request.batchId },
      select: {
        id: true,
        name: true,
        program_name: true,
        duration_days: true,
        trainer_batch_assignments: {
          where: {
            is_active: true,
          },
          select: {
            trainers: {
              select: {
                profiles: {
                  select: {
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new AppError('Training batch not found', 404);
    }

    // Fetch completed enrollments
    const whereClause: Record<string, unknown> = {
      batch_id: request.batchId,
      status: 'completed',
    };

    if (request.profileIds && request.profileIds.length > 0) {
      whereClause.profile_id = { in: request.profileIds };
    }

    const enrollments = await prisma.batch_enrollments.findMany({
      where: whereClause,
      select: {
        profile_id: true,
        completion_date: true,
        score: true,
      },
    });

    if (enrollments.length === 0) {
      throw new AppError('No completed enrollments found', 404);
    }

    // Issue certificates for each enrollment
    const certificates: CertificateResponse[] = [];

    for (const enrollment of enrollments) {
      if (!enrollment.profile_id) continue;

      try {
        const certificate = await this.issueCertificate(
          {
            profileId: enrollment.profile_id,
            certificateType: CertificateType.TRAINING,
            trainingBatchId: batch.id,
            metadata: {
              candidateName: '', // Will be fetched in issueCertificate
              candidateCode: '', // Will be fetched in issueCertificate
              courseName: batch.program_name,
              batchName: batch.name,
              duration: batch.duration_days ? `${batch.duration_days} days` : undefined,
              completionDate: enrollment.completion_date?.toLocaleDateString(),
              score: enrollment.score?.toString(),
              trainerName: batch.trainer_batch_assignments?.[0]?.trainers?.profiles
                ? `${batch.trainer_batch_assignments[0].trainers.profiles.first_name} ${batch.trainer_batch_assignments[0].trainers.profiles.last_name || ''}`.trim()
                : undefined,
            },
          },
          issuedByUserId
        );

        certificates.push(certificate);
      } catch (error) {
        // Failed to issue certificate - continue with next enrollment
        // Continue with next enrollment
      }
    }

    return certificates;
  }

  /**
   * Get certificates by profile
   */
  async getProfileCertificates(profileId: string): Promise<CertificateResponse[]> {
    const certificates = await prisma.certificates.findMany({
      where: { profile_id: profileId },
      orderBy: { issued_date: 'desc' },
    });

    return certificates.map(
      (cert): CertificateResponse => ({
        id: cert.id,
        profileId: cert.profile_id,
        certificateType: cert.certificate_type as CertificateType,
        certificateUrl: cert.certificate_url,
        certificateNumber: cert.certificate_number,
        issuedDate: cert.issued_date,
        metadata: cert.metadata as unknown as CertificateMetadata,
      })
    );
  }

  /**
   * Get certificate by ID
   */
  async getCertificateById(certificateId: string): Promise<CertificateResponse> {
    const certificate = await prisma.certificates.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new AppError('Certificate not found', 404);
    }

    return {
      id: certificate.id,
      profileId: certificate.profile_id,
      certificateType: certificate.certificate_type as CertificateType,
      certificateUrl: certificate.certificate_url,
      certificateNumber: certificate.certificate_number,
      issuedDate: certificate.issued_date,
      metadata: certificate.metadata as unknown as CertificateMetadata,
    };
  }

  /**
   * Get certificates with filters
   */
  async getCertificates(
    filters: CertificateFilter
  ): Promise<{ certificates: CertificateResponse[]; total: number }> {
    const where: Record<string, unknown> = {};

    if (filters.profileId) where.profile_id = filters.profileId;
    if (filters.certificateType) where.certificate_type = filters.certificateType;
    if (filters.trainingBatchId) where.training_batch_id = filters.trainingBatchId;
    if (filters.projectId) where.project_id = filters.projectId;

    if (filters.startDate || filters.endDate) {
      where.issued_date = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      };
    }

    const [certificates, total] = await Promise.all([
      prisma.certificates.findMany({
        where,
        orderBy: { issued_date: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.certificates.count({ where }),
    ]);

    return {
      certificates: certificates.map(
        (cert): CertificateResponse => ({
          id: cert.id,
          profileId: cert.profile_id,
          certificateType: cert.certificate_type as CertificateType,
          certificateUrl: cert.certificate_url,
          certificateNumber: cert.certificate_number,
          issuedDate: cert.issued_date,
          metadata: cert.metadata as unknown as CertificateMetadata,
        })
      ),
      total,
    };
  }
}

export default new CertificateService();
