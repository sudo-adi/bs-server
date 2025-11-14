import { env } from '@/config/env';
import { AppError } from '@/middlewares/errorHandler';
import jwt from 'jsonwebtoken';
import profileService from '../profiles/profile.service';

interface CandidateJwtPayload {
  profileId: string;
  phone: string;
  type: 'candidate';
}

interface CandidateAuthResponse {
  profile: any;
  token: string;
}

// Mock OTP store (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

export class CandidateAuthService {
  /**
   * Generate and send OTP to candidate's mobile number
   * For now, this is a mock implementation that returns OTP in response
   * In production, integrate with SMS service (Twilio, AWS SNS, etc.)
   */
  async sendOTP(phone: string): Promise<{ message: string; otp?: string }> {
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
   * Verify OTP and return JWT token
   */
  async verifyOTP(phone: string, otp: string): Promise<CandidateAuthResponse> {
    // Get stored OTP
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

  /**
   * Verify JWT token and return profile
   */
  verifyToken(token: string): CandidateJwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as CandidateJwtPayload;

      // Ensure it's a candidate token
      if (decoded.type !== 'candidate') {
        throw new AppError('Invalid token type', 401);
      }

      return decoded;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token has expired. Please login again.', 401);
      }
      throw new AppError('Invalid token', 401);
    }
  }

  /**
   * Get current candidate profile from token
   */
  async getCurrentCandidate(profileId: string): Promise<any> {
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

export default new CandidateAuthService();
