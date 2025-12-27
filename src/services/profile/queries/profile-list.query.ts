import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { ProfileListDto, ProfileListQueryDto } from '@/dtos/profile/profile.dto';
import { Prisma } from '@/generated/prisma';

export class ProfileListQuery {
  static async execute(query: ProfileListQueryDto): Promise<{
    data: ProfileListDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        isActive,
        isDeleted,
        currentStage,
        gender,
        state,
        candidateCode,
        workerCode,
        codePrefix,
        workerType,
        profileType,
      } = query;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.ProfileWhereInput = {};

      // Handle deleted filter
      if (isDeleted === true) {
        where.deletedAt = { not: null };
      } else if (isDeleted === false) {
        where.deletedAt = null;
      } else {
        where.deletedAt = null;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
          { candidateCode: { contains: search } },
          { workerCode: { contains: search } },
        ];
      }
      if (isActive !== undefined) where.isActive = isActive;
      if (currentStage) {
        // Handle array of stages (comma-separated string or actual array)
        if (Array.isArray(currentStage)) {
          where.currentStage = { in: currentStage };
        } else if (currentStage.includes(',')) {
          where.currentStage = { in: currentStage.split(',') };
        } else {
          where.currentStage = currentStage;
        }
      }
      if (gender) where.gender = gender;
      if (candidateCode) where.candidateCode = candidateCode;
      if (workerCode) where.workerCode = workerCode;
      if (workerType) where.workerType = workerType;
      if (profileType) where.profileType = profileType;

      if (codePrefix) {
        where.OR = [
          ...(where.OR || []),
          { workerCode: { startsWith: codePrefix } },
          { candidateCode: { startsWith: codePrefix } },
        ];
      }

      if (state) {
        where.addresses = {
          some: {
            state: { equals: state, mode: 'insensitive' },
          },
        };
      }

      const [profilesRaw, total] = await Promise.all([
        prisma.profile.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            candidateCode: true,
            workerCode: true,
            workerType: true,
            profileType: true,
            firstName: true,
            middleName: true,
            lastName: true,
            phone: true,
            altPhone: true,
            email: true,
            isActive: true,
            currentStage: true,
            createdAt: true,
            candidateApprovedAt: true,
            candidateApprovedByProfileId: true,
            profilePhotoURL: true,
            // Include current project assignment
            workerAssignments: {
              where: {
                removedAt: null, // Only active assignments
              },
              orderBy: {
                deployedAt: 'desc',
              },
              take: 1, // Get most recent active assignment
              select: {
                id: true,
                deployedAt: true,
                stage: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                    projectCode: true,
                    startDate: true,
                    endDate: true,
                    actualEndDate: true,
                  },
                },
              },
            },
          },
        }),
        prisma.profile.count({ where }),
      ]);

      // Map profiles to include computed project fields
      const profiles = profilesRaw.map((profile) => {
        const currentAssignment = profile.workerAssignments?.[0];
        const currentProject = currentAssignment?.project;

        return {
          id: profile.id,
          candidateCode: profile.candidateCode,
          workerCode: profile.workerCode,
          workerType: profile.workerType,
          profileType: profile.profileType,
          firstName: profile.firstName,
          middleName: profile.middleName,
          lastName: profile.lastName,
          phone: profile.phone,
          altPhone: profile.altPhone,
          email: profile.email,
          isActive: profile.isActive,
          currentStage: profile.currentStage,
          createdAt: profile.createdAt,
          candidateApprovedAt: profile.candidateApprovedAt,
          candidateApprovedByProfileId: profile.candidateApprovedByProfileId,
          profilePhotoURL: profile.profilePhotoURL,
          // Computed project fields
          currentProjectName: currentProject?.name || null,
          currentDeploymentStartDate: currentAssignment?.deployedAt || currentProject?.startDate || null,
          currentDeploymentEndDate: currentProject?.actualEndDate || currentProject?.endDate || null,
        };
      });

      return {
        data: profiles,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching profiles', { error });
      throw new Error('Failed to fetch profiles');
    }
  }
}
