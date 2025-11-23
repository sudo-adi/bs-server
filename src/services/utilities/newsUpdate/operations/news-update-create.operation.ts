import logger from '@/config/logger';
import prisma from '@/config/prisma';
import type { news_updates } from '@/generated/prisma';
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

export class NewsUpdateCreateOperation {
  static async create(data: CreateNewsUpdateDto): Promise<news_updates> {
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
        logger.warn('Duplicate source URL detected', { url: data.source_url });
        throw new Error('News update with this source URL already exists');
      }
      logger.error('Error creating news update', { error, data });
      throw error;
    }
  }

  static async bulkCreate(
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
