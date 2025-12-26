import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ProfileDto } from '@/dtos/profile/profile.dto';

export class ProfileDetailQuery {
  static async execute(id: string): Promise<ProfileDto | null> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id, deletedAt: null },
        include: {
          identity: true,
          addresses: {
            include: {
              document: {
                select: {
                  id: true,
                  documentUrl: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          bankAccounts: {
            include: {
              document: {
                select: {
                  id: true,
                  documentUrl: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          documents: {
            include: {
              documentType: {
                include: {
                  documentCategory: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          qualifications: {
            include: {
              qualificationType: true,
              document: {
                select: {
                  id: true,
                  documentUrl: true,
                },
              },
            },
            orderBy: { yearOfCompletion: 'desc' },
          },
          skills: {
            include: {
              skillCategory: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          languages: {
            include: {
              language: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          interactions: {
            include: {
              interactionType: true,
              createdByProfile: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { interactionDate: 'desc' },
          },
          roleAssignments: {
            where: { revokedAt: null },
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          },
          categoryAssignments: {
            include: {
              category: true,
            },
          },
          batchEnrollments: {
            include: {
              batch: true,
            },
            orderBy: { enrollmentDate: 'desc' },
          },
          workerAssignments: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  stage: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          stageHistory: {
            include: {
              changedByProfile: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { changedAt: 'desc' },
          },
          trainingCertificates: {
            include: {
              trainingBatch: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
            orderBy: { issuedDate: 'desc' },
          },
        },
      });

      if (!profile) return null;

      const { passwordHash, ...profileWithoutPassword } = profile;
      return profileWithoutPassword as ProfileDto;
    } catch (error) {
      logger.error('Error fetching profile by ID', { error, id });
      throw new Error('Failed to fetch profile');
    }
  }
}
