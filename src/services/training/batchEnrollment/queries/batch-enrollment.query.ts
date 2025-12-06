import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  BatchEnrollmentWithDetails,
} from '@/types';
import { Prisma } from '@/generated/prisma';
import {
  BatchEnrollmentStatus,
  BATCH_ENROLLMENT_STATUSES,
} from '@/types/enums';

export class BatchEnrollmentQuery {
  static async getAllEnrollments(
    filters?: {
      batch_id?: string;
      profile_id?: string;
      status?: string;
      limit?: number;
      offset?: number;
    },
    includeDetails = false
  ): Promise<{ enrollments: BatchEnrollmentWithDetails[]; total: number }> {
    const where: Prisma.batch_enrollmentsWhereInput = {};

    if (filters?.batch_id) {
      where.batch_id = filters.batch_id;
    }

    if (filters?.profile_id) {
      where.profile_id = filters.profile_id;
    }

    if (filters?.status) {
      if (!BATCH_ENROLLMENT_STATUSES.includes(filters.status as BatchEnrollmentStatus)) {
        throw new AppError(
          `Invalid status: ${filters.status}. Must be one of: ${BATCH_ENROLLMENT_STATUSES.join(', ')}`,
          400
        );
      }
      where.status = filters.status;
    }

    const [enrollments, total] = await Promise.all([
      prisma.batch_enrollments.findMany({
        where,
        include: includeDetails
          ? {
              profiles: {
                include: {
                  profile_skills: {
                    where: { is_primary: true },
                    take: 1,
                    include: {
                      skill_categories: true,
                    },
                  },
                },
              },
              training_batches: {
                include: {
                  trainer_batch_assignments: {
                    where: {
                      is_active: true,
                    },
                    include: {
                      trainers: {
                        include: {
                          profiles: {
                            select: {
                              id: true,
                              candidate_code: true,
                              first_name: true,
                              last_name: true,
                              phone: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            }
          : undefined,
        orderBy: { enrollment_date: 'desc' },
        take: filters?.limit,
        skip: filters?.offset,
      }),
      prisma.batch_enrollments.count({ where }),
    ]);

    const enrichedEnrollments = enrollments.map((enrollment) => {
      const enriched = enrollment as BatchEnrollmentWithDetails;
      if (includeDetails && enriched.profiles?.profile_skills?.[0]) {
        const primarySkill = enriched.profiles.profile_skills[0];
        enriched.primary_skill_category_id = primarySkill.skill_category_id || undefined;
        enriched.primary_skill_category_name = primarySkill.skill_categories?.name || undefined;
      }
      return enriched;
    });

    return {
      enrollments: enrichedEnrollments,
      total,
    };
  }

  static async getEnrollmentById(id: string, includeDetails = false): Promise<BatchEnrollmentWithDetails> {
    const enrollment = await prisma.batch_enrollments.findUnique({
      where: { id },
      include: includeDetails
        ? {
            profiles: {
              include: {
                profile_skills: {
                  where: { is_primary: true },
                  take: 1,
                  include: {
                    skill_categories: true,
                  },
                },
              },
            },
            training_batches: {
              include: {
                trainer_batch_assignments: {
                  where: {
                    is_active: true,
                  },
                  include: {
                    trainers: {
                      include: {
                        profiles: {
                          select: {
                            id: true,
                            candidate_code: true,
                            first_name: true,
                            last_name: true,
                            phone: true,
                          },
                        },
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

    const enriched = enrollment as BatchEnrollmentWithDetails;
    if (includeDetails && enriched.profiles?.profile_skills?.[0]) {
      const primarySkill = enriched.profiles.profile_skills[0];
      enriched.primary_skill_category_id = primarySkill.skill_category_id || undefined;
      enriched.primary_skill_category_name = primarySkill.skill_categories?.name || undefined;
    }

    return enriched;
  }
}
