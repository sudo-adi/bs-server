import type { NewsUpdate } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';
import type { BaseFilter } from '@/types/shared/filter.types';

export type CreateNewsUpdateDto = CreateDTO<
  NewsUpdate,
  | 'scraped_date' // Auto-set on creation
  | 'sector' // Has default 'N/A'
  | 'summary_remarks' // Has default 'N/A'
  | 'value_cr' // Has default 0
>;
export type UpdateNewsUpdateDto = UpdateDTO<NewsUpdate, 'scraped_date'>;

export interface NewsUpdateFilters extends BaseFilter {
  sector?: string;
  status?: string;
  min_value?: number;
  max_value?: number;
  start_date?: Date;
  end_date?: Date;
}

export interface NewsUpdateStats {
  total_count: number;
  total_value_cr: number;
  by_sector: { sector: string; count: number; total_value: number }[];
  by_status: { status: string; count: number }[];
  recent_updates: number;
}
