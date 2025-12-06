import prisma from '@/config/prisma';
import { Trainer, TrainerWithBatches } from '@/types';
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
    const assignments = await prisma.trainer_batch_assignments.findMany({
      where: {
        trainer_id: trainerId,
        is_active: true,
      },
      include: {
        training_batches: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return assignments.map((a) => a.training_batches);
  }
}

export default new TrainerService();
