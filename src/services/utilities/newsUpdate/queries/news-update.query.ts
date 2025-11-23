import logger from '@/config/logger';
import prisma from '@/config/prisma';
import type { news_updates, Prisma } from '@/generated/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';

export interface NewsUpdateFilters {
  sector?: string;
  status?: string;
  min_value?: number;
  max_value?: number;
  start_date?: Date;
  end_date?: Date;
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
  total_count: number;
  total_value_cr: number;
  by_sector: { sector: string; count: number; total_value: number }[];
  by_status: { status: string; count: number }[];
  recent_updates: number;
}

export class NewsUpdateQuery {
  static async getAll(
    filters: NewsUpdateFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<news_updates>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const sort_by = pagination.sort_by || 'created_at';
    const sort_order = (pagination.sort_order || 'desc').toLowerCase() as 'asc' | 'desc';
    const skip = (page - 1) * limit;

    const where: Prisma.news_updatesWhereInput = {};

    if (filters.sector) {
      where.sector = { contains: filters.sector, mode: 'insensitive' };
    }

    if (filters.status) {
      where.status = { contains: filters.status, mode: 'insensitive' };
    }

    if (filters.min_value !== undefined || filters.max_value !== undefined) {
      where.value_cr = {};
      if (filters.min_value !== undefined) {
        where.value_cr.gte = new Decimal(filters.min_value);
      }
      if (filters.max_value !== undefined) {
        where.value_cr.lte = new Decimal(filters.max_value);
      }
    }

    if (filters.start_date || filters.end_date) {
      where.scraped_date = {};
      if (filters.start_date) {
        where.scraped_date.gte = filters.start_date;
      }
      if (filters.end_date) {
        where.scraped_date.lte = filters.end_date;
      }
    }

    if (filters.search) {
      where.OR = [
        { project_name: { contains: filters.search, mode: 'insensitive' } },
        { company_authority: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
        { summary_remarks: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, totalItems] = await Promise.all([
      prisma.news_updates.findMany({
        where,
        orderBy: { [sort_by]: sort_order },
        take: limit,
        skip,
      }),
      prisma.news_updates.count({ where }),
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

  static async getById(id: string): Promise<news_updates | null> {
    return await prisma.news_updates.findUnique({
      where: { id },
    });
  }

  static async existsBySourceUrl(sourceUrl: string): Promise<boolean> {
    const count = await prisma.news_updates.count({
      where: { source_url: sourceUrl },
    });
    return count > 0;
  }

  static async getStats(): Promise<NewsUpdateStats> {
    try {
      const [totalStats, bySector, byStatus, recentCount] = await Promise.all([
        prisma.news_updates.aggregate({
          _count: true,
          _sum: {
            value_cr: true,
          },
        }),
        prisma.news_updates.groupBy({
          by: ['sector'],
          where: { sector: { not: '' } },
          _count: { _all: true },
          _sum: {
            value_cr: true,
          },
          orderBy: {
            _count: {
              sector: 'desc',
            },
          },
        }),
        prisma.news_updates.groupBy({
          by: ['status'],
          where: { status: { not: '' } },
          _count: { _all: true },
          orderBy: {
            _count: {
              status: 'desc',
            },
          },
        }),
        prisma.news_updates.count({
          where: {
            scraped_date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      return {
        total_count: totalStats._count,
        total_value_cr: totalStats._sum.value_cr ? Number(totalStats._sum.value_cr) : 0,
        by_sector: bySector.map((row) => ({
          sector: row.sector || 'N/A',
          count: row._count._all,
          total_value: row._sum.value_cr ? Number(row._sum.value_cr) : 0,
        })),
        by_status: byStatus.map((row) => ({
          status: row.status || 'N/A',
          count: row._count._all,
        })),
        recent_updates: recentCount,
      };
    } catch (error) {
      logger.error('Error getting statistics', { error });
      throw error;
    }
  }

  static async search(keyword: string, limit: number = 20): Promise<news_updates[]> {
    return await prisma.news_updates.findMany({
      where: {
        OR: [
          { project_name: { contains: keyword, mode: 'insensitive' } },
          { company_authority: { contains: keyword, mode: 'insensitive' } },
          { location: { contains: keyword, mode: 'insensitive' } },
          { summary_remarks: { contains: keyword, mode: 'insensitive' } },
          { sector: { contains: keyword, mode: 'insensitive' } },
        ],
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  static async getWithFilters(filters: any, pagination: any): Promise<PaginatedResponse<news_updates>> {
    return this.getAll(filters, pagination);
  }

  static async searchProjects(query: string): Promise<news_updates[]> {
    return this.search(query);
  }
}
