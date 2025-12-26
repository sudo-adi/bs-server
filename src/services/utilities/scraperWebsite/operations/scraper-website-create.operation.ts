// @ts-nocheck
import prisma from '@/config/prisma';
import type { ScraperWebsite } from '@/generated/prisma';

interface CreateScraperWebsiteDto {
  url: string;
  name?: string;
  type?: string;
  isActive?: boolean;
}

export class ScraperWebsiteCreateOperation {
  static async create(data: CreateScraperWebsiteDto): Promise<scraper_websites> {
    return await prisma.scraperWebsite.create({
      data: {
        url: data.url,
        name: data.name,
        type: data.type || 'other',
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  static async bulkCreate(websites: CreateScraperWebsiteDto[]): Promise<number> {
    if (websites.length === 0) {
      return 0;
    }

    const result = await prisma.scraperWebsite.createMany({
      data: websites.map((site) => ({
        url: site.url,
        name: site.name,
        type: site.type || 'other',
        isActive: site.isActive !== undefined ? site.isActive : true,
      })),
      skipDuplicates: true,
    });

    return result.count;
  }
}
