import prisma from '@/config/prisma';
import type { scraper_websites } from '@/generated/prisma';

interface CreateScraperWebsiteDto {
  url: string;
  name?: string;
  type?: string;
  is_active?: boolean;
}

export class ScraperWebsiteCreateOperation {
  static async create(data: CreateScraperWebsiteDto): Promise<scraper_websites> {
    return await prisma.scraper_websites.create({
      data: {
        url: data.url,
        name: data.name,
        type: data.type || 'other',
        is_active: data.is_active !== undefined ? data.is_active : true,
      },
    });
  }

  static async bulkCreate(websites: CreateScraperWebsiteDto[]): Promise<number> {
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
}
