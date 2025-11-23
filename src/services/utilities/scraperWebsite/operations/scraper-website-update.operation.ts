import prisma from '@/config/prisma';
import type { Prisma, scraper_websites } from '@/generated/prisma';
import { ScraperWebsiteQuery } from '../queries/scraper-website.query';

interface UpdateScraperWebsiteDto {
  url?: string;
  name?: string;
  type?: string;
  is_active?: boolean;
}

export class ScraperWebsiteUpdateOperation {
  static async update(id: string, data: UpdateScraperWebsiteDto): Promise<scraper_websites | null> {
    const updateData: Prisma.scraper_websitesUpdateInput = {};

    if (data.url !== undefined) updateData.url = data.url;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    if (Object.keys(updateData).length === 0) {
      return await ScraperWebsiteQuery.getById(id);
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
}
