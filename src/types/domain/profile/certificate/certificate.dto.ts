import type { Certificate } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

// Prisma-based DTOs
export type CreateCertificateDto = CreateDTO<Certificate>;
export type UpdateCertificateDto = UpdateDTO<Certificate>;

// Enums
export enum CertificateType {
  TRAINING = 'training',
  PROJECT = 'project',
}

export enum CertificateStatus {
  PENDING = 'pending',
  GENERATED = 'generated',
  FAILED = 'failed',
}

export interface CertificateData {
  profileId: string;
  certificateType: CertificateType;
  trainingBatchId?: string;
  projectId?: string;
  issuedByUserId?: string;
  metadata?: CertificateMetadata;
}

export interface CertificateMetadata {
  candidateName: string;
  candidateCode: string;
  courseName?: string;
  batchName?: string;
  projectName?: string;
  duration?: string;
  completionDate?: string;
  score?: string | number;
  trainerName?: string;
  skills?: string[];
  [key: string]: any;
}

export interface GenerateCertificateOptions {
  profileId: string;
  certificateType: CertificateType;
  metadata: CertificateMetadata;
  trainingBatchId?: string;
  projectId?: string;
}

export interface BatchCertificateRequest {
  batchId: string;
  profileIds?: string[];
}

export interface CertificateResponse {
  id: string;
  profileId: string;
  certificateType: CertificateType;
  certificateUrl: string;
  certificateNumber: string;
  issuedDate: Date;
  metadata?: CertificateMetadata;
}

export interface IssueCertificateRequest {
  profileIds: string[];
  certificateType: CertificateType;
  trainingBatchId?: string;
  projectId?: string;
  metadata?: Partial<CertificateMetadata>;
}

export interface PDFGenerationOptions {
  candidateName: string;
  candidateCode: string;
  certificateNumber: string;
  certificateType: CertificateType;
  courseName?: string;
  batchName?: string;
  projectName?: string;
  duration?: string;
  completionDate: string;
  issueDate: string;
  organizationName: string;
  organizationLogo?: Buffer;
  score?: string | number;
  trainerName?: string;
  skills?: string[];
}

export interface SupabaseUploadResult {
  url: string;
  path: string;
  bucket: string;
}

export interface CertificateFilter {
  profileId?: string;
  certificateType?: CertificateType;
  trainingBatchId?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
