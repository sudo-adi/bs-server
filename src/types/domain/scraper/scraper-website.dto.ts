import type { ScraperWebsite } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type WebsiteType = 'government' | 'company' | 'news' | 'other';

export type CreateScraperWebsiteDto = CreateDTO<ScraperWebsite>;
export type UpdateScraperWebsiteDto = UpdateDTO<ScraperWebsite>;

export interface ScraperWebsiteStats {
  total_websites: number;
  active_websites: number;
  inactive_websites: number;
  government_sites: number;
  company_sites: number;
  news_sites: number;
  other_sites: number;
}
