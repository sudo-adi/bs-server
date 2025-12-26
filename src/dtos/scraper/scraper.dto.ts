/**
 * Scraper & News Update DTOs
 */

// ==================== SCRAPER WEBSITE ====================

export interface CreateScraperWebsiteDto {
  name: string;
  url: string;
  category?: string;
  isActive?: boolean;
  scrapeFrequency?: string;
  selectors?: Record<string, string>;
}

export interface UpdateScraperWebsiteDto {
  name?: string;
  url?: string;
  category?: string;
  isActive?: boolean;
  scrapeFrequency?: string;
  selectors?: Record<string, string>;
}

export interface ScraperWebsiteResponse {
  id: string;
  name: string | null;
  url: string | null;
  category: string | null;
  isActive: boolean | null;
  scrapeFrequency: string | null;
  selectors: Record<string, string> | null;
  lastScrapedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ScraperWebsiteListQuery {
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

// ==================== SCRAPER RUN ====================

export interface ScraperRunResponse {
  id: string;
  websiteId: string | null;
  status: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  articlesFound: number | null;
  articlesProcessed: number | null;
  errorMessage: string | null;
  createdAt: Date | null;
}

// ==================== NEWS UPDATE ====================

export interface CreateNewsUpdateDto {
  title: string;
  content: string;
  summary?: string;
  sourceUrl?: string;
  sourceWebsiteId?: string;
  category?: string;
  imageUrl?: string;
  publishedAt?: Date | string;
  isPublished?: boolean;
}

export interface UpdateNewsUpdateDto {
  title?: string;
  content?: string;
  summary?: string;
  category?: string;
  imageUrl?: string;
  isPublished?: boolean;
}

export interface NewsUpdateResponse {
  id: string;
  title: string | null;
  content: string | null;
  summary: string | null;
  sourceUrl: string | null;
  sourceWebsiteId: string | null;
  category: string | null;
  imageUrl: string | null;
  publishedAt: Date | null;
  isPublished: boolean | null;
  viewCount: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  sourceWebsite?: {
    id: string;
    name: string | null;
  } | null;
}

export interface NewsUpdateListQuery {
  category?: string;
  isPublished?: boolean;
  sourceWebsiteId?: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}
