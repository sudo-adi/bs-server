import prisma from '@/config/prisma';
import { Trainer, TrainerWithBatches } from '@/types';
import { TrainerBaseQuery } from './queries/trainer-base-query';
import { UpdateTrainerDto } from '@/types/domain/training/trainer.dto';
import { AppError } from '@/middlewares/errorHandler';

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
        start_date: 'desc',
      },
    });

    return batches;
  }

  // ============================================================================
  // MUTATION OPERATIONS
  // ============================================================================

  /**
   * Update trainer info
   * NOTE: Trainers are profiles with "Trainer" as primary skill
   * To update trainer info, update the profile and profile_skills
   */
  async updateTrainer(id: string, data: UpdateTrainerDto): Promise<Trainer> {
    // Verify the profile exists and is a trainer
    const profile = await prisma.profiles.findUnique({
      where: { id },
      include: {
        profile_skills: {
          include: {
            skill_categories: true,
          },
        },
      },
    });

    if (!profile) {
      throw new AppError('Trainer not found', 404);
    }

    // Verify has Trainer as primary skill
    const hasTrainerSkill = profile.profile_skills.some(
      (ps) =>
        ps.skill_categories?.name.toLowerCase() === 'trainer' &&
        ps.is_primary === true
    );

    if (!hasTrainerSkill) {
      throw new AppError('Profile is not a trainer', 404);
    }

    // For now, trainer-specific fields (specialization, certifications, bio) are not supported
    // These would need to be added to the profiles table or stored separately

    // Return the trainer data
    const query = new TrainerBaseQuery();
    return query.getTrainerById(id);
  }
}

export default new TrainerService();
