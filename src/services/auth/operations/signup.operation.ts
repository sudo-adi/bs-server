import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { EMPLOYER_STATUSES, PROFILE_STAGES } from '@/constants/stages';
import { EmployerSignupRequest, WorkerSignupRequest } from '../auth.service';
import { generateEmployerToken, generateWorkerToken, hashPassword, verifyOTP } from '../helpers';

export async function signupWorker(
  data: WorkerSignupRequest
): Promise<{ user: any; token: string }> {
  // Check phone uniqueness
  const existing = await prisma.profile.findFirst({
    where: { phone: data.phone, deletedAt: null },
  });
  if (existing) throw new Error('Phone number already registered');

  // Verify OTP if provided
  if (data.otp) {
    verifyOTP(data.phone, data.otp, 'signup');
  }

  // Hash password if provided
  const passwordHash = data.password ? await hashPassword(data.password) : null;

  const profile = await prisma.profile.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName,
      fathersName: data.fathersName,
      phone: data.phone,
      email: data.email,
      altPhone: data.altPhone,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      emergencyContactName: data.emergencyContactName,
      emergencyContactNumber: data.emergencyContactNumber,
      passwordHash,
      isActive: true,
      profileType: 'candidate',
      workerType: data.workerType || 'blue',
      isVerified: false,
      currentStage: PROFILE_STAGES.NEW_REGISTRATION,
      metadata: {
        state: data.state,
        district: data.district,
        villageOrCity: data.villageOrCity,
        pincode: data.pincode,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const token = generateWorkerToken(profile);
  const { passwordHash: _, ...user } = profile;

  logger.info('Worker signup successful', { id: profile.id, workerType: profile.workerType });
  return { user, token };
}

export async function signupEmployer(
  data: EmployerSignupRequest
): Promise<{ user: any; token: string; projectRequest?: any }> {
  // Check email uniqueness
  const existingEmail = await prisma.employer.findFirst({
    where: { email: data.email, deletedAt: null },
  });
  if (existingEmail) throw new Error('Email already registered');

  // Check phone uniqueness
  const existingPhone = await prisma.employer.findFirst({
    where: { phone: data.phone, deletedAt: null },
  });
  if (existingPhone) throw new Error('Phone already registered');

  // Verify OTP if provided
  if (data.otp) {
    verifyOTP(data.phone!, data.otp, 'signup');
  }

  // Hash password if provided
  const passwordHash = data.password ? await hashPassword(data.password) : null;

  const result = await prisma.$transaction(async (tx) => {
    const employer = await tx.employer.create({
      data: {
        companyName: data.companyName,
        clientName: data.clientName,
        email: data.email,
        phone: data.phone,
        altPhone: data.altPhone,
        passwordHash,
        registeredAddress: data.registeredAddress,
        companyRegistrationNumber: data.companyRegistrationNumber,
        gstNumber: data.gstNumber,
        city: data.city,
        district: data.district,
        state: data.state,
        postalCode: data.postalCode,
        landmark: data.landmark,
        isActive: true,
        isVerified: false,
        status: EMPLOYER_STATUSES.NEW,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create authorized person
    if (data.authorizedPersonName) {
      await tx.employerAuthorizedPerson.create({
        data: {
          employerId: employer.id,
          name: data.authorizedPersonName,
          designation: data.authorizedPersonDesignation,
          email: data.authorizedPersonEmail,
          phone: data.authorizedPersonContact,
          address: data.authorizedPersonAddress,
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Create project request if provided
    let projectRequest = null;
    if (data.projectName) {
      const location = [data.siteAddress, data.city, data.district, data.state]
        .filter(Boolean)
        .join(', ');

      projectRequest = await tx.projectRequest.create({
        data: {
          employerId: employer.id,
          projectTitle: data.projectName,
          projectDescription: data.projectDescription,
          location,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Add worker requirements
      if (data.workerRequirements?.length) {
        for (const req of data.workerRequirements) {
          let skillCategory = await tx.skillCategory.findFirst({
            where: { name: { equals: req.category, mode: 'insensitive' } },
          });

          if (!skillCategory) {
            skillCategory = await tx.skillCategory.create({
              data: {
                name: req.category,
                categoryType: 'blue_collar',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }

          await tx.projectRequestRequirement.create({
            data: {
              projectRequestId: projectRequest.id,
              skillCategoryId: skillCategory.id,
              requiredCount: req.count,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    return { employer, projectRequest };
  });

  const token = generateEmployerToken(result.employer);
  const { passwordHash: _, ...user } = result.employer;

  logger.info('Employer signup successful', { id: result.employer.id });
  return { user, token, projectRequest: result.projectRequest };
}
