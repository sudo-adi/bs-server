import prisma from '@/config/prisma';
import logger from '@/config/logger';
import { hashPassword } from '@/services/auth/helpers/password.helper';

const DEFAULT_PASSWORD = 'Admin@123';

interface DefaultProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  candidateCode: string;
  workerCode: string;
  profileType: string;
  workerType: string;
  currentStage: string;
  isActive: boolean;
}

const defaultProfiles: DefaultProfile[] = [
  {
    firstName: 'Raj',
    lastName: 'Sinha',
    email: 'raj@buildsewa.in',
    phone: '9876543210',
    candidateCode: 'BSC-00001',
    workerCode: 'BSW-00001',
    profileType: 'worker',
    workerType: 'white',
    currentStage: 'worker',
    isActive: true,
  },
  {
    firstName: 'Neha',
    lastName: 'Sinha',
    email: 'neha@buildsewa.in',
    phone: '9876543211',
    candidateCode: 'BSC-00002',
    workerCode: 'BSW-00002',
    profileType: 'worker',
    workerType: 'white',
    currentStage: 'worker',
    isActive: true,
  },
  {
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@buildsewa.in',
    phone: '9876543212',
    candidateCode: 'BSC-00003',
    workerCode: 'BSW-00003',
    profileType: 'worker',
    workerType: 'white',
    currentStage: 'worker',
    isActive: true,
  },
];

export async function seedDefaultProfiles(): Promise<void> {
  try {
    logger.info('Checking for default profiles...');

    // Hash the default password once
    const passwordHash = await hashPassword(DEFAULT_PASSWORD);

    for (const profile of defaultProfiles) {
      // Check if profile already exists by candidateCode or phone
      const existingProfile = await prisma.profile.findFirst({
        where: {
          OR: [
            { candidateCode: profile.candidateCode },
            { phone: profile.phone },
          ],
        },
      });

      if (existingProfile) {
        // Update profile fields if needed
        const updates: any = {};

        if (!existingProfile.passwordHash) {
          updates.passwordHash = passwordHash;
        }
        if (existingProfile.profileType !== profile.profileType) {
          updates.profileType = profile.profileType;
        }
        if (existingProfile.workerType !== profile.workerType) {
          updates.workerType = profile.workerType;
        }
        if (existingProfile.currentStage !== profile.currentStage) {
          updates.currentStage = profile.currentStage;
        }
        if (existingProfile.email !== profile.email) {
          updates.email = profile.email;
        }

        if (Object.keys(updates).length > 0) {
          await prisma.profile.update({
            where: { id: existingProfile.id },
            data: updates,
          });
          logger.info(`Updated profile: ${profile.firstName} ${profile.lastName} (${profile.candidateCode}) - Fields: ${Object.keys(updates).join(', ')}`);
        } else {
          logger.info(`Profile already exists: ${profile.firstName} ${profile.lastName} (${profile.candidateCode})`);
        }
      } else {
        // Create the profile with password
        const newProfile = await prisma.profile.create({
          data: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone,
            candidateCode: profile.candidateCode,
            workerCode: profile.workerCode,
            profileType: profile.profileType,
            workerType: profile.workerType,
            currentStage: profile.currentStage,
            isActive: profile.isActive,
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
            candidateCodeAssignedAt: new Date(),
            workerCodeAssignedAt: new Date(),
          },
        });

        logger.info(`Created default profile: ${profile.firstName} ${profile.lastName} (${profile.candidateCode}) - ID: ${newProfile.id}`);
      }
    }

    logger.info('Default profiles seed completed');
  } catch (error) {
    logger.error('Error seeding default profiles:', error);
    // Don't throw - allow server to continue starting
  }
}

export default seedDefaultProfiles;
