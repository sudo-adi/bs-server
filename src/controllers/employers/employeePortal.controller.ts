import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Employee/Worker Portal APIs
 * Allows approved workers to login and view their profile, training, and project details
 */

/**
 * Worker Login
 * Login with mobile number and OTP (mocked as "123456" for development)
 */
export const workerLogin = catchAsync(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new AppError('Phone number and OTP are required', 400);
  }

  // Find profile with phone number
  const profile = await prisma.profiles.findFirst({
    where: { phone },
    include: {
      stage_transitions: {
        orderBy: { transitioned_at: 'desc' },
        take: 1,
      },
    },
  });

  if (!profile) {
    throw new AppError('Invalid phone number', 401);
  }

  // Get current stage
  const currentStage = profile.stage_transitions[0]?.to_stage || 'new registration';

  // Check if profile is approved (allow all except "new registration" and "screening")
  const blockedStages = ['new registration', 'screening'];
  const canLogin = !blockedStages.includes(currentStage.toLowerCase());

  if (!canLogin) {
    throw new AppError('Your profile is not yet approved. Please wait for admin approval.', 403);
  }

  // Mock OTP verification (for development, accept "123456")
  // TODO: Implement real OTP service (Twilio, AWS SNS, etc.)
  if (otp !== '123456') {
    throw new AppError('Invalid OTP. Please use 123456 for testing.', 401);
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      profileId: profile.id,
      phone: profile.phone,
      type: 'worker',
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      profile: {
        id: profile.id,
        candidate_code: profile.candidate_code,
        name: `${profile.first_name} ${profile.last_name}`,
        phone: profile.phone,
        current_stage: currentStage,
      },
    },
  });
});

/**
 * Get Worker Profile
 * Returns complete profile information for logged-in worker
 */
export const getWorkerProfile = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.user?.profileId;

  if (!profileId) {
    throw new AppError('Authentication required', 401);
  }

  const profile = await prisma.profiles.findUnique({
    where: { id: profileId },
    include: {
      addresses: true,
      bank_accounts: true,
      qualifications: {
        include: {
          qualification_types: true,
        },
      },
      profile_skills: {
        include: {
          skill_categories: true,
        },
      },
      stage_transitions: {
        orderBy: { transitioned_at: 'desc' },
        take: 5,
      },
    },
  });

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  // Get current stage
  const currentStage = profile.stage_transitions[0]?.to_stage || 'new registration';

  res.status(200).json({
    success: true,
    data: {
      profile: {
        id: profile.id,
        candidate_code: profile.candidate_code,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        email: profile.email,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        current_stage: currentStage,
        created_at: profile.created_at,
      },
      addresses: profile.addresses,
      bank_accounts: profile.bank_accounts,
      qualifications: profile.qualifications,
      skills: profile.profile_skills,
      stage_history: profile.stage_transitions,
    },
  });
});

/**
 * Get Worker Training Status
 * Returns training batches and completion status
 */
export const getWorkerTraining = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.user?.profileId;

  if (!profileId) {
    throw new AppError('Authentication required', 401);
  }

  const enrollments = await prisma.batch_enrollments.findMany({
    where: { profile_id: profileId },
    include: {
      training_batches: {
        select: {
          id: true,
          name: true,
          code: true,
          program_name: true,
          start_date: true,
          end_date: true,
          location: true,
          status: true,
          trainers: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: { enrollment_date: 'desc' },
  });

  res.status(200).json({
    success: true,
    data: {
      total_enrollments: enrollments.length,
      completed_trainings: enrollments.filter((e) => e.status === 'completed').length,
      ongoing_trainings: enrollments.filter((e) => e.status === 'active').length,
      enrollments: enrollments.map((enrollment) => ({
        id: enrollment.id,
        status: enrollment.status,
        enrollment_date: enrollment.enrollment_date,
        completion_date: enrollment.completion_date,
        attendance_percentage: enrollment.attendance_percentage,
        score: enrollment.score,
        batch: enrollment.training_batches,
      })),
    },
  });
});

/**
 * Get Worker Project Assignments
 * Returns current and past project deployments
 */
// COMMENTED OUT - Will implement project assignments later with different approach
// export const getWorkerProjects = catchAsync(async (req: Request, res: Response) => {
//   const profileId = req.user?.profileId;

//   if (!profileId) {
//     throw new AppError('Authentication required', 401);
//   }

//   const assignments = await prisma.project_worker_assignments.findMany({
//     where: { profile_id: profileId },
//     include: {
//       projects: {
//         select: {
//           id: true,
//           name: true,
//           code: true,
//           location: true,
//           start_date: true,
//           end_date: true,
//           status: true,
//           employers: {
//             select: {
//               company_name: true,
//               client_name: true,
//             },
//           },
//         },
//       },
//     },
//     orderBy: { deployment_date: 'desc' },
//   });

//   // Calculate project statistics
//   const activeProjects = assignments.filter((a) => a.status === 'active').length;
//   const completedProjects = assignments.filter((a) => a.status === 'completed').length;

//   res.status(200).json({
//     success: true,
//     data: {
//       total_projects: assignments.length,
//       active_projects: activeProjects,
//       completed_projects: completedProjects,
//       assignments: assignments.map((assignment) => ({
//         id: assignment.id,
//         status: assignment.status,
//         deployment_date: assignment.deployment_date,
//         expected_end_date: assignment.expected_end_date,
//         actual_end_date: assignment.actual_end_date,
//         project: assignment.projects,
//       })),
//     },
//   });
// });

export const getWorkerProjects = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.user?.profileId;

  if (!profileId) {
    throw new AppError('Authentication required', 401);
  }

  // Temporary implementation - returns empty data until project assignments feature is implemented
  res.status(200).json({
    success: true,
    data: {
      total_projects: 0,
      active_projects: 0,
      completed_projects: 0,
      assignments: [],
    },
  });
});

/**
 * Get Worker Dashboard Summary
 * Returns aggregated dashboard data
 */
export const getWorkerDashboard = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.user?.profileId;

  if (!profileId) {
    throw new AppError('Authentication required', 401);
  }

  // Get profile with stage
  const profile = await prisma.profiles.findUnique({
    where: { id: profileId },
    include: {
      stage_transitions: {
        orderBy: { transitioned_at: 'desc' },
        take: 1,
      },
    },
  });

  if (!profile) {
    throw new AppError('Profile not found', 404);
  }

  // Get training stats
  const trainings = await prisma.batch_enrollments.count({
    where: { profile_id: profileId },
  });

  const completedTrainings = await prisma.batch_enrollments.count({
    where: {
      profile_id: profileId,
      status: 'completed',
    },
  });

  // Get project stats - COMMENTED OUT until project assignments feature is implemented
  // const projects = await prisma.project_worker_assignments.count({
  //   where: { profile_id: profileId },
  // });

  // const activeProjects = await prisma.project_worker_assignments.count({
  //   where: {
  //     profile_id: profileId,
  //     status: 'active',
  //   },
  // });

  // Temporary - return 0 until feature is implemented
  const projects = 0;
  const activeProjects = 0;

  // Get current stage
  const currentStage = profile.stage_transitions[0]?.to_stage || 'new registration';

  res.status(200).json({
    success: true,
    data: {
      profile: {
        id: profile.id,
        candidate_code: profile.candidate_code,
        name: `${profile.first_name} ${profile.last_name}`,
        phone: profile.phone,
        current_stage: currentStage,
      },
      stats: {
        total_trainings: trainings,
        completed_trainings: completedTrainings,
        total_projects: projects,
        active_projects: activeProjects,
      },
    },
  });
});
