import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

export class SkillCategoryService {
  async getAll(query: { page?: number; limit?: number; search?: string; categoryType?: string }) {
    const { page = 1, limit = 50, search, categoryType } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SkillCategoryWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (categoryType) where.categoryType = categoryType;

    const [categories, total] = await Promise.all([
      prisma.skillCategory.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.skillCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const category = await prisma.skillCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Skill category not found');
    return category;
  }

  async getByWorkerType(workerType: string) {
    // Map worker type to categoryType values used in the database
    // The database uses "blue_collar", "white_collar", "trainer" in categoryType
    const categoryTypeMap: Record<string, string> = {
      blue: 'blue_collar',
      white: 'white_collar',
      trainer: 'trainer',
    };

    const categoryType = categoryTypeMap[workerType];

    // Query by categoryType since workerType column may not be populated
    const categories = await prisma.skillCategory.findMany({
      where: {
        OR: [{ workerType }, { categoryType: categoryType }],
      },
      orderBy: { name: 'asc' },
    });

    logger.info('Skill categories retrieved by worker type', {
      workerType,
      categoryType,
      count: categories.length,
    });
    return categories;
  }

  async create(data: { name: string; categoryType?: string; workerType?: string }) {
    const category = await prisma.skillCategory.create({ data });
    logger.info('Skill category created', { id: category.id });
    return category;
  }

  async update(id: string, data: { name?: string; categoryType?: string; workerType?: string }) {
    const category = await prisma.skillCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Skill category not found');
    const updated = await prisma.skillCategory.update({ where: { id }, data });
    logger.info('Skill category updated', { id });
    return updated;
  }

  async delete(id: string) {
    const category = await prisma.skillCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Skill category not found');
    await prisma.skillCategory.delete({ where: { id } });
    logger.info('Skill category deleted', { id });
  }
}

export const skillCategoryService = new SkillCategoryService();
export default skillCategoryService;
