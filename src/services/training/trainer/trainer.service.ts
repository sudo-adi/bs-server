import prisma from '@/config/prisma';
import { CreateTrainerDto, Trainer, TrainerWithBatches, UpdateTrainerDto } from '@/types';
import { TrainerCreateOperation } from './operations/trainer-create.operation';
import { TrainerDeleteOperation } from './operations/trainer-delete.operation';
import { TrainerUpdateOperation } from './operations/trainer-update.operation';
import { TrainerBaseQuery } from './queries/trainer-base-query';

export class TrainerService {
  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  async getAllTrainers(filters?: {
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ trainers: Trainer[]; total: number }> {
    const query = new TrainerBaseQuery();
    return query.getAllTrainers(filters);
  }

  async getTrainerById(id: string, includeBatches?: boolean): Promise<TrainerWithBatches> {
    const query = new TrainerBaseQuery();
    return query.getTrainerById(id, includeBatches);
  }

  async getBatchCount(trainerId: string): Promise<number> {
    const query = new TrainerBaseQuery();
    return query.getBatchCount(trainerId);
  }

  async getTrainerBatches(trainerId: string): Promise<any[]> {
    const batches = await prisma.training_batches.findMany({
      where: {
        trainer_id: trainerId,
      },
      orderBy: {
        start_date: 'asc',
      },
    });

    return batches;
  }

  // ============================================================================
  // CREATE, UPDATE, DELETE OPERATIONS
  // ============================================================================

  async createTrainer(data: CreateTrainerDto): Promise<Trainer> {
    return TrainerCreateOperation.create(data);
  }

  async updateTrainer(id: string, data: UpdateTrainerDto): Promise<Trainer> {
    const operation = new TrainerUpdateOperation();
    return operation.updateTrainer(id, data);
  }

  async deleteTrainer(id: string): Promise<void> {
    const operation = new TrainerDeleteOperation();
    return operation.delete(id);
  }
}

export default new TrainerService();
