import logger from '@/config/logger';
import prisma from '@/config/prisma';
import type { NewsUpdate, Prisma } from '@/generated/prisma';
import { Decimal } from '@/generated/prisma/runtime/library';

interface UpdateNewsUpdateDto {
  projectName?: string;
  sector?: string;
  companyAuthority?: string;
  location?: string;
  valueCr?: number | Decimal;
  status?: string;
  revisedBudget?: number | Decimal;
  revisedTimeline?: string;
  delayReason?: string;
  sourceUrl?: string;
  sourceType?: string;
  summaryRemarks?: string;
}

export class NewsUpdateUpdateOperation {
  static async update(id: string, data: UpdateNewsUpdateDto): Promise<NewsUpdate | null> {
    try {
      const updateData: Prisma.NewsUpdateUpdateInput = {};

      if (data.projectName !== undefined) updateData.projectName = data.projectName;
      if (data.sector !== undefined) updateData.sector = data.sector;
      if (data.companyAuthority !== undefined) updateData.companyAuthority = data.companyAuthority;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.valueCr !== undefined) updateData.valueCr = new Decimal(data.valueCr);
      if (data.status !== undefined) updateData.status = data.status;
      if (data.revisedBudget !== undefined)
        updateData.revisedBudget = data.revisedBudget ? new Decimal(data.revisedBudget) : null;
      if (data.revisedTimeline !== undefined) updateData.revisedTimeline = data.revisedTimeline;
      if (data.delayReason !== undefined) updateData.delayReason = data.delayReason;
      if (data.sourceUrl !== undefined) updateData.sourceUrl = data.sourceUrl;
      if (data.sourceType !== undefined) updateData.sourceType = data.sourceType;
      if (data.summaryRemarks !== undefined) updateData.summaryRemarks = data.summaryRemarks;

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      const newsUpdate = await prisma.newsUpdate.update({
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
