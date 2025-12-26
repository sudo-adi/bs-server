import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

export class LanguageService {
  async getAll(query: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 100, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LanguageWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [languages, total] = await Promise.all([
      prisma.language.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.language.count({ where }),
    ]);

    return {
      data: languages,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const language = await prisma.language.findUnique({ where: { id } });
    if (!language) throw new Error('Language not found');
    return language;
  }

  async create(data: { name: string }) {
    const existing = await prisma.language.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existing) throw new Error('Language already exists');

    const language = await prisma.language.create({ data });
    logger.info('Language created', { id: language.id });
    return language;
  }

  async update(id: string, data: { name?: string }) {
    const language = await prisma.language.findUnique({ where: { id } });
    if (!language) throw new Error('Language not found');

    if (data.name) {
      const existing = await prisma.language.findFirst({
        where: { name: { equals: data.name, mode: 'insensitive' }, id: { not: id } },
      });
      if (existing) throw new Error('Language already exists');
    }

    const updated = await prisma.language.update({ where: { id }, data });
    logger.info('Language updated', { id });
    return updated;
  }

  async delete(id: string) {
    const language = await prisma.language.findUnique({ where: { id } });
    if (!language) throw new Error('Language not found');
    await prisma.language.delete({ where: { id } });
    logger.info('Language deleted', { id });
  }
}

export const languageService = new LanguageService();
export default languageService;
