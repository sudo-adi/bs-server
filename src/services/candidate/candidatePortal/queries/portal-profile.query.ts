import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class PortalProfileQuery {
  /**
   * Get candidate's full profile with all details
   * Includes personal info, addresses, qualifications, skills, documents, bank accounts
   */
  static async getProfile(profileId: string) {
    const profile = await prisma.profiles.findFirst({
      where: {
        id: profileId,
        deleted_at: null,
      },
      include: {
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
          include: {
            qualification_types: true,
            documents: true,
          },
          orderBy: { created_at: 'desc' },
        },
        documents: {
          include: {
            document_categories: true,
          },
          orderBy: { created_at: 'desc' },
        },
        bank_accounts: {
          orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
        },
        stage_transitions: {
          orderBy: { transitioned_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // Get current stage
    const currentStage = (profile as any).stage_transitions[0]?.to_stage || null;

    return {
      ...profile,
      current_stage: currentStage,
      stage_transitions: undefined, // Remove from response
    };
  }
}
