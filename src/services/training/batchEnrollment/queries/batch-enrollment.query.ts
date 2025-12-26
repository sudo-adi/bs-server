import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class BatchEnrollmentQuery {
  static async getAllEnrollments(
    filters?: {
      batch_id?: string;
      profileId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
    includeDetails = false
  ): Promise<{ enrollments: any[]; total: number }> {
    const where: Prisma.TrainingBatchEnrollmentWhereInput = {};

    if (filters?.batch_id) {
      where.batchId = filters.batch_id;
    }

    if (filters?.profileId) {
      where.profileId = filters.profileId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [enrollments, total] = await Promise.all([
      prisma.trainingBatchEnrollment.findMany({
        where,
        include: includeDetails
          ? {
              profile: {
                include: {
                  skills: {
                    where: { isPrimary: true },
                    take: 1,
                    include: {
                      skillCategory: true,
                    },
                  },
                },
              },
              batch: {
                include: {
                  trainers: {
                    include: {
                      trainerProfile: {
                        select: {
                          id: true,
                          candidateCode: true,
                          firstName: true,
                          lastName: true,
                          phone: true,
                        },
                      },
                    },
                  },
                },
              },
            }
          : undefined,
        orderBy: { enrollmentDate: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.trainingBatchEnrollment.count({ where }),
    ]);

    const enrichedEnrollments = enrollments.map((enrollment: any) => {
      const enriched = enrollment;
      if (includeDetails && enriched.profile?.skills?.[0]) {
        const primarySkill = enriched.profile.skills[0];
        enriched.primary_skillCategoryId = primarySkill.skillCategoryId || undefined;
        enriched.primary_skill_category_name = primarySkill.skillCategory?.name || undefined;
      }
      return enriched;
    });

    return {
      enrollments: enrichedEnrollments,
      total,
    };
  }

  static async getEnrollmentById(id: string, includeDetails = false): Promise<any> {
    const enrollment = await prisma.trainingBatchEnrollment.findUnique({
      where: { id },
      include: includeDetails
        ? {
            profile: {
              include: {
                skills: {
                  where: { isPrimary: true },
                  take: 1,
                  include: {
                    skillCategory: true,
                  },
                },
              },
            },
            batch: {
              include: {
                trainers: {
                  include: {
                    trainerProfile: {
                      select: {
                        id: true,
                        candidateCode: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          }
        : undefined,
    });

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }

    const enriched = enrollment as any;
    if (includeDetails && enriched.profile?.skills?.[0]) {
      const primarySkill = enriched.profile.skills[0];
      enriched.primary_skillCategoryId = primarySkill.skillCategoryId || undefined;
      enriched.primary_skill_category_name = primarySkill.skillCategory?.name || undefined;
    }

    return enriched;
  }
}
