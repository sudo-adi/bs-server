/**
 * Training Certificate DTOs
 */

// ==================== REQUEST ====================

export interface CreateTrainingCertificateDto {
  profileId: string;
  batchId?: string;
  enrollmentId?: string;
  certificateNumber: string;
  certificateName: string;
  issuedAt: Date | string;
  expiresAt?: Date | string;
  issuedByProfileId?: string;
  fileUrl?: string;
  notes?: string;
}

export interface UpdateTrainingCertificateDto {
  certificateName?: string;
  expiresAt?: Date | string;
  fileUrl?: string;
  notes?: string;
  status?: 'active' | 'expired' | 'revoked';
}

// ==================== RESPONSE ====================

export interface ProfileTrainingCertificateResponse {
  id: string;
  profileId: string | null;
  batchId: string | null;
  enrollmentId: string | null;
  certificateNumber: string | null;
  certificateName: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  issuedByProfileId: string | null;
  fileUrl: string | null;
  status: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  profile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    workerCode: string | null;
  } | null;
  batch?: {
    id: string;
    batchCode: string | null;
    name: string | null;
  } | null;
}

// ==================== QUERY ====================

export interface TrainingCertificateListQuery {
  profileId?: string;
  batchId?: string;
  status?: string;
  page?: number;
  limit?: number;
}
