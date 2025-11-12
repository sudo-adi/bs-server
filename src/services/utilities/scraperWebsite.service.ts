import prisma from '@/config/prisma';
import type { Prisma, scraper_websites } from '@/generated/prisma';

interface CreateScraperWebsiteDto {
  url: string;
  name?: string;
  type?: string;
  is_active?: boolean;
}

interface UpdateScraperWebsiteDto {
  url?: string;
  name?: string;
  type?: string;
  is_active?: boolean;
}

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

class ScraperWebsiteService {
  // Get all scraper websites with pagination
  async getAll(
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

  // Get active websites only (for scraper)
  async getActiveWebsites(): Promise<scraper_websites[]> {
    return await prisma.scraper_websites.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
    });
  }

  // Get websites by type
  async getByType(type: string, activeOnly: boolean = false): Promise<scraper_websites[]> {
    const where: Prisma.scraper_websitesWhereInput = { type };

    if (activeOnly) {
      where.is_active = true;
    }

    return await prisma.scraper_websites.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  // Get single website by ID
  async getById(id: string): Promise<scraper_websites | null> {
    return await prisma.scraper_websites.findUnique({
      where: { id },
    });
  }

  // Create new website
  async create(data: CreateScraperWebsiteDto): Promise<scraper_websites> {
    return await prisma.scraper_websites.create({
      data: {
        url: data.url,
        name: data.name,
        type: data.type || 'other',
        is_active: data.is_active !== undefined ? data.is_active : true,
      },
    });
  }

  // Update website
  async update(id: string, data: UpdateScraperWebsiteDto): Promise<scraper_websites | null> {
    const updateData: Prisma.scraper_websitesUpdateInput = {};

    if (data.url !== undefined) updateData.url = data.url;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    if (Object.keys(updateData).length === 0) {
      return await this.getById(id);
    }

    try {
      return await prisma.scraper_websites.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  // Delete website
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.scraper_websites.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  // Bulk create websites (for initial seeding)
  async bulkCreate(websites: CreateScraperWebsiteDto[]): Promise<number> {
    if (websites.length === 0) {
      return 0;
    }

    const result = await prisma.scraper_websites.createMany({
      data: websites.map((site) => ({
        url: site.url,
        name: site.name,
        type: site.type || 'other',
        is_active: site.is_active !== undefined ? site.is_active : true,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }

  // Get statistics
  async getStats() {
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

  // Check if URL already exists
  async urlExists(url: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.scraper_websitesWhereInput = { url };

    if (excludeId !== undefined) {
      where.id = { not: excludeId };
    }

    const count = await prisma.scraper_websites.count({ where });
    return count > 0;
  }
}

export default new ScraperWebsiteService();
