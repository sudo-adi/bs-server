import { AppError } from '@/middlewares/errorHandler';
import profileService from '@/services/profiles/profile/profile.service';

export class AuthProfileQuery {
  /**
   * Get current candidate profile from token
   */
  static async getCurrentCandidate(profileId: string): Promise<any> {
    const profile = await profileService.getProfileById(profileId, true);

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    if (!profile.is_active) {
      throw new AppError('Your account is inactive', 403);
    }

    return profile;
  }
}
