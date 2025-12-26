// @ts-nocheck
import { workerDetailsService } from '@/services/workerDetails/workerDetails.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

// Store OTPs in memory (in production, use Redis or database)
const otpStore = new Map<
  string,
  { otp: string; expiresAt: number; profileId?: string; employerId?: string; userId?: string }
>();

// Mock OTP for development/demonstration
const MOCK_OTP = '123456';

// Worker: Send OTP for login
export const sendWorkerOTP = catchAsync(async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({
      success: false,
      message: 'Phone number is required',
    });
    return;
  }

  // Check if worker profile exists
  const profile = await workerDetailsService.getProfileByPhone(phone);

  if (!profile) {
    res.status(404).json({
      success: false,
      message: 'Worker not found with this phone number',
    });
    return;
  }

  // For demonstration, accept any OTP
  const otp = MOCK_OTP;
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(phone, {
    otp,
    expiresAt,
    profileId: profile.id,
  });

  console.log(`OTP for ${phone}: ${otp}`);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      phone,
      // Send OTP in development mode only
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    },
  });
});

// Worker: Verify OTP and login
export const verifyWorkerOTP = catchAsync(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    res.status(400).json({
      success: false,
      message: 'Phone number and OTP are required',
    });
    return;
  }

  // For demonstration, accept any OTP
  const storedOtpData = otpStore.get(phone);

  if (!storedOtpData) {
    // Accept any OTP for demonstration
    const profile = await workerDetailsService.getProfileByPhone(phone);
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Worker not found',
      });
      return;
    }

    const { token, worker } = await workerDetailsService.generateWorkerToken(profile.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        worker,
        token,
      },
    });
    return;
  }

  if (Date.now() > storedOtpData.expiresAt) {
    otpStore.delete(phone);
    res.status(400).json({
      success: false,
      message: 'OTP expired. Please request a new OTP',
    });
    return;
  }

  // For demonstration, accept any OTP
  otpStore.delete(phone);

  const { token, worker } = await workerDetailsService.generateWorkerToken(
    storedOtpData.profileId!
  );

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      worker,
      token,
    },
  });
});

// Employer: Login with email/ID + password OR mobile + OTP
export const employerLogin = catchAsync(async (req: Request, res: Response) => {
  const { loginType, identifier, password, otp } = req.body;

  if (!loginType || !identifier) {
    res.status(400).json({
      success: false,
      message: 'Login type and identifier are required',
    });
    return;
  }

  if (loginType === 'password') {
    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required',
      });
      return;
    }

    const { token, employer } = await workerDetailsService.loginEmployerWithPassword(
      identifier,
      password
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        employer,
        token,
      },
    });
  } else if (loginType === 'otp') {
    if (!otp) {
      res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
      return;
    }

    // For demonstration, accept any OTP
    const { token, employer } = await workerDetailsService.loginEmployerWithOTP(identifier);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        employer,
        token,
      },
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Invalid login type',
    });
  }
});

// Employer: Send OTP for mobile login
export const sendEmployerOTP = catchAsync(async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({
      success: false,
      message: 'Phone number is required',
    });
    return;
  }

  const employer = await workerDetailsService.getEmployerByPhone(phone);

  if (!employer) {
    res.status(404).json({
      success: false,
      message: 'Employer not found with this phone number',
    });
    return;
  }

  // For demonstration, accept any OTP
  const otp = MOCK_OTP;
  const expiresAt = Date.now() + 10 * 60 * 1000;

  otpStore.set(phone, {
    otp,
    expiresAt,
    employerId: employer.id,
  });

  console.log(`Employer OTP for ${phone}: ${otp}`);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      phone,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    },
  });
});

// BuildSewa Team: Login with email + password
export const teamLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
    return;
  }

  const { token, user } = await workerDetailsService.loginTeamMember(email, password);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token,
    },
  });
});
