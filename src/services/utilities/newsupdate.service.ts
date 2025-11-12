import logger from '@/config/logger';
import prisma from '@/config/prisma';
import type { news_updates, Prisma } from '@/generated/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';

interface CreateNewsUpdateDto {
  project_name: string;
  sector?: string;
  company_authority?: string;
  location?: string;
  value_cr?: number | Decimal;
  status?: string;
  revised_budget?: number | Decimal;
  revised_timeline?: string;
  delay_reason?: string;
  source_url: string;
  source_type?: string;
  summary_remarks?: string;
}

interface UpdateNewsUpdateDto {
  project_name?: string;
  sector?: string;
  company_authority?: string;
  location?: string;
  value_cr?: number | Decimal;
  status?: string;
  revised_budget?: number | Decimal;
  revised_timeline?: string;
  delay_reason?: string;
  source_url?: string;
  source_type?: string;
  summary_remarks?: string;
}

interface NewsUpdateFilters {
  sector?: string;
  status?: string;
  min_value?: number;
  max_value?: number;
  start_date?: Date;
  end_date?: Date;
  search?: string;
}

interface NewsUpdateStats {
  total_count: number;
  total_value_cr: number;
  by_sector: { sector: string; count: number; total_value: number }[];
  by_status: { status: string; count: number }[];
  recent_updates: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
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

class NewsUpdateService {
  // Create a new news update
  async create(data: CreateNewsUpdateDto): Promise<news_updates> {
    try {
      const newsUpdate = await prisma.news_updates.create({
        data: {
          project_name: data.project_name,
          sector: data.sector || 'N/A',
          company_authority: data.company_authority,
          location: data.location,
          value_cr: data.value_cr !== undefined ? new Decimal(data.value_cr) : new Decimal(0),
          status: data.status,
          revised_budget: data.revised_budget ? new Decimal(data.revised_budget) : undefined,
          revised_timeline: data.revised_timeline,
          delay_reason: data.delay_reason,
          source_url: data.source_url,
          source_type: data.source_type || 'News Media',
          summary_remarks: data.summary_remarks || 'N/A',
        },
      });

      logger.info('News update created successfully', { id: newsUpdate.id });
      return newsUpdate;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        // Unique constraint violation for source_url
        logger.warn('Duplicate source URL detected', { url: data.source_url });
        throw new Error('News update with this source URL already exists');
      }
      logger.error('Error creating news update', { error, data });
      throw error;
    }
  }

  // Get all news updates with filters and pagination
  async getAll(
    filters: NewsUpdateFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<news_updates>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const sort_by = pagination.sort_by || 'created_at';
    const sort_order = (pagination.sort_order || 'desc').toLowerCase() as 'asc' | 'desc';
    const skip = (page - 1) * limit;

    const where: Prisma.news_updatesWhereInput = {};

    // Build WHERE clause dynamically based on filters
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

  // Get news update by ID
  async getById(id: string): Promise<news_updates | null> {
    return await prisma.news_updates.findUnique({
      where: { id },
    });
  }

  // Update news update
  async update(id: string, data: UpdateNewsUpdateDto): Promise<news_updates | null> {
    try {
      const updateData: Prisma.news_updatesUpdateInput = {};

      if (data.project_name !== undefined) updateData.project_name = data.project_name;
      if (data.sector !== undefined) updateData.sector = data.sector;
      if (data.company_authority !== undefined)
        updateData.company_authority = data.company_authority;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.value_cr !== undefined) updateData.value_cr = new Decimal(data.value_cr);
      if (data.status !== undefined) updateData.status = data.status;
      if (data.revised_budget !== undefined)
        updateData.revised_budget = data.revised_budget ? new Decimal(data.revised_budget) : null;
      if (data.revised_timeline !== undefined) updateData.revised_timeline = data.revised_timeline;
      if (data.delay_reason !== undefined) updateData.delay_reason = data.delay_reason;
      if (data.source_url !== undefined) updateData.source_url = data.source_url;
      if (data.source_type !== undefined) updateData.source_type = data.source_type;
      if (data.summary_remarks !== undefined) updateData.summary_remarks = data.summary_remarks;

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      const newsUpdate = await prisma.news_updates.update({
        where: { id },
        data: updateData,
      });

      logger.info('News update updated successfully', { id });
      return newsUpdate;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        logger.warn('News update not found for update', { id });
        return null;
      }
      logger.error('Error updating news update', { error, id, data });
      throw error;
    }
  }

  // Delete news update
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.news_updates.delete({
        where: { id },
      });
      logger.info('News update deleted successfully', { id });
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        logger.warn('News update not found for deletion', { id });
        return false;
      }
      logger.error('Error deleting news update', { error, id });
      throw error;
    }
  }

  // Check if source URL exists
  async existsBySourceUrl(sourceUrl: string): Promise<boolean> {
    const count = await prisma.news_updates.count({
      where: { source_url: sourceUrl },
    });
    return count > 0;
  }

  // Get statistics
  async getStats(): Promise<NewsUpdateStats> {
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
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
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

  // Search news updates
  async search(keyword: string, limit: number = 20): Promise<news_updates[]> {
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

  // Bulk insert news updates (for scraper)
  async bulkCreate(
    dataArray: CreateNewsUpdateDto[]
  ): Promise<{ inserted: news_updates[]; duplicates: number }> {
    const inserted: news_updates[] = [];
    let duplicates = 0;

    for (const data of dataArray) {
      try {
        const newsUpdate = await this.create(data);
        inserted.push(newsUpdate);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('already exists')) {
          duplicates++;
        } else {
          logger.error('Error in bulk create', { error, data });
        }
      }
    }

    return { inserted, duplicates };
  }
}

export default new NewsUpdateService();
