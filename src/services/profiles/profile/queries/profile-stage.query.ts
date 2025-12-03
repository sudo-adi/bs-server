import prisma from '@/config/prisma';
import type { profiles } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import { PROFILE_STAGES, ProfileStage } from '@/types/enums';

export class ProfileStageQuery {
  /**
   * Get profiles by current stage (using stage_transitions)
   */
  static async getProfilesByStage(
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
        SELECT proj.name as project_name
        FROM project_worker_assignments pa
        JOIN projects proj ON proj.id = pa.project_id
        WHERE pa.profile_id = p.id
        ORDER BY pa.created_at DESC
        LIMIT 1
      ) current_assignment ON true
      LEFT JOIN LATERAL (
        SELECT
          be.id as batch_enrollment_id,
          tb.id as batch_id,
          tb.name as batch_name,
          tb.code as batch_code,
          t.name as trainer_name,
          tb.start_date,
          tb.end_date,
          tb.status as training_status,
          tb.program_name,
          tb.location,
          be.status as enrollment_status
        FROM batch_enrollments be
        JOIN training_batches tb ON tb.id = be.batch_id
        LEFT JOIN trainers t ON t.id = tb.trainer_id
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
      const batch_enrollments = batch_enrollment_id
        ? [
            {
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
            },
          ]
        : [];

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
}
