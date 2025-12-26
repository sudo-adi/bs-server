import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { WorkerProfileUpdateDto } from '@/dtos/worker/worker.dto';

export class WorkerProfileUpdateOperation {
  /**
   * Update worker's own profile (limited fields only)
   */
  static async execute(profileId: string, data: WorkerProfileUpdateDto): Promise<void> {
    try {
      // Verify profile exists and is a blue-collar worker
      const profile = await prisma.profile.findUnique({
        where: { id: profileId, deletedAt: null, workerType: 'blue' },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      const { addresses, bankAccounts, languages, ...profileData } = data;

      await prisma.$transaction(async (tx) => {
        // Update allowed profile fields (altPhone, email only)
        if (Object.keys(profileData).length > 0) {
          await tx.profile.update({
            where: { id: profileId },
            data: {
              altPhone: profileData.altPhone,
              email: profileData.email,
              updatedAt: new Date(),
            },
          });
        }

        // Handle addresses
        if (addresses && addresses.length > 0) {
          for (const addr of addresses) {
            if (addr._delete && addr.id) {
              // Delete address
              await tx.profileAddress.delete({
                where: { id: addr.id },
              });
            } else if (addr.id) {
              // Update existing address
              const { id, _delete, ...addrData } = addr;
              await tx.profileAddress.update({
                where: { id },
                data: addrData,
              });
            } else {
              // Create new address
              const { id, _delete, ...addrData } = addr;
              await tx.profileAddress.create({
                data: {
                  ...addrData,
                  profileId,
                },
              });
            }
          }
        }

        // Handle bank accounts
        if (bankAccounts && bankAccounts.length > 0) {
          for (const acc of bankAccounts) {
            if (acc._delete && acc.id) {
              // Delete bank account
              await tx.profileBankAccount.delete({
                where: { id: acc.id },
              });
            } else if (acc.id) {
              // Update existing bank account
              const { id, _delete, ...accData } = acc;
              await tx.profileBankAccount.update({
                where: { id },
                data: accData,
              });
            } else {
              // Create new bank account
              const { id, _delete, ...accData } = acc;
              await tx.profileBankAccount.create({
                data: {
                  ...accData,
                  profileId,
                },
              });
            }
          }
        }

        // Handle languages
        if (languages && languages.length > 0) {
          for (const lang of languages) {
            if (lang._delete && lang.id) {
              // Delete language
              await tx.profileLanguage.delete({
                where: { id: lang.id },
              });
            } else if (lang.id) {
              // Update existing language
              const { id, _delete, ...langData } = lang;
              await tx.profileLanguage.update({
                where: { id },
                data: langData,
              });
            } else {
              // Create new language
              const { id, _delete, languageId, ...langData } = lang;
              if (languageId) {
                await tx.profileLanguage.create({
                  data: {
                    ...langData,
                    profileId,
                    languageId,
                  },
                });
              }
            }
          }
        }
      });

      logger.info('Worker profile updated', { profileId });
    } catch (error: any) {
      logger.error('Error updating worker profile', { error, profileId });
      throw new Error(error.message || 'Failed to update worker profile');
    }
  }
}
