import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import {
  ProjectMatchedProfileStatus,
  mapProjectMatchedProfileStatusToProfileStage,
} from '@/types/enums';

export class ProjectMatchingOperation {
  /**
   * Save matched profiles for a project
   * Status: matched → Profile stage: ALLOCATED
   */
  static async saveMatchedProfiles(
    projectId: string,
    matchedProfiles: Array<{ profile_id: string; skill_category_id: string }>
  ): Promise<any> {
    const project = await prisma.projects.findUnique({ where: { id: projectId } });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        matchedProfiles.map((profile) =>
          tx.project_matched_profiles.upsert({
            where: {
              project_id_profile_id_skill_category_id: {
                project_id: projectId,
                profile_id: profile.profile_id,
                skill_category_id: profile.skill_category_id,
              },
            },
            create: {
              project_id: projectId,
              profile_id: profile.profile_id,
              skill_category_id: profile.skill_category_id,
              status: ProjectMatchedProfileStatus.MATCHED,
            },
            update: {
              status: ProjectMatchedProfileStatus.MATCHED,
              updated_at: new Date(),
            },
          })
        )
      );

      const newStage = mapProjectMatchedProfileStatusToProfileStage(
        ProjectMatchedProfileStatus.MATCHED
      );

      if (newStage) {
        await Promise.all(
          matchedProfiles.map(async (profile) => {
            const latestTransition = await tx.stage_transitions.findFirst({
              where: { profile_id: profile.profile_id },
              orderBy: { transitioned_at: 'desc' },
              select: { to_stage: true },
            });

            await tx.stage_transitions.create({
              data: {
                profile_id: profile.profile_id,
                from_stage: latestTransition?.to_stage || null,
                to_stage: newStage,
                notes: `Matched to project: ${project.name}`,
              },
            });
          })
        );
      }
    });

    return {
      project_id: projectId,
      matched_count: matchedProfiles.length,
    };
  }

  /**
   * Share matched profiles with employer
   * Changes status from 'matched' to 'shared'
   * Status: shared → Profile stage: ONBOARDED
   */
  static async shareMatchedProfiles(projectId: string, userId?: string): Promise<any> {
    const project = await prisma.projects.findUnique({ where: { id: projectId } });

    if (!project || project.deleted_at) {
      throw new AppError('Project not found', 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const matchedProfiles = await tx.project_matched_profiles.findMany({
        where: {
          project_id: projectId,
          status: ProjectMatchedProfileStatus.MATCHED,
        },
        select: { profile_id: true },
      });

      const updateResult = await tx.project_matched_profiles.updateMany({
        where: {
          project_id: projectId,
          status: ProjectMatchedProfileStatus.MATCHED,
        },
        data: {
          status: ProjectMatchedProfileStatus.SHARED,
          shared_at: new Date(),
          shared_by_user_id: userId,
        },
      });

      await tx.projects.update({
        where: { id: projectId },
        data: {
          status: 'allocated',
          updated_at: new Date(),
        },
      });

      const newStage = mapProjectMatchedProfileStatusToProfileStage(
        ProjectMatchedProfileStatus.SHARED
      );

      if (newStage && matchedProfiles.length > 0) {
        await Promise.all(
          matchedProfiles.map(async (matchedProfile) => {
            const latestTransition = await tx.stage_transitions.findFirst({
              where: { profile_id: matchedProfile.profile_id },
              orderBy: { transitioned_at: 'desc' },
              select: { to_stage: true },
            });

            await tx.stage_transitions.create({
              data: {
                profile_id: matchedProfile.profile_id,
                from_stage: latestTransition?.to_stage || null,
                to_stage: newStage,
                transitioned_by_user_id: userId,
                notes: `Details shared with employer for project: ${project.name}`,
              },
            });
          })
        );
      }

      return updateResult;
    });

    return {
      project_id: projectId,
      shared_count: result.count,
      shared_at: new Date(),
    };
  }

  /**
   * Mark matched profile as onboarded
   */
  static async onboardMatchedProfile(
    projectId: string,
    profileId: string,
    skillCategoryId: string
  ): Promise<any> {
    const matchedProfile = await prisma.project_matched_profiles.findUnique({
      where: {
        project_id_profile_id_skill_category_id: {
          project_id: projectId,
          profile_id: profileId,
          skill_category_id: skillCategoryId,
        },
      },
    });

    if (!matchedProfile) {
      throw new AppError('Matched profile not found', 404);
    }

    if (matchedProfile.status !== ProjectMatchedProfileStatus.SHARED) {
      throw new AppError(
        `Cannot onboard profile with status '${matchedProfile.status}'. Must be 'shared'`,
        400
      );
    }

    await prisma.project_matched_profiles.delete({
      where: {
        project_id_profile_id_skill_category_id: {
          project_id: projectId,
          profile_id: profileId,
          skill_category_id: skillCategoryId,
        },
      },
    });

    return {
      success: true,
      message: 'Matched profile removed. Profile is now ready for project assignment.',
    };
  }
}
