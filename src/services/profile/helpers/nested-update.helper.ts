import { NestedUpdate } from '@/dtos/profile/profile.dto';
import { UpdateProfileAddressDto } from '@/dtos/profile/profileAddress.dto';
import { UpdateProfileBankAccountDto } from '@/dtos/profile/profileBankAccount.dto';
import { UpdateProfileDocumentDto } from '@/dtos/profile/profileDocument.dto';
import { UpdateProfileLanguageDto } from '@/dtos/profile/profileLanguage.dto';
import { UpdateProfileQualificationDto } from '@/dtos/profile/profileQualification.dto';
import { UpdateProfileSkillDto } from '@/dtos/profile/profileSkill.dto';
import { Prisma } from '@/generated/prisma';
import crypto from 'crypto';

// Hash sensitive data (Aadhar, PAN, etc.) - NOT for passwords
export function hashSensitiveData(value: string): string {
  return crypto.createHash('sha256').update(value.trim()).digest('hex');
}

// Mask Aadhar: show last 4 digits only (XXXX-XXXX-1234)
export function maskAadhar(aadhaar: string): string {
  const cleaned = aadhaar.replace(/\D/g, '');
  if (cleaned.length !== 12) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${cleaned.slice(-4)}`;
}

// Mask PAN: show first 2 and last 2 (AB****12C)
export function maskPan(pan: string): string {
  const cleaned = pan.trim().toUpperCase();
  if (cleaned.length !== 10) return '**********';
  return `${cleaned.slice(0, 2)}****${cleaned.slice(-3)}`;
}

// Get last 4 digits of Aadhar
export function getAadharLast4(aadhaar: string): string {
  return aadhaar.replace(/\D/g, '').slice(-4);
}

export class NestedUpdateHelper {
  /**
   * Process identity data - extract only valid fields for ProfileIdentity
   */
  static processIdentityData(identity: any): any {
    const validFields = {
      esicNumber: identity.esicNumber,
      uanNumber: identity.uanNumber,
      pfAccountNumber: identity.pfAccountNumber,
      healthInsurancePolicy: identity.healthInsurancePolicy,
      healthInsuranceProvider: identity.healthInsuranceProvider,
      healthInsuranceExpiry: identity.healthInsuranceExpiry
        ? new Date(identity.healthInsuranceExpiry)
        : undefined,
    };

    // Remove undefined values
    Object.keys(validFields).forEach((key) => {
      if ((validFields as any)[key] === undefined) {
        delete (validFields as any)[key];
      }
    });

    return validFields;
  }

  static async handleAddresses(
    tx: Prisma.TransactionClient,
    profileId: string,
    addresses: NestedUpdate<UpdateProfileAddressDto>[]
  ): Promise<void> {
    for (const address of addresses) {
      const { id: addressId, _delete, isCurrent, ...addressData } = address as any;

      const validAddressData = {
        addressType: addressData.addressType,
        houseNumber: addressData.houseNumber,
        villageOrCity: addressData.villageOrCity,
        district: addressData.district,
        state: addressData.state,
        postalCode: addressData.postalCode,
        landmark: addressData.landmark,
        policeStation: addressData.policeStation,
        postOffice: addressData.postOffice,
        documentId: addressData.documentId,
      };

      Object.keys(validAddressData).forEach((key) => {
        if ((validAddressData as any)[key] === undefined) {
          delete (validAddressData as any)[key];
        }
      });

      if (_delete && addressId) {
        await tx.profileAddress.delete({ where: { id: addressId } });
      } else if (addressId) {
        await tx.profileAddress.update({
          where: { id: addressId },
          data: validAddressData,
        });
      } else {
        await tx.profileAddress.create({
          data: {
            ...validAddressData,
            profileId,
          },
        });
      }
    }
  }

  static async handleBankAccounts(
    tx: Prisma.TransactionClient,
    profileId: string,
    bankAccounts: NestedUpdate<UpdateProfileBankAccountDto>[]
  ): Promise<void> {
    for (const bankAccount of bankAccounts) {
      const { id: bankAccountId, _delete, ...bankAccountData } = bankAccount;

      if (bankAccountData.isPrimary) {
        await tx.profileBankAccount.updateMany({
          where: { profileId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      if (_delete && bankAccountId) {
        await tx.profileBankAccount.delete({ where: { id: bankAccountId } });
      } else if (bankAccountId) {
        await tx.profileBankAccount.update({
          where: { id: bankAccountId },
          data: bankAccountData,
        });
      } else {
        await tx.profileBankAccount.create({
          data: {
            ...bankAccountData,
            profileId,
          },
        });
      }
    }
  }

  static async handleDocuments(
    tx: Prisma.TransactionClient,
    profileId: string,
    documents: NestedUpdate<UpdateProfileDocumentDto>[],
    uploadedByProfileId?: string
  ): Promise<void> {
    for (const document of documents) {
      const { id: documentId, _delete, ...documentData } = document;

      if (_delete && documentId) {
        await tx.profileDocument.delete({
          where: { id: documentId },
        });
      } else if (documentId) {
        await tx.profileDocument.update({
          where: { id: documentId },
          data: documentData,
        });
      } else {
        await tx.profileDocument.create({
          data: {
            ...documentData,
            profileId,
            uploadedByProfileId,
          },
        });
      }
    }
  }

  static async handleQualifications(
    tx: Prisma.TransactionClient,
    profileId: string,
    qualifications: NestedUpdate<UpdateProfileQualificationDto>[]
  ): Promise<void> {
    for (const qualification of qualifications) {
      const { id: qualificationId, _delete, ...qualificationData } = qualification;

      if (_delete && qualificationId) {
        await tx.profileQualification.delete({ where: { id: qualificationId } });
      } else if (qualificationId) {
        await tx.profileQualification.update({
          where: { id: qualificationId },
          data: qualificationData,
        });
      } else {
        await tx.profileQualification.create({
          data: {
            ...qualificationData,
            profileId,
          },
        });
      }
    }
  }

  static async handleSkills(
    tx: Prisma.TransactionClient,
    profileId: string,
    skills: NestedUpdate<UpdateProfileSkillDto>[]
  ): Promise<void> {
    for (const skill of skills) {
      const { id: skillId, _delete, ...skillData } = skill;

      if (skillData.isPrimary) {
        await tx.profileSkill.updateMany({
          where: { profileId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      if (_delete && skillId) {
        await tx.profileSkill.delete({ where: { id: skillId } });
      } else if (skillId) {
        await tx.profileSkill.update({
          where: { id: skillId },
          data: skillData,
        });
      } else {
        await tx.profileSkill.create({
          data: {
            ...skillData,
            profileId,
          },
        });
      }
    }
  }

  static async handleLanguages(
    tx: Prisma.TransactionClient,
    profileId: string,
    languages: NestedUpdate<UpdateProfileLanguageDto>[]
  ): Promise<void> {
    for (const language of languages) {
      const { id: languageRecordId, _delete, ...languageData } = language;

      if (_delete && languageRecordId) {
        await tx.profileLanguage.delete({ where: { id: languageRecordId } });
      } else if (languageRecordId) {
        await tx.profileLanguage.update({
          where: { id: languageRecordId },
          data: languageData,
        });
      } else if (languageData.languageId) {
        const existingLanguage = await tx.profileLanguage.findFirst({
          where: { profileId, languageId: languageData.languageId },
        });

        if (!existingLanguage) {
          await tx.profileLanguage.create({
            data: {
              ...languageData,
              profileId,
            },
          });
        }
      }
    }
  }

  static async handleInteractions(
    tx: Prisma.TransactionClient,
    profileId: string,
    interactions: any[],
    createdByProfileId?: string
  ): Promise<void> {
    for (const interaction of interactions) {
      const { id: interactionId, _delete, ...interactionData } = interaction;

      if (_delete && interactionId) {
        await tx.profileInteraction.delete({ where: { id: interactionId } });
      } else if (interactionId) {
        await tx.profileInteraction.update({
          where: { id: interactionId },
          data: interactionData,
        });
      } else {
        await tx.profileInteraction.create({
          data: {
            ...interactionData,
            profileId,
            createdByProfileId,
            interactionDate: interactionData.interactionDate || new Date(),
          },
        });
      }
    }
  }

}
