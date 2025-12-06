import prisma from '@/config/prisma';
import type { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { Trainer, TrainerWithBatches } from '@/types';

export class TrainerBaseQuery {
  async getAllTrainers(filters?: {
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ trainers: Trainer[]; total: number }> {
    // First, get the "Trainer" skill category ID
    const trainerSkill = await prisma.skill_categories.findFirst({
      where: { name: { equals: 'Trainer', mode: 'insensitive' } },
    });

    if (!trainerSkill) {
      return { trainers: [], total: 0 };
    }

    // Build where clause for profiles
    const where: Prisma.profilesWhereInput = {
      // Must have BSW code (candidate_code starting with "BSW")
      candidate_code: { startsWith: 'BSW' },
      // Must have "Trainer" skill
      profile_skills: {
        some: {
          skill_category_id: trainerSkill.id,
        },
      },
      // Not deleted
      deleted_at: null,
    };

    // Filter by active status
    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    // Search by name, email, phone, or candidate code
    if (filters?.search) {
      where.OR = [
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { candidate_code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [profilesData, total] = await Promise.all([
      prisma.profiles.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
        include: {
          profile_skills: {
            where: { skill_category_id: trainerSkill.id },
            include: {
              skill_categories: true,
            },
          },
        },
      }),
      prisma.profiles.count({ where }),
    ]);

    // Convert profiles to trainers and get their trainer records
    const trainersWithBatches = await Promise.all(
      profilesData.map(async (profile) => {
        // Find or get trainer record
        const trainer = await prisma.trainers.findUnique({
          where: { profile_id: profile.id },
        });

        // Count active batch assignments
        const batchCount = trainer
          ? await prisma.trainer_batch_assignments.count({
              where: { trainer_id: trainer.id, is_active: true },
            })
          : 0;

        return {
          ...trainer,
          profile_id: profile.id,
          specialization: trainer?.specialization || null,
          certifications: trainer?.certifications || null,
          years_of_experience: trainer?.years_of_experience || null,
          bio: trainer?.bio || null,
          is_active: trainer?.is_active ?? true,
          created_by_user_id: trainer?.created_by_user_id || null,
          created_at: trainer?.created_at || profile.created_at,
          updated_at: trainer?.updated_at || profile.updated_at,
          id: trainer?.id || profile.id, // Use trainer ID if exists, otherwise profile ID
          batch_count: batchCount,
        } as Trainer & { batch_count: number };
      })
    );

    return { trainers: trainersWithBatches, total };
  }

  async getTrainerById(id: string, includeBatches?: boolean): Promise<TrainerWithBatches> {
    // Get trainer record
    const trainer = await prisma.trainers.findUnique({
      where: { id },
      include: {
        profiles: {
          include: {
            profile_skills: {
              include: {
                skill_categories: true,
              },
            },
          },
        },
      },
    });

    if (!trainer || !trainer.profiles || trainer.profiles.deleted_at) {
      throw new AppError('Trainer not found', 404);
    }

    // Get batch assignments if requested
    let assignments = undefined;
    if (includeBatches) {
      assignments = await prisma.trainer_batch_assignments.findMany({
        where: { trainer_id: id, is_active: true },
        include: {
          training_batches: true,
        },
        orderBy: { created_at: 'desc' },
      });
    }

    // Get batch count
    const batchCount = await prisma.trainer_batch_assignments.count({
      where: { trainer_id: id, is_active: true },
    });

    const result: TrainerWithBatches = {
      ...trainer,
      trainer_batch_assignments: assignments,
      batch_count: batchCount,
    };

    return result;
  }

  async getBatchCount(trainerId: string): Promise<number> {
    return prisma.trainer_batch_assignments.count({
      where: { trainer_id: trainerId, is_active: true },
    });
  }
}
