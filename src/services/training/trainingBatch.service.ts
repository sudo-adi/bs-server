import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  CreateTrainingBatchDto,
  TrainingBatch,
  TrainingBatchWithEnrollments,
  UpdateTrainingBatchDto,
} from '@/models/training/trainingBatch.model';
import { TRAINING_BATCH_STATUSES, TrainingBatchStatus } from '@/types/enums';

export class TrainingBatchService {
  async getAllBatches(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ batches: any[]; total: number }> {
    const where: Prisma.training_batchesWhereInput = {};

    if (filters?.status) {
      // Validate status
      if (!TRAINING_BATCH_STATUSES.includes(filters.status as TrainingBatchStatus)) {
        throw new AppError(
          `Invalid status: ${filters.status}. Must be one of: ${TRAINING_BATCH_STATUSES.join(', ')}`,
          400
        );
      }
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { program_name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [batches, total] = await Promise.all([
      prisma.training_batches.findMany({
        where,
        include: {
          batch_enrollments: {
            where: {
              status: { not: 'withdrawn' },
            },
            select: { id: true },
          },
          skill_categories: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { start_date: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.training_batches.count({ where }),
    ]);

    // Add enrolled_count to each batch
    const batchesWithCount = batches.map((batch) => ({
      ...batch,
      enrolled_count: batch.batch_enrollments.length,
      batch_enrollments: undefined, // Remove from response
    }));

    return {
      batches: batchesWithCount,
      total,
    };
  }

  async getBatchById(
    id: string,
    includeEnrollments = false
  ): Promise<TrainingBatchWithEnrollments> {
    const batch = await prisma.training_batches.findUnique({
      where: { id },
      include: includeEnrollments
        ? {
            batch_enrollments: {
              include: {
                profiles: true,
              },
              orderBy: { enrollment_date: 'desc' },
            },
            skill_categories: true,
          }
        : {
            skill_categories: true,
          },
    });

    if (!batch) {
      throw new AppError('Training batch not found', 404);
    }

    return batch;
  }

  async createBatch(data: CreateTrainingBatchDto): Promise<TrainingBatch> {
    // Generate batch code
    const lastBatch = await prisma.training_batches.findFirst({
      where: {
        code: {
          startsWith: 'BTH',
        },
      },
      orderBy: {
        code: 'desc',
      },
      select: {
        code: true,
      },
    });

    let nextCode = 1;
    if (lastBatch?.code) {
      const currentCode = parseInt(lastBatch.code.substring(3));
      if (!isNaN(currentCode)) {
        nextCode = currentCode + 1;
      }
    }

    const code = `BTH${String(nextCode).padStart(5, '0')}`;

    const batch = await prisma.training_batches.create({
      data: {
        code,
        name: data.name,
        program_name: data.program_name,
        skill_category_id: data.skill_category_id,
        provider: data.provider,
        trainer_name: data.trainer_name,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
        duration_days: data.duration_days,
        max_capacity: data.max_capacity,
        status: data.status || TrainingBatchStatus.UPCOMING,
        location: data.location,
        description: data.description,
        created_by_user_id: data.created_by_user_id,
      },
    });

    return batch;
  }

  async updateBatch(id: string, data: UpdateTrainingBatchDto): Promise<TrainingBatch> {
    if (Object.keys(data).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    try {
      const batch = await prisma.training_batches.update({
        where: { id },
        data,
      });

      return batch;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Training batch not found', 404);
      }
      throw error;
    }
  }

  async deleteBatch(id: string): Promise<void> {
    try {
      await prisma.training_batches.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError('Training batch not found', 404);
      }
      throw error;
    }
  }

  async getEnrollmentCount(batchId: string): Promise<number> {
    const count = await prisma.batch_enrollments.count({
      where: {
        batch_id: batchId,
        status: {
          not: 'withdrawn',
        },
      },
    });

    return count;
  }
}

export default new TrainingBatchService();
