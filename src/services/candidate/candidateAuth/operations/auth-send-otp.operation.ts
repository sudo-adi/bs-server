import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import profileService from '@/services/profiles/profile/profile.service';

// Mock OTP store (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

export class AuthSendOtpOperation {
  /**
   * Generate and send OTP to candidate's mobile number
   * For now, this is a mock implementation that returns OTP in response
   * In production, integrate with SMS service (Twilio, AWS SNS, etc.)
   */
  static async sendOTP(phone: string): Promise<{ message: string; otp?: string }> {
    // Check if profile exists with this phone number
    const profile = await profileService.getProfileByMobile(phone);

    if (!profile) {
      throw new AppError('Mobile number not registered. Please register first.', 404);
    }

    // Check if profile is active and approved (ready_to_deploy stage)
    const currentStage = await profileService.getCurrentStage(profile.id);

    // Only allow login for approved candidates (ready_to_deploy stage)
    if (currentStage !== 'ready_to_deploy') {
      throw new AppError(
        'Your profile is under review. You can login once your profile is approved.',
        403
      );
    }

    // Check if profile is active
    if (!profile.is_active) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    // Check if profile is blacklisted
    const profileWithDetails = await profileService.getProfileById(profile.id, false);
    if (profileWithDetails && (profileWithDetails as any).is_blacklisted) {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5 minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    otpStore.set(phone, { otp, expiresAt });

    // TODO: In production, send OTP via SMS service
    // await smsService.send(phone, `Your OTP is: ${otp}`);

    // For development, return OTP in response (REMOVE IN PRODUCTION)
    return {
      message: 'OTP sent successfully',
      otp: env.NODE_ENV === 'development' ? otp : undefined, // Only return OTP in dev mode
    };
  }

  /**
   * Get OTP store (for verification)
   */
  static getOtpStore(): Map<string, { otp: string; expiresAt: Date }> {
    return otpStore;
  }
}
