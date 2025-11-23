import prisma from '@/config/prisma';
import type { profiles } from '@/generated/prisma';
import { ProfileWithDetails } from '@/models/profiles/profile.model';

export class ProfileBaseQuery {
  /**
   * Get profile by ID with all related data
   */
  static async getProfileById(
    id: string,
    includeDetails = false
  ): Promise<ProfileWithDetails | null> {
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
      ...(includeDetails && enrichedBatchEnrollments
        ? { batch_enrollments: enrichedBatchEnrollments }
        : {}),
    } as ProfileWithDetails;
  }

  /**
   * Get profile by mobile number
   */
  static async getProfileByMobile(phone: string): Promise<profiles | null> {
    const profile = await prisma.profiles.findFirst({
      where: {
        phone: phone,
        deleted_at: null,
      },
    });

    return profile;
  }

  /**
   * Check if mobile number exists
   */
  static async checkMobileNumberExists(
    mobileNumber: string,
    excludeProfileId?: string
  ): Promise<boolean> {
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

  /**
   * Get current stage for a profile from stage_transitions table
   */
  static async getCurrentStage(profileId: string): Promise<string | null> {
    const latestTransition = await prisma.stage_transitions.findFirst({
      where: { profile_id: profileId },
      orderBy: { transitioned_at: 'desc' },
      select: { to_stage: true },
    });

    return latestTransition?.to_stage || null;
  }
}
