import { candidateAuthService } from '@/services/candidate';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

/**
 * Send OTP to candidate's mobile number
 * POST /api/candidate/auth/send-otp
 * Body: { phone: string }
 */
export const sendOTP = catchAsync(async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({
      success: false,
      message: 'Phone number is required',
    });
    return;
  }

  const result = await candidateAuthService.sendOTP(phone);

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * Verify OTP and login candidate
 * POST /api/candidate/auth/verify-otp
 * Body: { phone: string, otp: string }
 */
export const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required',
    });
    return;
  }

  const result = await candidateAuthService.verifyOTP(phone, otp);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const profileId = (req as any).profileId;

  const profile = await candidateAuthService.getCurrentCandidate(profileId);

  res.status(200).json({
    success: true,
    data: profile,
  });
});
