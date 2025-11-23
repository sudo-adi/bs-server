import logger from '@/config/logger';
import prisma from '@/config/prisma';
import type { news_updates, Prisma } from '@/generated/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';

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

export class NewsUpdateUpdateOperation {
  static async update(id: string, data: UpdateNewsUpdateDto): Promise<news_updates | null> {
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
}
