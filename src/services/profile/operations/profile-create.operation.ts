import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { CreateProfileDto, ProfileDto } from '@/dtos/profile/profile.dto';
import { generateUuid } from '@/utils/uuidHelper';
import bcrypt from 'bcrypt';
import { NestedUpdateHelper } from '../helpers/nested-update.helper';
import { ProfileDetailQuery } from '../queries/profile-detail.query';

export class ProfileCreateOperation {
  static async execute(data: CreateProfileDto, createdByProfileId?: string): Promise<ProfileDto> {
    try {
      // Check if phone already exists
      if (data.phone) {
        const existingProfile = await prisma.profile.findFirst({
          where: { phone: data.phone },
        });

        if (existingProfile) {
          throw new Error('Profile with this phone number already exists');
        }
      }

      // Extract nested data from the request
      const {
        identity,
        addresses,
        bankAccounts,
        documents,
        qualifications,
        skills,
        languages,
        interactions,
        password,
        ...profileData
      } = data as any;

      // Convert dateOfBirth to proper DateTime if provided
      if (profileData.dateOfBirth && typeof profileData.dateOfBirth === 'string') {
        profileData.dateOfBirth = new Date(profileData.dateOfBirth);
      }

      // Hash password if provided
      let passwordHash: string | null = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      // Determine profileType (default to candidate)
      const profileType = profileData.profileType || 'candidate';

      // Worker code is generated immediately for worker profiles
      let workerCode: string | null = null;

      if (profileType === 'worker') {
        const lastWorker = await prisma.profile.findFirst({
          where: { workerCode: { startsWith: 'BSW-' } },
          orderBy: { workerCode: 'desc' },
          select: { workerCode: true },
        });
        const lastNumber = lastWorker?.workerCode
          ? parseInt(lastWorker.workerCode.replace('BSW-', '')) || 0
          : 0;
        workerCode = `BSW-${String(lastNumber + 1).padStart(5, '0')}`;
      }

      // Use a transaction to create profile and all related data atomically
      const profileId = await prisma.$transaction(async (tx) => {
        const profile = await tx.profile.create({
          data: {
            id: generateUuid(),
            ...profileData,
            passwordHash,
            isActive: true,
            workerType: profileData.workerType || 'blue',
            profileType,
            isVerified: false,
            currentStage: profileData.currentStage || 'NEW_REGISTRATION',
            workerCode,
            workerCodeAssignedAt: workerCode ? new Date() : null,
            metadata: profileData.metadata as any,
          },
        });

        // Create nested identity
        if (identity) {
          const identityData = NestedUpdateHelper.processIdentityData(identity);
          await tx.profileIdentity.create({
            data: {
              ...identityData,
              profileId: profile.id,
              updatedAt: new Date(),
            },
          });
        }

        // Create nested addresses
        if (addresses && addresses.length > 0) {
          await tx.profileAddress.createMany({
            data: addresses.map((addr: any) => ({
              id: generateUuid(),
              addressType: addr.addressType,
              houseNumber: addr.houseNumber,
              villageOrCity: addr.villageOrCity,
              district: addr.district,
              state: addr.state,
              postalCode: addr.postalCode,
              landmark: addr.landmark,
              policeStation: addr.policeStation,
              postOffice: addr.postOffice,
              documentId: addr.documentId,
              profileId: profile.id,
            })),
          });
        }

        // Create nested bank accounts
        if (bankAccounts && bankAccounts.length > 0) {
          for (const bankAccount of bankAccounts) {
            if (bankAccount.isPrimary) {
              await tx.profileBankAccount.updateMany({
                where: { profileId: profile.id, isPrimary: true },
                data: { isPrimary: false },
              });
            }
            await tx.profileBankAccount.create({
              data: {
                id: generateUuid(),
                ...bankAccount,
                profileId: profile.id,
              },
            });
          }
        }

        // Create nested documents
        if (documents && documents.length > 0) {
          await tx.profileDocument.createMany({
            data: documents.map((doc: any) => ({
              id: generateUuid(),
              ...doc,
              profileId: profile.id,
              uploadedByProfileId: createdByProfileId,
            })),
          });
        }

        // Create nested qualifications
        if (qualifications && qualifications.length > 0) {
          await tx.profileQualification.createMany({
            data: qualifications.map((qual: any) => ({
              id: generateUuid(),
              ...qual,
              profileId: profile.id,
            })),
          });
        }

        // Create nested skills
        if (skills && skills.length > 0) {
          for (const skill of skills) {
            if (skill.isPrimary) {
              await tx.profileSkill.updateMany({
                where: { profileId: profile.id, isPrimary: true },
                data: { isPrimary: false },
              });
            }
            await tx.profileSkill.create({
              data: {
                id: generateUuid(),
                ...skill,
                profileId: profile.id,
              },
            });
          }
        }

        // Create nested languages
        if (languages && languages.length > 0) {
          for (const language of languages) {
            const exists = await tx.profileLanguage.findFirst({
              where: { profileId: profile.id, languageId: language.languageId },
            });
            if (!exists) {
              await tx.profileLanguage.create({
                data: {
                  id: generateUuid(),
                  profileId: profile.id,
                  languageId: language.languageId,
                },
              });
            }
          }
        }

        // Create nested interactions
        if (interactions && interactions.length > 0) {
          for (const interaction of interactions) {
            await tx.profileInteraction.create({
              data: {
                ...interaction,
                profileId: profile.id,
                createdByProfileId,
                interactionDate: interaction.interactionDate || new Date(),
              },
            });
          }
        }

        return profile.id;
      });

      logger.info('Profile created', {
        id: profileId,
        phone: data.phone,
        profileType,
        workerCode,
        hasIdentity: !!identity,
      });

      const createdProfile = await ProfileDetailQuery.execute(profileId);
      return createdProfile as ProfileDto;
    } catch (error: any) {
      logger.error('Error creating profile', { error });
      throw new Error(error.message || 'Failed to create profile');
    }
  }
}
