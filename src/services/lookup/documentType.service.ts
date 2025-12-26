import logger from '@/config/logger';
import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

export class DocumentTypeService {
  async getAll(query: { page?: number; limit?: number; search?: string; categoryId?: string }) {
    const { page = 1, limit = 100, search, categoryId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentTypeWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [documentTypes, total] = await Promise.all([
      prisma.documentType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { documentCategory: true },
      }),
      prisma.documentType.count({ where }),
    ]);

    return {
      data: documentTypes,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const documentType = await prisma.documentType.findUnique({
      where: { id },
      include: { documentCategory: true },
    });
    if (!documentType) throw new Error('Document type not found');
    return documentType;
  }

  async create(data: { name: string; categoryId?: string }) {
    const documentType = await prisma.documentType.create({
      data,
      include: { documentCategory: true },
    });
    logger.info('Document type created', { id: documentType.id });
    return documentType;
  }

  async update(id: string, data: { name?: string; categoryId?: string }) {
    const documentType = await prisma.documentType.findUnique({ where: { id } });
    if (!documentType) throw new Error('Document type not found');
    const updated = await prisma.documentType.update({
      where: { id },
      data,
      include: { documentCategory: true },
    });
    logger.info('Document type updated', { id });
    return updated;
  }

  async delete(id: string) {
    const documentType = await prisma.documentType.findUnique({ where: { id } });
    if (!documentType) throw new Error('Document type not found');
    await prisma.documentType.delete({ where: { id } });
    logger.info('Document type deleted', { id });
  }
}

export const documentTypeService = new DocumentTypeService();
export default documentTypeService;
