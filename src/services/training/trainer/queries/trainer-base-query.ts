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
    const where: Prisma.trainersWhereInput = {};

    // Filter by active status
    if (filters?.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    // Search by name, email, phone, or employee code
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { employee_code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [trainersData, total] = await Promise.all([
      prisma.trainers.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
        include: {
          _count: {
            select: {
              training_batches: true,
            },
          },
        },
      }),
      prisma.trainers.count({ where }),
    ]);

    // Map trainers to include batch_count
    const trainers = trainersData.map((trainer) => ({
      id: trainer.id,
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      password_hash: trainer.password_hash,
      profile_photo_url: trainer.profile_photo_url,
      employee_code: trainer.employee_code,
      is_active: trainer.is_active,
      created_by_user_id: trainer.created_by_user_id,
      created_at: trainer.created_at,
      updated_at: trainer.updated_at,
      batch_count: trainer._count.training_batches,
    }));

    return { trainers, total };
  }

  async getTrainerById(id: string, includeBatches?: boolean): Promise<TrainerWithBatches> {
    const trainer = await prisma.trainers.findUnique({
      where: { id },
      include: {
        training_batches: includeBatches
          ? {
              orderBy: { created_at: 'desc' },
            }
          : false,
      },
    });

    if (!trainer) {
      throw new AppError('Trainer not found', 404);
    }

    // Add batch count if batches are included
    const result: TrainerWithBatches = {
      ...trainer,
      batch_count: includeBatches ? trainer.training_batches?.length : undefined,
    };

    return result;
  }

  async getBatchCount(trainerId: string): Promise<number> {
    return prisma.training_batches.count({
      where: { trainer_id: trainerId },
    });
  }
}
