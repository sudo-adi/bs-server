import prisma from '@/config/prisma';
import type { Prisma, scraper_websites } from '@/generated/prisma';

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
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

export class ScraperWebsiteQuery {
  static async getAll(
    activeOnly: boolean = false,
    paginationParams?: PaginationParams
  ): Promise<PaginatedResult<scraper_websites>> {
    const page = paginationParams?.page || 1;
    const limit = paginationParams?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.scraper_websitesWhereInput = activeOnly ? { is_active: true } : {};

    const [data, totalItems] = await Promise.all([
      prisma.scraper_websites.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      prisma.scraper_websites.count({ where }),
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

  static async getActiveWebsites(): Promise<scraper_websites[]> {
    return await prisma.scraper_websites.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
    });
  }

  static async getByType(type: string, activeOnly: boolean = false): Promise<scraper_websites[]> {
    const where: Prisma.scraper_websitesWhereInput = { type };

    if (activeOnly) {
      where.is_active = true;
    }

    return await prisma.scraper_websites.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  static async getById(id: string): Promise<scraper_websites | null> {
    return await prisma.scraper_websites.findUnique({
      where: { id },
    });
  }

  static async getStats() {
    const [
      total_websites,
      active_websites,
      inactive_websites,
      government_sites,
      company_sites,
      news_sites,
      other_sites,
    ] = await Promise.all([
      prisma.scraper_websites.count(),
      prisma.scraper_websites.count({ where: { is_active: true } }),
      prisma.scraper_websites.count({ where: { is_active: false } }),
      prisma.scraper_websites.count({ where: { type: 'government' } }),
      prisma.scraper_websites.count({ where: { type: 'company' } }),
      prisma.scraper_websites.count({ where: { type: 'news' } }),
      prisma.scraper_websites.count({ where: { type: 'other' } }),
    ]);

    return {
      total_websites,
      active_websites,
      inactive_websites,
      government_sites,
      company_sites,
      news_sites,
      other_sites,
    };
  }

  static async urlExists(url: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.scraper_websitesWhereInput = { url };

    if (excludeId !== undefined) {
      where.id = { not: excludeId };
    }

    const count = await prisma.scraper_websites.count({ where });
    return count > 0;
  }
}
