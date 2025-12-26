import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class TrainingBatchBaseQuery {
  async getAllBatches(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ batches: any[]; total: number }> {
    const where: Prisma.TrainingBatchWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { programName: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [batches, total] = await Promise.all([
      prisma.trainingBatch.findMany({
        where,
        include: {
          enrollments: {
            where: {
              status: { not: 'withdrawn' },
            },
            select: { id: true },
          },
        },
        orderBy: { startDate: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.trainingBatch.count({ where }),
    ]);

    // Add enrolled_count to each batch
    const batchesWithCount = batches.map((batch) => ({
      ...batch,
      enrolled_count: batch.enrollments.length,
      enrollments: undefined, // Remove from response
    }));

    return {
      batches: batchesWithCount,
      total,
    };
  }

  async getBatchById(id: string, includeEnrollments = false): Promise<any> {
    const batch = await prisma.trainingBatch.findUnique({
      where: { id },
      include: includeEnrollments
        ? {
            enrollments: {
              include: {
                profile: true,
              },
              orderBy: { enrollmentDate: 'desc' },
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
    const count = await prisma.trainingBatchEnrollment.count({
      where: {
        batchId: batchId,
        status: {
          not: 'withdrawn',
        },
      },
    });

    return count;
  }
}
