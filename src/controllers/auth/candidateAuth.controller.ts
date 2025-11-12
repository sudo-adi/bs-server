import profileService from '@/services/profiles/profile.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: number; profileId?: string }>();

// Mock OTP for development
const MOCK_OTP = '123456';

// Send OTP for login/registration
export const sendOTP = catchAsync(async (req: Request, res: Response) => {
  const { mobile_number } = req.body;

  if (!mobile_number) {
    res.status(400).json({
      success: false,
      message: 'Mobile number is required',
    });
    return;
  }

  // Check if profile exists
  const profile = await profileService.getProfileByMobile(mobile_number);

  // Generate OTP (mocked as 123456 for now)
  const otp = MOCK_OTP;
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store OTP
  otpStore.set(mobile_number, {
    otp,
    expiresAt,
    profileId: profile?.id,
  });

  // In production, send SMS here
  console.log(`OTP for ${mobile_number}: ${otp}`);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      mobile_number,
      exists: !!profile,
      // Send OTP in development mode only
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    },
  });
});

// Verify OTP and login/register
export const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const { mobile_number, otp, first_name, last_name } = req.body;

  if (!mobile_number || !otp) {
    res.status(400).json({
      success: false,
      message: 'Mobile number and OTP are required',
    });
    return;
  }

  // Get stored OTP
  const storedOtpData = otpStore.get(mobile_number);

  if (!storedOtpData) {
    res.status(400).json({
      success: false,
      message: 'OTP not found or expired. Please request a new OTP',
    });
    return;
  }

  if (Date.now() > storedOtpData.expiresAt) {
    otpStore.delete(mobile_number);
    res.status(400).json({
      success: false,
      message: 'OTP expired. Please request a new OTP',
    });
    return;
  }

  if (storedOtpData.otp !== otp) {
    res.status(400).json({
      success: false,
      message: 'Invalid OTP',
    });
    return;
  }

  // OTP is valid, delete it
  otpStore.delete(mobile_number);

  let profile;
  let isNewUser = false;

  if (storedOtpData.profileId) {
    // Existing user - login
    profile = await profileService.getProfileById(storedOtpData.profileId);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
      return;
    }

    // Get current stage from stage_transitions
    const currentStage = await profileService.getCurrentStage(profile.id);

    // Check if candidate is approved
    if (currentStage && currentStage.toLowerCase() !== 'approved') {
      res.status(403).json({
        success: false,
        message: 'Your profile is not approved yet. Please wait for admin approval.',
        data: {
          current_stage: currentStage,
        },
      });
      return;
    }

    if (!profile.is_active) {
      res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact support.',
      });
      return;
    }
  } else {
    // New user - register
    if (!first_name) {
      res.status(400).json({
        success: false,
        message: 'First name is required for registration',
      });
      return;
    }

    profile = await profileService.createProfile({
      phone: mobile_number,
      first_name,
      last_name,
    });
    isNewUser = true;
  }

  // Generate token
  const { token } = await profileService.generateAuthToken(profile.id);

  // Get current stage
  const currentStage = await profileService.getCurrentStage(profile.id);

  res.status(200).json({
    success: true,
    message: isNewUser ? 'Registration successful' : 'Login successful',
    data: {
      profile: {
        id: profile.id,
        profile_code: profile.candidate_code,
        mobile_number: profile.phone,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        current_stage: currentStage,
        is_active: profile.is_active,
      },
      token,
      isNewUser,
    },
  });
});

// Get current candidate profile
export const getCurrentCandidate = catchAsync(async (req: Request, res: Response) => {
  // Assuming auth middleware attaches profileId to req
  const profileId = (req as any).profileId;

  const profile = await profileService.getProfileById(profileId, true);

  res.status(200).json({
    success: true,
    data: profile,
  });
});
