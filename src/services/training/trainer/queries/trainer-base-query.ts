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
      // Must have "Trainer" as PRIMARY skill
      profile_skills: {
        some: {
          skill_category_id: trainerSkill.id,
          is_primary: true, // Only profiles with Trainer as primary skill
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
            where: {
              skill_category_id: trainerSkill.id,
              is_primary: true,
            },
            include: {
              skill_categories: true,
            },
          },
        },
      }),
      prisma.profiles.count({ where }),
    ]);

    // Convert profiles to trainers
    const trainersWithBatches = await Promise.all(
      profilesData.map(async (profile) => {
        // Count batches where this profile is assigned as trainer (via trainer_id field in training_batches)
        const batchCount = await prisma.training_batches.count({
          where: { trainer_id: profile.id },
        });

        // Build trainer name from profile
        const name = [profile.first_name, profile.middle_name, profile.last_name]
          .filter(Boolean)
          .join(' ');

        // Get years of experience from profile skill
        const primarySkill = profile.profile_skills?.[0];
        const years_of_experience = primarySkill?.years_of_experience || 0;

        return {
          id: profile.id, // Use profile ID as trainer ID
          profile_id: profile.id,
          name, // Full name from profile
          email: profile.email || null,
          phone: profile.phone,
          employee_code: profile.candidate_code, // BSW code
          profile_photo_url: profile.profile_photo_url || null,
          specialization: null, // Can be added to profile later if needed
          certifications: null, // Can be added to profile later if needed
          years_of_experience,
          bio: null, // Can be added to profile later if needed
          is_active: profile.is_active ?? true,
          created_by_user_id: null,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          batch_count: batchCount,
        } as Trainer & { batch_count: number; name: string; email: string | null; phone: string; employee_code: string };
      })
    );

    return { trainers: trainersWithBatches, total };
  }

  async getTrainerById(id: string, includeBatches?: boolean): Promise<TrainerWithBatches> {
    // Get profile (trainer) by ID
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

    if (!profile || profile.deleted_at) {
      throw new AppError('Trainer not found', 404);
    }

    // Verify profile has Trainer as primary skill
    const hasTrainerSkill = profile.profile_skills.some(
      (ps) =>
        ps.skill_categories?.name.toLowerCase() === 'trainer' &&
        ps.is_primary === true
    );

    if (!hasTrainerSkill) {
      throw new AppError('Profile is not a trainer', 404);
    }

    // Get batches if requested
    let batches = undefined;
    if (includeBatches) {
      batches = await prisma.training_batches.findMany({
        where: { trainer_id: id },
        orderBy: { start_date: 'desc' },
      });
    }

    // Get batch count
    const batchCount = await prisma.training_batches.count({
      where: { trainer_id: id },
    });

    // Build trainer name from profile
    const name = [profile.first_name, profile.middle_name, profile.last_name]
      .filter(Boolean)
      .join(' ');

    // Get years of experience from primary Trainer skill
    const trainerSkill = profile.profile_skills.find(
      (ps) => ps.skill_categories?.name.toLowerCase() === 'trainer' && ps.is_primary
    );

    const result: any = {
      id: profile.id,
      profile_id: profile.id,
      name,
      email: profile.email || null,
      phone: profile.phone,
      employee_code: profile.candidate_code,
      profile_photo_url: profile.profile_photo_url || null,
      specialization: null,
      certifications: null,
      years_of_experience: trainerSkill?.years_of_experience || 0,
      bio: null,
      is_active: profile.is_active ?? true,
      created_by_user_id: null,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      batch_count: batchCount,
      training_batches: batches,
    };

    return result;
  }

  async getBatchCount(trainerId: string): Promise<number> {
    return prisma.training_batches.count({
      where: { trainer_id: trainerId },
    });
  }
}
