import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

export class QualificationTypeService {
  async getAll(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 100, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProfileQualificationTypeWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [qualificationTypes, total] = await Promise.all([
      prisma.profileQualificationType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.profileQualificationType.count({ where }),
    ]);

    return {
      data: qualificationTypes,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const qualificationType = await prisma.profileQualificationType.findUnique({ where: { id } });
    if (!qualificationType) throw new Error('Qualification type not found');
    return qualificationType;
  }

  async create(data: { name: string }) {
    const existing = await prisma.profileQualificationType.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existing) throw new Error('Qualification type already exists');

    const qualificationType = await prisma.profileQualificationType.create({ data });
    logger.info('Qualification type created', { id: qualificationType.id });
    return qualificationType;
  }

  async update(id: string, data: { name?: string }) {
    const qualificationType = await prisma.profileQualificationType.findUnique({ where: { id } });
    if (!qualificationType) throw new Error('Qualification type not found');

    if (data.name) {
      const existing = await prisma.profileQualificationType.findFirst({
        where: { name: { equals: data.name, mode: 'insensitive' }, id: { not: id } },
      });
      if (existing) throw new Error('Qualification type already exists');
    }

    const updated = await prisma.profileQualificationType.update({ where: { id }, data });
    logger.info('Qualification type updated', { id });
    return updated;
  }

  async delete(id: string) {
    const qualificationType = await prisma.profileQualificationType.findUnique({ where: { id } });
    if (!qualificationType) throw new Error('Qualification type not found');
    await prisma.profileQualificationType.delete({ where: { id } });
    logger.info('Qualification type deleted', { id });
  }
}

export const qualificationTypeService = new QualificationTypeService();
export default qualificationTypeService;
