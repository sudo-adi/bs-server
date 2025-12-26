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

      const [profiles, total] = await Promise.all([
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
          },
        }),
        prisma.profile.count({ where }),
      ]);

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
