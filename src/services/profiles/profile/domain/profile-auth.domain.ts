import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import jwt from 'jsonwebtoken';
import { ProfileBaseQuery } from '../queries/profile-base.query';

export class ProfileAuthDomain {
  /**
   * Generate JWT auth token for candidate
   */
  static async generateAuthToken(profileId: string): Promise<{ token: string }> {
    const profile = await ProfileBaseQuery.getProfileById(profileId);

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
