// Scraper Website model - Aligned with Prisma schema
export interface ScraperWebsite {
  id: string; // UUID in Prisma schema
  url: string; // UNIQUE NOT NULL
  name: string | null; // Added in Prisma schema
  type: 'government' | 'company' | 'news' | 'other' | null; // Default 'other'
  is_active: boolean; // Default true
  created_at: Date;
  updated_at: Date;
}

export interface CreateScraperWebsiteDto {
  url: string;
  name?: string | null;
  type?: 'government' | 'company' | 'news' | 'other' | null;
  is_active?: boolean;
}

export interface UpdateScraperWebsiteDto {
  url?: string;
  name?: string | null;
  type?: 'government' | 'company' | 'news' | 'other' | null;
  is_active?: boolean;
}

export interface ScraperWebsiteStats {
  total_websites: number;
  active_websites: number;
  inactive_websites: number;
  government_sites: number;
  company_sites: number;
  news_sites: number;
  other_sites: number;
}
