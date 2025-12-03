import {
  CreateTrainingBatchDto,
  TrainingBatch,
  TrainingBatchWithEnrollments,
  UpdateTrainingBatchDto,
} from '@/types';
import { TrainingBatchCreateOperation } from './operations/training-batch-create.operation';
import { TrainingBatchDeleteOperation } from './operations/training-batch-delete.operation';
import { TrainingBatchUpdateOperation } from './operations/training-batch-update.operation';
import { TrainingBatchBaseQuery } from './queries/batch-base-query';

export class TrainingBatchService {
  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  async getAllBatches(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ batches: TrainingBatch[]; total: number }> {
    const query = new TrainingBatchBaseQuery();
    return query.getAllBatches(filters);
  }

  async getBatchById(
    id: string,
    includeEnrollments?: boolean
  ): Promise<TrainingBatchWithEnrollments> {
    const query = new TrainingBatchBaseQuery();
    return query.getBatchById(id, includeEnrollments);
  }

  async getEnrollmentCount(batchId: string): Promise<number> {
    const query = new TrainingBatchBaseQuery();
    return query.getEnrollmentCount(batchId);
  }

  // ============================================================================
  // CREATE, UPDATE, DELETE OPERATIONS
  // ============================================================================

  async createBatch(data: CreateTrainingBatchDto): Promise<TrainingBatch> {
    return TrainingBatchCreateOperation.create(data);
  }

  async updateBatch(id: string, data: UpdateTrainingBatchDto): Promise<TrainingBatch> {
    const operation = new TrainingBatchUpdateOperation();
    return operation.updateTrainingBatch(id, data);
  }

  async deleteBatch(id: string): Promise<void> {
    const operation = new TrainingBatchDeleteOperation();
    return operation.delete(id);
  }
}

export default new TrainingBatchService();
