import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { WorkerProfileResponseDto } from '@/dtos/worker/worker.dto';

export class WorkerProfileQuery {
  /**
   * Get worker's own profile with all related data
   */
  static async execute(profileId: string): Promise<WorkerProfileResponseDto | null> {
    try {
      const profile = await prisma.profile.findUnique({
        where: {
          id: profileId,
          deletedAt: null,
          workerType: 'blue',
        },
        include: {
          identity: true,
          addresses: {
            orderBy: { createdAt: 'desc' },
          },
          bankAccounts: {
            orderBy: { createdAt: 'desc' },
          },
          skills: {
            include: {
              skillCategory: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          languages: {
            include: {
              language: {
                select: { id: true, name: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          documents: {
            include: {
              documentType: {
                include: {
                  documentCategory: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!profile) {
        return null;
      }

      // Fetch identity documents if identity exists
      let identityDocuments: Record<string, { id: string; documentUrl: string | null } | null> = {
        aadhaarDocument: null,
        panDocument: null,
        esicDocument: null,
        uanDocument: null,
        pfDocument: null,
        healthInsuranceDocument: null,
      };

      if (profile.identity) {
        const docIds = [
          profile.identity.aadhaarDocumentId,
          profile.identity.panDocumentId,
          profile.identity.esicDocumentId,
          profile.identity.uanDocumentId,
          profile.identity.pfDocumentId,
          profile.identity.healthInsuranceDocumentId,
        ].filter(Boolean) as string[];

        if (docIds.length > 0) {
          const docs = await prisma.profileDocument.findMany({
            where: { id: { in: docIds } },
            select: { id: true, documentUrl: true },
          });

          const docMap = new Map(docs.map((d) => [d.id, d]));

          if (profile.identity.aadhaarDocumentId) {
            identityDocuments.aadhaarDocument = docMap.get(profile.identity.aadhaarDocumentId) || null;
          }
          if (profile.identity.panDocumentId) {
            identityDocuments.panDocument = docMap.get(profile.identity.panDocumentId) || null;
          }
          if (profile.identity.esicDocumentId) {
            identityDocuments.esicDocument = docMap.get(profile.identity.esicDocumentId) || null;
          }
          if (profile.identity.uanDocumentId) {
            identityDocuments.uanDocument = docMap.get(profile.identity.uanDocumentId) || null;
          }
          if (profile.identity.pfDocumentId) {
            identityDocuments.pfDocument = docMap.get(profile.identity.pfDocumentId) || null;
          }
          if (profile.identity.healthInsuranceDocumentId) {
            identityDocuments.healthInsuranceDocument =
              docMap.get(profile.identity.healthInsuranceDocumentId) || null;
          }
        }
      }

      // Map to response DTO
      const response: WorkerProfileResponseDto = {
        id: profile.id,
        workerCode: profile.workerCode,
        candidateCode: profile.candidateCode,
        firstName: profile.firstName,
        middleName: profile.middleName,
        lastName: profile.lastName,
        phone: profile.phone,
        altPhone: profile.altPhone,
        email: profile.email,
        profilePhotoURL: profile.profilePhotoURL,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        fathersName: profile.fathersName,
        currentStage: profile.currentStage,
        isActive: profile.isActive,
        workerType: profile.workerType,
        profileType: profile.profileType,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        identity: profile.identity
          ? {
              id: profile.identity.id,
              aadhaarNumber: profile.identity.aadhaarNumber,
              aadhaarDocument: identityDocuments.aadhaarDocument,
              panNumber: profile.identity.panNumber,
              panDocument: identityDocuments.panDocument,
              esicNumber: profile.identity.esicNumber,
              esicDocument: identityDocuments.esicDocument,
              uanNumber: profile.identity.uanNumber,
              uanDocument: identityDocuments.uanDocument,
              pfAccountNumber: profile.identity.pfAccountNumber,
              pfDocument: identityDocuments.pfDocument,
              healthInsurancePolicy: profile.identity.healthInsurancePolicy,
              healthInsuranceProvider: profile.identity.healthInsuranceProvider,
              healthInsuranceExpiry: profile.identity.healthInsuranceExpiry,
              healthInsuranceDocument: identityDocuments.healthInsuranceDocument,
            }
          : null,
        addresses: profile.addresses.map((addr) => ({
          id: addr.id,
          addressType: addr.addressType,
          houseNumber: addr.houseNumber,
          villageOrCity: addr.villageOrCity,
          district: addr.district,
          state: addr.state,
          postalCode: addr.postalCode,
          landmark: addr.landmark,
          policeStation: addr.policeStation,
        })),
        bankAccounts: profile.bankAccounts.map((acc) => ({
          id: acc.id,
          accountHolderName: acc.accountHolderName,
          accountNumber: acc.accountNumber,
          bankName: acc.bankName,
          ifscCode: acc.ifscCode,
          branchName: acc.branchName,
          isPrimary: acc.isPrimary,
        })),
        skills: profile.skills.map((skill) => ({
          id: skill.id,
          skillCategory: skill.skillCategory
            ? { id: skill.skillCategory.id, name: skill.skillCategory.name }
            : null,
          yearsOfExperience: skill.yearsOfExperience,
          isPrimary: skill.isPrimary,
        })),
        languages: profile.languages.map((lang) => ({
          id: lang.id,
          language: lang.language ? { id: lang.language.id, name: lang.language.name } : null,
        })),
        documents: profile.documents.map((doc) => ({
          id: doc.id,
          documentUrl: doc.documentUrl,
          documentNumber: doc.documentNumber,
          documentType: doc.documentType
            ? {
                id: doc.documentType.id,
                name: doc.documentType.name,
                documentCategory: doc.documentType.documentCategory
                  ? {
                      id: doc.documentType.documentCategory.id,
                      name: doc.documentType.documentCategory.name,
                    }
                  : null,
              }
            : null,
          createdAt: doc.createdAt,
        })),
      };

      return response;
    } catch (error) {
      logger.error('Error fetching worker profile', { error, profileId });
      throw new Error('Failed to fetch worker profile');
    }
  }
}
