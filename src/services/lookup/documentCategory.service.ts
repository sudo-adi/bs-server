import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

export class DocumentCategoryService {
  async getAll(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 50, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentCategoryWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.documentCategory.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.documentCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const category = await prisma.documentCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Document category not found');
    return category;
  }

  async create(data: { name: string; description?: string }) {
    const category = await prisma.documentCategory.create({ data });
    logger.info('Document category created', { id: category.id });
    return category;
  }

  async update(id: string, data: { name?: string; description?: string }) {
    const category = await prisma.documentCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Document category not found');
    const updated = await prisma.documentCategory.update({ where: { id }, data });
    logger.info('Document category updated', { id });
    return updated;
  }

  async delete(id: string) {
    const category = await prisma.documentCategory.findUnique({ where: { id } });
    if (!category) throw new Error('Document category not found');
    await prisma.documentCategory.delete({ where: { id } });
    logger.info('Document category deleted', { id });
  }
}

export const documentCategoryService = new DocumentCategoryService();
export default documentCategoryService;
