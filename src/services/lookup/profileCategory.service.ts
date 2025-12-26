import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

export class ProfileCategoryService {
  async getAll(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 50, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProfileCategoryWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [categories, total] = await Promise.all([
      prisma.profileCategory.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.profileCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const category = await prisma.profileCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Profile category not found');
    return category;
  }

  async create(data: { name: string }) {
    const category = await prisma.profileCategory.create({ data });
    logger.info('Profile category created', { id: category.id });
    return category;
  }

  async update(id: string, data: { name?: string }) {
    const category = await prisma.profileCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Profile category not found');
    const updated = await prisma.profileCategory.update({ where: { id }, data });
    logger.info('Profile category updated', { id });
    return updated;
  }

  async delete(id: string) {
    const category = await prisma.profileCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Profile category not found');
    await prisma.profileCategory.delete({ where: { id } });
    logger.info('Profile category deleted', { id });
  }

  async assignToProfile(profileId: string, categoryId: string, assignedByProfileId?: string) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId, deletedAt: null } });
    if (!profile) throw new Error('Profile not found');

    const category = await prisma.profileCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new Error('Category not found');

    const existing = await prisma.profileCategoryAssignment.findFirst({
      where: { profileId, categoryId },
    });
    if (existing) throw new Error('Category already assigned to this profile');

    const assignment = await prisma.profileCategoryAssignment.create({
      data: { profileId, categoryId, assignedByProfileId, assignedAt: new Date() },
      include: { category: true },
    });

    logger.info('Category assigned to profile', { profileId, categoryId });
    return assignment;
  }

  async removeFromProfile(profileId: string, categoryId: string) {
    const assignment = await prisma.profileCategoryAssignment.findFirst({
      where: { profileId, categoryId },
    });
    if (!assignment) throw new Error('Assignment not found');

    await prisma.profileCategoryAssignment.delete({ where: { id: assignment.id } });
    logger.info('Category removed from profile', { profileId, categoryId });
  }
}

export const profileCategoryService = new ProfileCategoryService();
export default profileCategoryService;
