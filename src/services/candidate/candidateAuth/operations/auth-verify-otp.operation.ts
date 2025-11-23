import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import profileService from '@/services/profiles/profile/profile.service';
import jwt from 'jsonwebtoken';
import { AuthSendOtpOperation } from './auth-send-otp.operation';

interface CandidateJwtPayload {
  profileId: string;
  phone: string;
  type: 'candidate';
}

interface CandidateAuthResponse {
  profile: any;
  token: string;
}

export class AuthVerifyOtpOperation {
  /**
   * Verify OTP and return JWT token
   */
  static async verifyOTP(phone: string, otp: string): Promise<CandidateAuthResponse> {
    // Get stored OTP
    const otpStore = AuthSendOtpOperation.getOtpStore();
    const storedOtpData = otpStore.get(phone);

    if (!storedOtpData) {
      throw new AppError('OTP not found or expired. Please request a new OTP.', 400);
    }

    // Check if OTP is expired
    if (new Date() > storedOtpData.expiresAt) {
      otpStore.delete(phone);
      throw new AppError('OTP has expired. Please request a new OTP.', 400);
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      throw new AppError('Invalid OTP. Please try again.', 400);
    }

    // Delete OTP after successful verification
    otpStore.delete(phone);

    // Get profile
    const profile = await profileService.getProfileByMobile(phone);

    if (!profile) {
      throw new AppError('Profile not found', 404);
    }

    // Verify profile is still active and approved
    const currentStage = await profileService.getCurrentStage(profile.id);
    if (currentStage !== 'ready_to_deploy') {
      throw new AppError('Your profile is not approved yet', 403);
    }

    if (!profile.is_active) {
      throw new AppError('Your account is inactive', 403);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        profileId: profile.id,
        phone: profile.phone,
        type: 'candidate',
      } as CandidateJwtPayload,
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Get full profile details
    const profileDetails = await profileService.getProfileById(profile.id, true);

    return {
      profile: profileDetails,
      token,
    };
  }
}
