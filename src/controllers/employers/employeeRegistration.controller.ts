import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

/**
 * Employee self-registration
 * Creates a new profile with basic info
 * Profile is created with 'new registration' stage
 * Requires verification and approval before they can login
 */
export const registerEmployee = catchAsync(async (req: Request, res: Response) => {
  // Accept both 'phone' and 'mobile_number' field names for compatibility
  const {
    phone: phoneField,
    mobile_number,
    full_name,
    fathers_name,
    village,
    district,
    state,
    postal_code,
  } = req.body;

  const phone = phoneField || mobile_number;

  // Validate required fields
  if (!phone || !full_name) {
    throw new AppError('Mobile number and full name are required', 400);
  }

  // Check if profile with this mobile number already exists
  const existingProfile = await prisma.profiles.findFirst({
    where: { phone },
  });

  if (existingProfile) {
    throw new AppError(
      'A profile with this mobile number already exists. Please contact admin if you need help.',
      409
    );
  }

  // Split full name into first and last name
  const nameParts = full_name.trim().split(' ');
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(' ') || nameParts[0];

  // Generate candidate code (format: BSC-00001)
  const lastProfile = await prisma.profiles.findFirst({
    where: { candidate_code: { startsWith: 'BSC-' } },
    orderBy: { candidate_code: 'desc' },
    select: { candidate_code: true },
  });

  let nextCode = 1;
  if (lastProfile?.candidate_code) {
    const match = lastProfile.candidate_code.match(/BSC-(\d+)/);
    if (match) nextCode = parseInt(match[1]) + 1;
  }

  const candidate_code = `BSC-${String(nextCode).padStart(5, '0')}`;

  // Create profile
  const profile = await prisma.profiles.create({
    data: {
      first_name,
      last_name,
      fathers_name: fathers_name || null,
      phone,
      candidate_code,
    },
  });

  // Create initial stage transition to 'new registration'
  await prisma.stage_transitions.create({
    data: {
      profile_id: profile.id,
      from_stage: null,
      to_stage: 'new registration',
      notes: 'Self-registration via employee portal',
    },
  });

  // Create permanent address if provided
  if (village || district || state || postal_code) {
    await prisma.addresses.create({
      data: {
        profile_id: profile.id,
        address_type: 'permanent',
        village_or_city: village || null,
        district: district || null,
        state: state || null,
        postal_code: postal_code || null,
      },
    });
  }

  res.status(201).json({
    success: true,
    message:
      'Registration successful! Your profile will be reviewed by our team. You will be able to login once your profile is verified and approved.',
    data: {
      profile_id: profile.id,
      candidate_code: profile.candidate_code,
      phone: profile.phone,
      name: `${profile.first_name} ${profile.last_name}`,
      current_stage: 'new registration',
    },
  });
});

/**
 * Check registration status by mobile number
 */
export const checkRegistrationStatus = catchAsync(async (req: Request, res: Response) => {
  const { phone } = req.params;

  const profile = await prisma.profiles.findFirst({
    where: { phone },
    select: {
      id: true,
      candidate_code: true,
      first_name: true,
      last_name: true,
      phone: true,
      created_at: true,
      stage_transitions: {
        orderBy: { transitioned_at: 'desc' },
        take: 1,
        select: {
          to_stage: true,
          transitioned_at: true,
        },
      },
    },
  });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'No registration found with this mobile number',
    });
  }

  // Get current stage from latest transition
  const currentStage = profile.stage_transitions[0]?.to_stage || 'new registration';

  // Check if profile is approved and can login
  const canLogin = ['approved', 'trained', 'verified', 'benched', 'deployed'].includes(
    currentStage
  );

  res.status(200).json({
    success: true,
    data: {
      profile_id: profile.id,
      candidate_code: profile.candidate_code,
      name: `${profile.first_name} ${profile.last_name}`,
      phone: profile.phone,
      current_stage: currentStage,
      registered_at: profile.created_at,
      can_login: canLogin,
      message: canLogin
        ? 'Your profile is approved. You can login now.'
        : 'Your profile is under review. You will be able to login once approved.',
    },
  });
});
