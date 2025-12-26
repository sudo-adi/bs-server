// @ts-nocheck
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

    const where: Prisma.scraper_websitesWhereInput = activeOnly ? { isActive: true } : {};

    const [data, totalItems] = await Promise.all([
      prisma.scraperWebsite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.scraperWebsite.count({ where }),
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

  static async getActiveWebsites(): Promise<ScraperWebsite[]> {
    return await prisma.scraperWebsite.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  static async getByType(type: string, activeOnly: boolean = false): Promise<ScraperWebsite[]> {
    const where: Prisma.scraper_websitesWhereInput = { type };

    if (activeOnly) {
      where.isActive = true;
    }

    return await prisma.scraperWebsite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string): Promise<scraper_websites | null> {
    return await prisma.scraperWebsite.findUnique({
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
      prisma.scraperWebsite.count(),
      prisma.scraperWebsite.count({ where: { isActive: true } }),
      prisma.scraperWebsite.count({ where: { isActive: false } }),
      prisma.scraperWebsite.count({ where: { type: 'government' } }),
      prisma.scraperWebsite.count({ where: { type: 'company' } }),
      prisma.scraperWebsite.count({ where: { type: 'news' } }),
      prisma.scraperWebsite.count({ where: { type: 'other' } }),
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

    const count = await prisma.scraperWebsite.count({ where });
    return count > 0;
  }
}
