import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { TRAINING_BATCH_STATUSES, TrainingBatchStatus } from '@/constants/stages';

export class TrainingBatchBaseQuery {
  async getAllBatches(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ batches: any[]; total: number }> {
    const where: Prisma.TrainingBatchWhereInput = {};

    if (filters?.status) {
      // Handle multiple statuses (comma-separated)
      const statuses = filters.status.split(',').map((s) => s.trim());

      // Validate each status
      const validStatuses = Object.values(TRAINING_BATCH_STATUSES);
      for (const status of statuses) {
        if (!validStatuses.includes(status as TrainingBatchStatus)) {
          throw new AppError(
            `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
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
          trainers: {
            include: {
              trainerProfile: {
                select: {
                  id: true,
                  candidateCode: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { startDate: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.trainingBatch.count({ where }),
    ]);

    // Transform batches: add enrolled_count and flatten trainers
    const batchesWithCount = batches.map((batch) => {
      // Get the first trainer (primary trainer) and flatten the structure
      const primaryTrainer = batch.trainers?.[0];
      const trainerData = primaryTrainer?.trainerProfile
        ? {
            id: primaryTrainer.trainerProfile.id,
            name: `${primaryTrainer.trainerProfile.firstName || ''} ${primaryTrainer.trainerProfile.lastName || ''}`.trim() || null,
            email: primaryTrainer.trainerProfile.email || null,
            phone: primaryTrainer.trainerProfile.phone || null,
            employeeCode: primaryTrainer.trainerProfile.candidateCode || null,
            shift: primaryTrainer.shift || null,
          }
        : null;

      // Destructure to remove original trainers array and enrollments
      const { trainers: _originalTrainers, enrollments, ...batchWithoutTrainersAndEnrollments } = batch;

      return {
        ...batchWithoutTrainersAndEnrollments,
        enrolled_count: enrollments.length,
        trainers: trainerData, // Flatten to single trainer object (or null)
      };
    });

    return {
      batches: batchesWithCount,
      total,
    };
  }

  async getBatchById(id: string, includeEnrollments = false): Promise<any> {
    const batch = await prisma.trainingBatch.findUnique({
      where: { id },
      include: {
        trainers: {
          include: {
            trainerProfile: {
              select: {
                id: true,
                candidateCode: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        ...(includeEnrollments
          ? {
              enrollments: {
                include: {
                  profile: {
                    select: {
                      id: true,
                      candidateCode: true,
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      phone: true,
                      email: true,
                      currentStage: true,
                      gender: true,
                      dateOfBirth: true,
                      profilePhotoURL: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
                orderBy: { enrollmentDate: 'desc' },
              },
            }
          : {}),
      },
    });

    if (!batch) {
      throw new AppError('Training batch not found', 404);
    }

    // Get the first trainer (primary trainer) and flatten the structure
    const primaryTrainer = batch.trainers?.[0];
    const trainerData = primaryTrainer?.trainerProfile
      ? {
          id: primaryTrainer.trainerProfile.id,
          name: `${primaryTrainer.trainerProfile.firstName || ''} ${primaryTrainer.trainerProfile.lastName || ''}`.trim() || null,
          email: primaryTrainer.trainerProfile.email || null,
          phone: primaryTrainer.trainerProfile.phone || null,
          employeeCode: primaryTrainer.trainerProfile.candidateCode || null,
          shift: primaryTrainer.shift || null,
        }
      : null;

    // Destructure to remove original trainers array, then add flattened version
    const { trainers: _originalTrainers, ...batchWithoutTrainers } = batch;

    return {
      ...batchWithoutTrainers,
      trainers: trainerData, // Flatten to single trainer object (or null)
    };
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
