/**
 * Training Batch Enrollment DTOs
 */

// ==================== REQUEST ====================

export interface CreateBatchEnrollmentDto {
  batchId: string;
  profileId: string;
  notes?: string;
}

export interface UpdateBatchEnrollmentDto {
  status?: 'enrolled' | 'in_progress' | 'completed' | 'dropped' | 'failed';
  attendancePercentage?: number;
  performanceScore?: number;
  notes?: string;
  completedAt?: Date | string;
}

export interface BulkEnrollDto {
  batchId: string;
  profileIds: string[];
}

// ==================== RESPONSE ====================

export interface TrainingBatchEnrollmentResponse {
  id: string;
  batchId: string | null;
  profileId: string | null;
  status: string | null;
  enrolledAt: Date | null;
  enrolledByProfileId: string | null;
  completedAt: Date | null;
  droppedAt: Date | null;
  droppedReason: string | null;
  attendancePercentage: number | null;
  performanceScore: number | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  profile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    workerCode: string | null;
    candidateCode: string | null;
    phone: string | null;
  } | null;
  batch?: {
    id: string;
    batchCode: string | null;
    name: string | null;
  } | null;
}

export interface BulkEnrollmentResult {
  success: number;
  failed: number;
  enrollments: TrainingBatchEnrollmentResponse[];
  errors: Array<{ profileId: string; error: string }>;
}

// ==================== QUERY ====================

export interface BatchEnrollmentListQuery {
  batchId?: string;
  profileId?: string;
  status?: string;
  page?: number;
  limit?: number;
}
