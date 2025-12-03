import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { TrainingBatchWithEnrollments } from '@/types';
import { TRAINING_BATCH_STATUSES, TrainingBatchStatus } from '@/types/enums';

export class TrainingBatchBaseQuery {
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
          }
        : undefined,
    });

    if (!batch) {
      throw new AppError('Training batch not found', 404);
    }

    return batch;
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
