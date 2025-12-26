import { BatchEnrollmentCreateOperation } from './operations/batch-enrollment-create.operation';
import { BatchEnrollmentDeleteOperation } from './operations/batch-enrollment-delete.operation';
import { BatchEnrollmentUpdateOperation } from './operations/batch-enrollment-update.operation';
import { BatchEnrollmentQuery } from './queries/batch-enrollment.query';

export class BatchEnrollmentService {
  async getAllEnrollments(
    filters?: {
      batch_id?: string;
      profileId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
    includeDetails = false
  ): Promise<{ enrollments: any[]; total: number }> {
    return BatchEnrollmentQuery.getAllEnrollments(filters, includeDetails);
  }

  async getEnrollmentById(id: string, includeDetails = false): Promise<any> {
    return BatchEnrollmentQuery.getEnrollmentById(id, includeDetails);
  }

  async createEnrollment(data: {
    batch_id?: string;
    profileId?: string;
    enrollment_date?: Date;
    status?: string;
    notes?: string;
    enrolled_by_user_id?: string;
  }): Promise<any> {
    return BatchEnrollmentCreateOperation.create(data);
  }

  async updateEnrollment(id: string, data: Record<string, any>): Promise<any> {
    return BatchEnrollmentUpdateOperation.update(id, data);
  }

  async deleteEnrollment(id: string): Promise<void> {
    return BatchEnrollmentDeleteOperation.delete(id);
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkMarkCompleted(
    enrollmentIds: string[]
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const errors: any[] = [];
    let successCount = 0;

    for (const enrollmentId of enrollmentIds) {
      try {
        await this.updateEnrollment(enrollmentId, {
          status: 'completed',
          completionDate: new Date(),
        });
        successCount++;
      } catch (error) {
        errors.push({
          enrollment_id: enrollmentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
    };
  }

  async bulkMarkDropped(
    enrollmentIds: string[]
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    const errors: any[] = [];
    let successCount = 0;

    for (const enrollmentId of enrollmentIds) {
      try {
        await this.updateEnrollment(enrollmentId, {
          status: 'dropped',
        });
        successCount++;
      } catch (error) {
        errors.push({
          enrollment_id: enrollmentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: successCount,
      failed: errors.length,
      errors,
    };
  }
}

export default new BatchEnrollmentService();
