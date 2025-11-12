import { env } from '@/config/env';
import prisma from '@/config/prisma';
import type { profiles } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { ChangeStageDto, ProfileWithDetails } from '@/models/profiles/profile.model';
import { PROFILE_STAGES, ProfileStage, isValidStageTransition } from '@/types/enums';
import type { CreateProfileDto, UpdateProfileDto } from '@/types/prisma.types';
import { sanitizeObject } from '@/utils/sanitize';
import jwt from 'jsonwebtoken';

export class ProfileService {
  // Generate unique profile code
  private async generateProfileCode(): Promise<string> {
    const prefix = 'BS';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Create a new profile
  async createProfile(data: CreateProfileDto): Promise<profiles> {
    // eslint-disable-next-line no-useless-catch
    try {
      // Sanitize all string inputs to prevent XSS
      const sanitizedData = sanitizeObject(data);

      // Check if mobile number already exists
      const existingProfile = await prisma.profiles.findFirst({
        where: {
          phone: sanitizedData.phone,
          deleted_at: null,
        },
      });

      if (existingProfile) {
        throw new AppError('Mobile number already registered', 400);
      }

      // Generate profile code
      const profileCode = sanitizedData.candidate_code || (await this.generateProfileCode());

      // Determine initial stage - default to 'new_joinee'
      const initialStage = ProfileStage.NEW_JOINEE;

      // Use Prisma transaction to create profile and stage transition
      const profile = await prisma.$transaction(async (tx) => {
        // Create profile with initial stage
        const newProfile = await tx.profiles.create({
          data: {
            candidate_code: profileCode,
            phone: sanitizedData.phone,
            alt_phone: sanitizedData.alt_phone,
            email: sanitizedData.email,
            first_name: sanitizedData.first_name,
            middle_name: sanitizedData.middle_name,
            last_name: sanitizedData.last_name,
            fathers_name: sanitizedData.fathers_name,
            gender: sanitizedData.gender,
            date_of_birth: sanitizedData.date_of_birth,
            profile_photo_url: sanitizedData.profile_photo_url,
            is_active: sanitizedData.is_active !== false,
          },
        });

        // Create initial stage transition for audit trail
        await tx.stage_transitions.create({
          data: {
            profile_id: newProfile.id,
            to_stage: initialStage,
            notes: 'Initial profile creation',
          },
        });

        return newProfile;
      });

      return profile;
    } catch (error) {
      throw error;
    }
  }

  // Get profile by ID with all related data
  async getProfileById(id: string, includeDetails = false): Promise<ProfileWithDetails | null> {
    const profile = await prisma.profiles.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: includeDetails
        ? {
            addresses: {
              orderBy: { created_at: 'desc' },
            },
            profile_skills: {
              include: {
                skill_categories: true,
              },
              orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
            },
            qualifications: {
              orderBy: { created_at: 'desc' },
            },
            batch_enrollments: {
              include: {
                training_batches: true,
              },
              orderBy: { enrollment_date: 'desc' },
              where: {
                status: {
                  in: ['enrolled', 'in_progress'],
                },
              },
            },
            interactions: {
              orderBy: { interaction_date: 'desc' },
            },
            documents: {
              orderBy: { created_at: 'desc' },
            },
            bank_accounts: {
              orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
            },
            stage_transitions: {
              orderBy: { transitioned_at: 'desc' },
            },
            project_assignments: {
              include: {
                projects: true,
              },
              orderBy: { created_at: 'desc' },
            },
            profile_blacklist: {
              where: { is_active: true },
              orderBy: { blacklisted_at: 'desc' },
              take: 1,
            },
          }
        : {
            profile_blacklist: {
              where: { is_active: true },
              orderBy: { blacklisted_at: 'desc' },
              take: 1,
            },
          },
    });

    if (!profile) {
      return null;
    }

    // Get current stage from stage_transitions
    const currentStage = await this.getCurrentStage(id);

    // Check if profile is blacklisted
    const isBlacklisted = profile.profile_blacklist && profile.profile_blacklist.length > 0;

    // Calculate training days left for each batch enrollment (only if details are included)
    let enrichedBatchEnrollments;
    if (includeDetails && (profile as any).batch_enrollments) {
      enrichedBatchEnrollments = (profile as any).batch_enrollments.map((enrollment: any) => {
        if (enrollment.training_batches?.end_date) {
          const today = new Date();
          const endDate = new Date(enrollment.training_batches.end_date);
          const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return {
            ...enrollment,
            training_days_left: daysLeft > 0 ? daysLeft : 0,
          };
        }
        return {
          ...enrollment,
          training_days_left: null,
        };
      });
    }

    // Add current_stage and is_blacklisted to the profile
    return {
      ...profile,
      current_stage: currentStage || null,
      is_blacklisted: isBlacklisted,
      ...(includeDetails && enrichedBatchEnrollments ? { batch_enrollments: enrichedBatchEnrollments } : {}),
    } as ProfileWithDetails;
  }

  // Get all profiles with filtering
  async getAllProfiles(filters?: {
    stage?: string;
    skill_category_id?: string;
    isActive?: boolean;
    isBlacklisted?: boolean;
    search?: string;
    trainer_name?: string;
    training_batch_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: profiles[]; total: number }> {
    // If filtering by skill, use skill-based query
    if (filters?.skill_category_id) {
      return this.getProfilesBySkill(filters.skill_category_id, filters);
    }

    // If filtering by stage, use specialized query with stage_transitions
    if (filters?.stage) {
      return this.getProfilesByStage(filters.stage, filters);
    }

    // If filtering by trainer or batch, use specialized query
    if (filters?.trainer_name || filters?.training_batch_id) {
      return this.getProfilesByTraining(filters);
    }

    // Build WHERE clause
    const where: any = {
      deleted_at: null,
    };

    if (filters?.isActive !== undefined) {
      where.is_active = filters.isActive;
    }

    if (filters?.isBlacklisted !== undefined) {
      where.profile_blacklist = filters.isBlacklisted
        ? { some: { is_active: true } }
        : { none: { is_active: true } };
    }

    if (filters?.search) {
      where.OR = [
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { candidate_code: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.profiles.count({ where });

    const profiles = await prisma.profiles.findMany({
      where,
      include: {
        stage_transitions: {
          orderBy: { transitioned_at: 'desc' },
          take: 1,
        },
        profile_blacklist: {
          where: { is_active: true },
          orderBy: { blacklisted_at: 'desc' },
          take: 1,
        },
        project_assignments: {
          where: {
            status: 'deployed', // Only get currently deployed assignments
          },
          include: {
            projects: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { deployment_date: 'desc' },
          take: 1, // Get the most recent deployment
        },
        batch_enrollments: {
          where: {
            status: {
              in: ['enrolled', 'in_progress'],
            },
          },
          include: {
            training_batches: true,
          },
          orderBy: { enrollment_date: 'desc' },
          take: 1, // Get the most recent active enrollment
        },
      },
      orderBy: { created_at: 'desc' },
      take: filters?.limit,
      skip: filters?.offset,
    });

    const profilesWithStage = profiles.map((profile: any) => {
      const currentAssignment = profile.project_assignments?.[0];
      const currentEnrollment = profile.batch_enrollments?.[0];

      // Calculate training days left
      let trainingDaysLeft = null;
      if (currentEnrollment?.training_batches?.end_date) {
        const today = new Date();
        const endDate = new Date(currentEnrollment.training_batches.end_date);
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        trainingDaysLeft = daysLeft > 0 ? daysLeft : 0;
      }

      // Enrich batch enrollment with calculated field
      const enrichedBatchEnrollments = currentEnrollment ? [{
        ...currentEnrollment,
        training_days_left: trainingDaysLeft,
      }] : [];

      return {
        ...profile,
        current_stage: profile.stage_transitions[0]?.to_stage || null,
        is_blacklisted: profile.profile_blacklist && profile.profile_blacklist.length > 0,
        current_project_name: currentAssignment?.projects?.name || null,
        current_deployment_start_date: currentAssignment?.deployment_date || null,
        current_deployment_end_date:
          currentAssignment?.actual_end_date || currentAssignment?.expected_end_date || null,
        batch_enrollments: enrichedBatchEnrollments,
        stage_transitions: undefined, // Remove from response
        profile_blacklist: undefined, // Remove from response
        project_assignments: undefined, // Remove from response
      };
    });

    return {
      profiles: profilesWithStage,
      total,
    };
  }

  // Get profiles by current stage (using stage_transitions)
  private async getProfilesByStage(
    stage: string,
    additionalFilters?: any
  ): Promise<{ profiles: profiles[]; total: number }> {
    // Validate stage
    if (!PROFILE_STAGES.includes(stage as ProfileStage)) {
      throw new AppError(
        `Invalid stage: ${stage}. Must be one of: ${PROFILE_STAGES.join(', ')}`,
        400
      );
    }

    // Use raw SQL to get profiles with latest stage matching the filter
    let whereConditions = 'p.deleted_at IS NULL';

    if (additionalFilters?.isActive !== undefined) {
      whereConditions += ` AND p.is_active = ${additionalFilters.isActive}`;
    }

    if (additionalFilters?.isBlacklisted !== undefined) {
      whereConditions += ` AND ${additionalFilters.isBlacklisted ? 'EXISTS' : 'NOT EXISTS'} (
        SELECT 1 FROM profile_blacklist pb
        WHERE pb.profile_id = p.id AND pb.is_active = true
      )`;
    }

    if (additionalFilters?.search) {
      const searchTerm = additionalFilters.search.replace(/'/g, "''");
      whereConditions += ` AND (
        p.first_name ILIKE '%${searchTerm}%' OR
        p.last_name ILIKE '%${searchTerm}%' OR
        p.phone ILIKE '%${searchTerm}%' OR
        p.candidate_code ILIKE '%${searchTerm}%' OR
        p.email ILIKE '%${searchTerm}%'
      )`;
    }

    const limitClause = additionalFilters?.limit ? ` LIMIT ${additionalFilters.limit}` : '';
    const offsetClause = additionalFilters?.offset ? ` OFFSET ${additionalFilters.offset}` : '';

    // Query profiles with their latest stage, current project assignment, and training batch
    const profiles: any = await prisma.$queryRawUnsafe(`
      SELECT
        p.*,
        latest_stage.to_stage as current_stage,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM profile_blacklist pb
            WHERE pb.profile_id = p.id AND pb.is_active = true
          ) THEN true
          ELSE false
        END as is_blacklisted,
        current_assignment.project_name as current_project_name,
        current_assignment.deployment_date as current_deployment_start_date,
        COALESCE(current_assignment.actual_end_date, current_assignment.expected_end_date) as current_deployment_end_date,
        current_training.batch_enrollment_id,
        current_training.batch_id,
        current_training.batch_name,
        current_training.batch_code,
        current_training.trainer_name,
        current_training.start_date as training_start_date,
        current_training.end_date as training_end_date,
        current_training.training_status,
        current_training.program_name as training_program_name,
        current_training.location as training_location,
        current_training.enrollment_status,
        CASE
          WHEN current_training.end_date IS NOT NULL THEN
            GREATEST(0, (current_training.end_date::date - CURRENT_DATE::date))
          ELSE NULL
        END as training_days_left
      FROM profiles p
      INNER JOIN LATERAL (
        SELECT to_stage
        FROM stage_transitions
        WHERE profile_id = p.id
        ORDER BY transitioned_at DESC
        LIMIT 1
      ) latest_stage ON true
      LEFT JOIN LATERAL (
        SELECT proj.name as project_name, pa.deployment_date, pa.actual_end_date, pa.expected_end_date
        FROM project_assignments pa
        JOIN projects proj ON proj.id = pa.project_id
        WHERE pa.profile_id = p.id AND pa.status = 'deployed'
        ORDER BY pa.deployment_date DESC
        LIMIT 1
      ) current_assignment ON true
      LEFT JOIN LATERAL (
        SELECT
          be.id as batch_enrollment_id,
          tb.id as batch_id,
          tb.name as batch_name,
          tb.code as batch_code,
          tb.trainer_name,
          tb.start_date,
          tb.end_date,
          tb.status as training_status,
          tb.program_name,
          tb.location,
          be.status as enrollment_status
        FROM batch_enrollments be
        JOIN training_batches tb ON tb.id = be.batch_id
        WHERE be.profile_id = p.id AND be.status IN ('enrolled', 'in_progress')
        ORDER BY be.enrollment_date DESC
        LIMIT 1
      ) current_training ON true
      WHERE ${whereConditions}
        AND latest_stage.to_stage = '${stage}'
      ORDER BY p.created_at DESC${limitClause}${offsetClause}
    `);

    // Get total count
    const countResult: any = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int as count
      FROM profiles p
      INNER JOIN LATERAL (
        SELECT to_stage
        FROM stage_transitions
        WHERE profile_id = p.id
        ORDER BY transitioned_at DESC
        LIMIT 1
      ) latest_stage ON true
      WHERE ${whereConditions}
        AND latest_stage.to_stage = '${stage}'
    `);

    // Transform results to nest training batch data properly
    const transformedProfiles = profiles.map((profile: any) => {
      const {
        batch_enrollment_id,
        batch_id,
        batch_name,
        batch_code,
        trainer_name,
        training_start_date,
        training_end_date,
        training_status,
        training_program_name,
        training_location,
        enrollment_status,
        training_days_left,
        ...profileData
      } = profile;

      // Build batch enrollment if exists
      const batch_enrollments = batch_enrollment_id ? [{
        id: batch_enrollment_id,
        batch_id,
        status: enrollment_status,
        training_batches: {
          id: batch_id,
          name: batch_name,
          code: batch_code,
          trainer_name,
          start_date: training_start_date,
          end_date: training_end_date,
          status: training_status,
          program_name: training_program_name,
          location: training_location,
        },
        training_days_left,
      }] : [];

      return {
        ...profileData,
        batch_enrollments,
      };
    });

    return {
      profiles: transformedProfiles,
      total: countResult[0]?.count || 0,
    };
  }

  // Get profiles by skill category
  private async getProfilesBySkill(
    skillCategoryId: string,
    additionalFilters?: any
  ): Promise<{ profiles: profiles[]; total: number }> {
    const where: any = {
      deleted_at: null,
      profile_skills: {
        some: {
          skill_category_id: skillCategoryId,
        },
      },
    };

    if (additionalFilters?.isActive !== undefined) {
      where.is_active = additionalFilters.isActive;
    }

    if (additionalFilters?.isBlacklisted !== undefined) {
      where.profile_blacklist = additionalFilters.isBlacklisted
        ? { some: { is_active: true } }
        : { none: { is_active: true } };
    }

    if (additionalFilters?.search) {
      where.OR = [
        { first_name: { contains: additionalFilters.search, mode: 'insensitive' } },
        { last_name: { contains: additionalFilters.search, mode: 'insensitive' } },
        { phone: { contains: additionalFilters.search, mode: 'insensitive' } },
        { candidate_code: { contains: additionalFilters.search, mode: 'insensitive' } },
        { email: { contains: additionalFilters.search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.profiles.count({ where });

    const profiles = await prisma.profiles.findMany({
      where,
      include: {
        stage_transitions: {
          orderBy: { transitioned_at: 'desc' },
          take: 1,
        },
        profile_blacklist: {
          where: { is_active: true },
          orderBy: { blacklisted_at: 'desc' },
          take: 1,
        },
        project_assignments: {
          where: {
            status: 'deployed', // Only get currently deployed assignments
          },
          include: {
            projects: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { deployment_date: 'desc' },
          take: 1, // Get the most recent deployment
        },
        batch_enrollments: {
          where: {
            status: {
              in: ['enrolled', 'in_progress'],
            },
          },
          include: {
            training_batches: true,
          },
          orderBy: { enrollment_date: 'desc' },
          take: 1, // Get the most recent active enrollment
        },
      },
      orderBy: { created_at: 'desc' },
      take: additionalFilters?.limit,
      skip: additionalFilters?.offset,
    });

    // Add current_stage, is_blacklisted, project info, and training batch info
    const profilesWithStage = profiles.map((profile: any) => {
      const currentAssignment = profile.project_assignments?.[0];
      const currentEnrollment = profile.batch_enrollments?.[0];

      // Calculate training days left
      let trainingDaysLeft = null;
      if (currentEnrollment?.training_batches?.end_date) {
        const today = new Date();
        const endDate = new Date(currentEnrollment.training_batches.end_date);
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        trainingDaysLeft = daysLeft > 0 ? daysLeft : 0;
      }

      // Enrich batch enrollment with calculated field
      const enrichedBatchEnrollments = currentEnrollment ? [{
        ...currentEnrollment,
        training_days_left: trainingDaysLeft,
      }] : [];

      return {
        ...profile,
        current_stage: profile.stage_transitions[0]?.to_stage || null,
        is_blacklisted: profile.profile_blacklist && profile.profile_blacklist.length > 0,
        current_project_name: currentAssignment?.projects?.name || null,
        current_deployment_start_date: currentAssignment?.deployment_date || null,
        current_deployment_end_date:
          currentAssignment?.actual_end_date || currentAssignment?.expected_end_date || null,
        batch_enrollments: enrichedBatchEnrollments,
        stage_transitions: undefined,
        profile_blacklist: undefined,
        project_assignments: undefined,
      };
    });

    return {
      profiles: profilesWithStage,
      total,
    };
  }

  // Get profiles by training batch or trainer name
  private async getProfilesByTraining(filters: {
    trainer_name?: string;
    training_batch_id?: string;
    isActive?: boolean;
    isBlacklisted?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ profiles: profiles[]; total: number }> {
    const where: any = {
      deleted_at: null,
      batch_enrollments: {
        some: {
          status: {
            in: ['enrolled', 'in_progress'],
          },
          ...(filters.training_batch_id && {
            batch_id: filters.training_batch_id,
          }),
          ...(filters.trainer_name && {
            training_batches: {
              trainer_name: {
                contains: filters.trainer_name,
                mode: 'insensitive',
              },
            },
          }),
        },
      },
    };

    if (filters.isActive !== undefined) {
      where.is_active = filters.isActive;
    }

    if (filters.isBlacklisted !== undefined) {
      where.profile_blacklist = filters.isBlacklisted
        ? { some: { is_active: true } }
        : { none: { is_active: true } };
    }

    if (filters.search) {
      where.OR = [
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { candidate_code: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.profiles.count({ where });

    const profiles = await prisma.profiles.findMany({
      where,
      include: {
        stage_transitions: {
          orderBy: { transitioned_at: 'desc' },
          take: 1,
        },
        profile_blacklist: {
          where: { is_active: true },
          orderBy: { blacklisted_at: 'desc' },
          take: 1,
        },
        project_assignments: {
          where: {
            status: 'deployed',
          },
          include: {
            projects: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { deployment_date: 'desc' },
          take: 1,
        },
        batch_enrollments: {
          where: {
            status: {
              in: ['enrolled', 'in_progress'],
            },
          },
          include: {
            training_batches: true,
          },
          orderBy: { enrollment_date: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    });

    // Transform profiles with training batch data
    const profilesWithStage = profiles.map((profile: any) => {
      const currentAssignment = profile.project_assignments?.[0];
      const currentEnrollment = profile.batch_enrollments?.[0];

      // Calculate training days left
      let trainingDaysLeft = null;
      if (currentEnrollment?.training_batches?.end_date) {
        const today = new Date();
        const endDate = new Date(currentEnrollment.training_batches.end_date);
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        trainingDaysLeft = daysLeft > 0 ? daysLeft : 0;
      }

      // Enrich batch enrollment with calculated field
      const enrichedBatchEnrollments = currentEnrollment ? [{
        ...currentEnrollment,
        training_days_left: trainingDaysLeft,
      }] : [];

      return {
        ...profile,
        current_stage: profile.stage_transitions[0]?.to_stage || null,
        is_blacklisted: profile.profile_blacklist && profile.profile_blacklist.length > 0,
        current_project_name: currentAssignment?.projects?.name || null,
        current_deployment_start_date: currentAssignment?.deployment_date || null,
        current_deployment_end_date:
          currentAssignment?.actual_end_date || currentAssignment?.expected_end_date || null,
        batch_enrollments: enrichedBatchEnrollments,
        stage_transitions: undefined,
        profile_blacklist: undefined,
        project_assignments: undefined,
      };
    });

    return {
      profiles: profilesWithStage,
      total,
    };
  }

  // Update profile
  async updateProfile(id: string, data: UpdateProfileDto): Promise<profiles> {
    // Sanitize all string inputs to prevent XSS
    const sanitizedData = sanitizeObject(data);

    // Filter out undefined values
    const updateData: Record<string, unknown> = {};
    Object.entries(sanitizedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const profile = await prisma.profiles.update({
      where: {
        id,
        deleted_at: null,
      },
      data: updateData,
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    return profile;
  }

  // Change profile stage
  async changeStage(profileId: string, data: ChangeStageDto): Promise<profiles> {
    // eslint-disable-next-line no-useless-catch
    try {
      // Validate stage value
      if (!PROFILE_STAGES.includes(data.to_stage as ProfileStage)) {
        throw new AppError(
          `Invalid stage: ${data.to_stage}. Must be one of: ${PROFILE_STAGES.join(', ')}`,
          400
        );
      }

      // Use Prisma transaction to get current stage and create transition
      const profile = await prisma.$transaction(async (tx) => {
        // Get current profile
        const currentProfile = await tx.profiles.findFirst({
          where: {
            id: profileId,
            deleted_at: null,
          },
        });

        if (!currentProfile) {
          throw new AppError('Profile not found', 404);
        }

        // Get latest stage from stage_transitions
        const latestTransition = await tx.stage_transitions.findFirst({
          where: { profile_id: profileId },
          orderBy: { transitioned_at: 'desc' },
          select: { to_stage: true },
        });

        const currentStage = latestTransition?.to_stage || null;

        // Validate stage transition if there's a current stage
        if (
          currentStage &&
          !isValidStageTransition(currentStage as ProfileStage, data.to_stage as ProfileStage)
        ) {
          throw new AppError(
            `Invalid stage transition from ${currentStage} to ${data.to_stage}`,
            400
          );
        }

        // Record stage transition (this is the source of truth for current stage)
        await tx.stage_transitions.create({
          data: {
            profile_id: profileId,
            from_stage: currentStage,
            to_stage: data.to_stage,
            transitioned_by_user_id: data.user_id,
            notes: data.notes,
          },
        });

        return currentProfile;
      });

      return profile;
    } catch (error) {
      throw error;
    }
  }

  // Note: Blacklist management has been moved to profileBlacklist.service.ts
  // Use that service for blacklisting/unblacklisting profiles

  // Delete profile (soft delete using deleted_at)
  async deleteProfile(id: string): Promise<void> {
    const profile = await prisma.profiles.update({
      where: {
        id,
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }
  }

  // Hard delete profile (use with caution)
  async hardDeleteProfile(id: string): Promise<void> {
    const profile = await prisma.profiles.delete({
      where: { id },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }
  }

  // Check if mobile number exists
  async checkMobileNumberExists(mobileNumber: string, excludeProfileId?: string): Promise<boolean> {
    const where: any = {
      phone: mobileNumber,
      deleted_at: null,
    };

    if (excludeProfileId) {
      where.id = { not: excludeProfileId };
    }

    const count = await prisma.profiles.count({ where });
    return count > 0;
  }

  // Get profile by mobile number
  async getProfileByMobile(phone: string): Promise<profiles | null> {
    const profile = await prisma.profiles.findFirst({
      where: {
        phone: phone,
        deleted_at: null,
      },
    });

    return profile;
  }

  // Get current stage for a profile from stage_transitions table
  async getCurrentStage(profileId: string): Promise<string | null> {
    const latestTransition = await prisma.stage_transitions.findFirst({
      where: { profile_id: profileId },
      orderBy: { transitioned_at: 'desc' },
      select: { to_stage: true },
    });

    return latestTransition?.to_stage || null;
  }

  // Generate JWT auth token for candidate
  async generateAuthToken(profileId: string): Promise<{ token: string }> {
    const profile = await this.getProfileById(profileId);

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    const token = jwt.sign(
      {
        profileId: profile.id,
        mobile_number: profile.phone,
        type: 'candidate',
      },
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return { token };
  }
}

export default new ProfileService();
