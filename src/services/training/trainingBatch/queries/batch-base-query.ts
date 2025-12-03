import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
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
      // Handle multiple statuses (comma-separated)
      const statuses = filters.status.split(',').map((s) => s.trim());

      // Validate each status
      for (const status of statuses) {
        if (!TRAINING_BATCH_STATUSES.includes(status as TrainingBatchStatus)) {
          throw new AppError(
            `Invalid status: ${status}. Must be one of: ${TRAINING_BATCH_STATUSES.join(', ')}`,
            400
          );
        }
      }

      // Use IN query if multiple statuses, direct match if single
      if (statuses.length > 1) {
        where.status = { in: statuses };
      } else {
        where.status = statuses[0];
      }
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
          trainers: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              employee_code: true,
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
  ): Promise<any> {
    const batch = await prisma.training_batches.findUnique({
      where: { id },
      include: {
        trainers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            employee_code: true,
          },
        },
        ...(includeEnrollments
          ? {
              batch_enrollments: {
                include: {
                  profiles: {
                    select: {
                      id: true,
                      candidate_code: true,
                      first_name: true,
                      middle_name: true,
                      last_name: true,
                      phone: true,
                      email: true,
                      current_stage: true,
                      previous_stage: true,
                      gender: true,
                      date_of_birth: true,
                      profile_photo_url: true,
                      created_at: true,
                      updated_at: true,
                    },
                  },
                },
                orderBy: { enrollment_date: 'desc' },
              },
            }
          : {}),
      },
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
