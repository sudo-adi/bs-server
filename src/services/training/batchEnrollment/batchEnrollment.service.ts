import {
  BatchEnrollment,
  BatchEnrollmentWithDetails,
  CreateBatchEnrollmentDto,
  UpdateBatchEnrollmentDto,
} from '@/types';
import { BatchEnrollmentCreateOperation } from './operations/batch-enrollment-create.operation';
import { BatchEnrollmentDeleteOperation } from './operations/batch-enrollment-delete.operation';
import { BatchEnrollmentUpdateOperation } from './operations/batch-enrollment-update.operation';
import { BatchEnrollmentQuery } from './queries/batch-enrollment.query';

export class BatchEnrollmentService {
  async getAllEnrollments(
    filters?: {
      batch_id?: string;
      profile_id?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
    includeDetails = false
  ): Promise<{ enrollments: BatchEnrollmentWithDetails[]; total: number }> {
    return BatchEnrollmentQuery.getAllEnrollments(filters, includeDetails);
  }

  async getEnrollmentById(id: string, includeDetails = false): Promise<BatchEnrollmentWithDetails> {
    return BatchEnrollmentQuery.getEnrollmentById(id, includeDetails);
  }

  async createEnrollment(data: CreateBatchEnrollmentDto): Promise<BatchEnrollment> {
    return BatchEnrollmentCreateOperation.create(data);
  }

  async updateEnrollment(id: string, data: UpdateBatchEnrollmentDto): Promise<BatchEnrollment> {
    return BatchEnrollmentUpdateOperation.update(id, data);
  }

  async deleteEnrollment(id: string): Promise<void> {
    return BatchEnrollmentDeleteOperation.delete(id);
  }
}

export default new BatchEnrollmentService();
