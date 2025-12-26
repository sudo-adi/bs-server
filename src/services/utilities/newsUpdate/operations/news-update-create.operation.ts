import logger from '@/config/logger';
import prisma from '@/config/prisma';
import type { NewsUpdate } from '@/generated/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';

interface CreateNewsUpdateDto {
  projectName: string;
  sector?: string;
  companyAuthority?: string;
  location?: string;
  valueCr?: number | Decimal;
  status?: string;
  revisedBudget?: number | Decimal;
  revisedTimeline?: string;
  delayReason?: string;
  sourceUrl: string;
  sourceType?: string;
  summaryRemarks?: string;
}

export class NewsUpdateCreateOperation {
  static async create(data: CreateNewsUpdateDto): Promise<NewsUpdate> {
    try {
      const newsUpdate = await prisma.newsUpdate.create({
        data: {
          projectName: data.projectName,
          sector: data.sector || 'N/A',
          companyAuthority: data.companyAuthority,
          location: data.location,
          valueCr: data.valueCr !== undefined ? new Decimal(data.valueCr) : new Decimal(0),
          status: data.status,
          revisedBudget: data.revisedBudget ? new Decimal(data.revisedBudget) : undefined,
          revisedTimeline: data.revisedTimeline,
          delayReason: data.delayReason,
          sourceUrl: data.sourceUrl,
          sourceType: data.sourceType || 'News Media',
          summaryRemarks: data.summaryRemarks || 'N/A',
        },
      });

      logger.info('News update created successfully', { id: newsUpdate.id });
      return newsUpdate;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2002') {
        logger.warn('Duplicate source URL detected', { url: data.sourceUrl });
        throw new Error('News update with this source URL already exists');
      }
      logger.error('Error creating news update', { error, data });
      throw error;
    }
  }

  static async bulkCreate(
    dataArray: CreateNewsUpdateDto[]
  ): Promise<{ inserted: NewsUpdate[]; duplicates: number }> {
    const inserted: NewsUpdate[] = [];
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
