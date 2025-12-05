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

    // Count batches for each trainer (using candidate_code as trainer_id reference)
    const trainersWithBatches = await Promise.all(
      profilesData.map(async (profile) => {
        const batchCount = await prisma.training_batches.count({
          where: { trainer_id: profile.id },
        });

        // Construct full name
        const nameParts = [profile.first_name, profile.middle_name, profile.last_name].filter(
          Boolean
        );
        const fullName = nameParts.join(' ');

        return {
          id: profile.id,
          name: fullName,
          email: profile.email || '',
          phone: profile.phone,
          password_hash: profile.password_hash,
          profile_photo_url: profile.profile_photo_url,
          employee_code: profile.candidate_code,
          is_active: profile.is_active ?? true,
          created_by_user_id: null,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          batch_count: batchCount,
        };
      })
    );

    return { trainers: trainersWithBatches, total };
  }

  async getTrainerById(id: string, includeBatches?: boolean): Promise<TrainerWithBatches> {
    // Get trainer profile from profiles table
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

    if (!profile || profile.deleted_at || !profile.candidate_code?.startsWith('BSW')) {
      throw new AppError('Trainer not found', 404);
    }

    // Check if profile has "Trainer" skill
    const hasTrainerSkill = profile.profile_skills.some(
      (skill) => skill.skill_categories?.name.toLowerCase() === 'trainer'
    );

    if (!hasTrainerSkill) {
      throw new AppError('Profile does not have Trainer skill', 404);
    }

    // Get batches if requested
    let batches = undefined;
    if (includeBatches) {
      batches = await prisma.training_batches.findMany({
        where: { trainer_id: id },
        orderBy: { created_at: 'desc' },
      });
    }

    // Construct full name
    const nameParts = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean);
    const fullName = nameParts.join(' ');

    // Get batch count
    const batchCount = await prisma.training_batches.count({
      where: { trainer_id: id },
    });

    const result: TrainerWithBatches = {
      id: profile.id,
      name: fullName,
      email: profile.email || '',
      phone: profile.phone,
      password_hash: profile.password_hash,
      profile_photo_url: profile.profile_photo_url,
      employee_code: profile.candidate_code,
      is_active: profile.is_active ?? true,
      created_by_user_id: null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      training_batches: batches,
      batch_count: batchCount,
    };

    return result;
  }

  async getBatchCount(trainerId: string): Promise<number> {
    return prisma.training_batches.count({
      where: { trainer_id: trainerId },
    });
  }
}
