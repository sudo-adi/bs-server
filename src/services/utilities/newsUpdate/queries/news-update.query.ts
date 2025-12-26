import logger from '@/config/logger';
import prisma from '@/config/prisma';
import type { NewsUpdate, Prisma } from '@/generated/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';

export interface NewsUpdateFilters {
  sector?: string;
  status?: string;
  minValue?: number;
  maxValue?: number;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface NewsUpdateStats {
  totalCount: number;
  totalValueCr: number;
  bySector: { sector: string; count: number; totalValue: number }[];
  byStatus: { status: string; count: number }[];
  recentUpdates: number;
}

export class NewsUpdateQuery {
  static async getAll(
    filters: NewsUpdateFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<NewsUpdate>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const sort_by = pagination.sort_by || 'createdAt';
    const sort_order = (pagination.sort_order || 'desc').toLowerCase() as 'asc' | 'desc';
    const skip = (page - 1) * limit;

    const where: Prisma.NewsUpdateWhereInput = {};

    if (filters.sector) {
      where.sector = { contains: filters.sector, mode: 'insensitive' };
    }

    if (filters.status) {
      where.status = { contains: filters.status, mode: 'insensitive' };
    }

    if (filters.minValue !== undefined || filters.maxValue !== undefined) {
      where.valueCr = {};
      if (filters.minValue !== undefined) {
        where.valueCr.gte = new Decimal(filters.minValue);
      }
      if (filters.maxValue !== undefined) {
        where.valueCr.lte = new Decimal(filters.maxValue);
      }
    }

    if (filters.startDate || filters.endDate) {
      where.scrapedDate = {};
      if (filters.startDate) {
        where.scrapedDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.scrapedDate.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { projectName: { contains: filters.search, mode: 'insensitive' } },
        { companyAuthority: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
        { summaryRemarks: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, totalItems] = await Promise.all([
      prisma.newsUpdate.findMany({
        where,
        orderBy: { [sort_by]: sort_order },
        take: limit,
        skip,
      }),
      prisma.newsUpdate.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: totalItems,
        items_per_page: limit,
        has_next: page < totalPages,
        has_previous: page > 1,
      },
    };
  }

  static async getById(id: string): Promise<NewsUpdate | null> {
    return await prisma.newsUpdate.findUnique({
      where: { id },
    });
  }

  static async existsBySourceUrl(sourceUrl: string): Promise<boolean> {
    const count = await prisma.newsUpdate.count({
      where: { sourceUrl: sourceUrl },
    });
    return count > 0;
  }

  static async getStats(): Promise<NewsUpdateStats> {
    try {
      const [totalStats, bySector, byStatus, recentCount] = await Promise.all([
        prisma.newsUpdate.aggregate({
          _count: true,
          _sum: {
            valueCr: true,
          },
        }),
        prisma.newsUpdate.groupBy({
          by: ['sector'],
          where: { sector: { not: '' } },
          _count: { _all: true },
          _sum: {
            valueCr: true,
          },
          orderBy: {
            _count: {
              sector: 'desc',
            },
          },
        }),
        prisma.newsUpdate.groupBy({
          by: ['status'],
          where: { status: { not: '' } },
          _count: { _all: true },
          orderBy: {
            _count: {
              status: 'desc',
            },
          },
        }),
        prisma.newsUpdate.count({
          where: {
            scrapedDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      return {
        totalCount: totalStats._count,
        totalValueCr: totalStats._sum.valueCr ? Number(totalStats._sum.valueCr) : 0,
        bySector: bySector.map((row) => ({
          sector: row.sector || 'N/A',
          count: row._count._all,
          totalValue: row._sum.valueCr ? Number(row._sum.valueCr) : 0,
        })),
        byStatus: byStatus.map((row) => ({
          status: row.status || 'N/A',
          count: row._count._all,
        })),
        recentUpdates: recentCount,
      };
    } catch (error) {
      logger.error('Error getting statistics', { error });
      throw error;
    }
  }

  static async search(keyword: string, limit: number = 20): Promise<NewsUpdate[]> {
    return await prisma.newsUpdate.findMany({
      where: {
        OR: [
          { projectName: { contains: keyword, mode: 'insensitive' } },
          { companyAuthority: { contains: keyword, mode: 'insensitive' } },
          { location: { contains: keyword, mode: 'insensitive' } },
          { summaryRemarks: { contains: keyword, mode: 'insensitive' } },
          { sector: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async getWithFilters(
    filters: any,
    pagination: any
  ): Promise<PaginatedResponse<NewsUpdate>> {
    return this.getAll(filters, pagination);
  }

  static async searchProjects(query: string): Promise<NewsUpdate[]> {
    return this.search(query);
  }
}
