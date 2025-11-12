// News Update model for infrastructure news scraper
import { Decimal } from '@/generated/prisma/runtime/library';

// Main NewsUpdate interface matching Prisma schema exactly
// This interface represents the database model type with Decimal
export interface NewsUpdate {
  id: string; // UUID
  project_name: string;
  sector: string; // NOT NULL in schema with default 'N/A'
  company_authority: string | null;
  location: string | null;
  value_cr: Decimal; // NOT NULL in schema with default 0 - Prisma Decimal type
  status: string | null;
  revised_budget: Decimal | null; // Prisma Decimal type
  revised_timeline: string | null;
  delay_reason: string | null;
  source_url: string; // UNIQUE NOT NULL
  source_type: string | null;
  summary_remarks: string; // NOT NULL in schema with default 'N/A'
  scraped_date: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface CreateNewsUpdateDto {
  project_name: string;
  sector?: string;
  company_authority?: string;
  location?: string;
  value_cr: number;
  status?: string;
  revised_budget?: number;
  revised_timeline?: string;
  delay_reason?: string;
  source_url: string;
  source_type?: string;
  summary_remarks?: string;
}

export interface UpdateNewsUpdateDto {
  project_name?: string;
  sector?: string;
  company_authority?: string;
  location?: string;
  value_cr?: number;
  status?: string;
  revised_budget?: number;
  revised_timeline?: string;
  delay_reason?: string;
  source_url?: string;
  source_type?: string;
  summary_remarks?: string;
}

export interface NewsUpdateFilters {
  sector?: string;
  status?: string;
  min_value?: number;
  max_value?: number;
  start_date?: Date;
  end_date?: Date;
  search?: string;
}

export interface NewsUpdateStats {
  total_count: number;
  total_value_cr: number;
  by_sector: { sector: string; count: number; total_value: number }[];
  by_status: { status: string; count: number }[];
  recent_updates: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// Scraper related interfaces
export interface ScrapedArticle {
  url: string;
  title?: string;
  content: string;
  scraped_at: Date;
}

export interface ExtractedProjectData {
  project_name: string;
  sector?: string;
  company_authority?: string;
  location?: string;
  value_cr: number;
  status?: string;
  revised_budget?: number;
  revised_timeline?: string;
  delay_reason?: string;
  source_type?: string;
  summary_remarks?: string;
}

export interface ScraperResult {
  success: boolean;
  total_urls_found: number;
  total_articles_scraped: number;
  total_valid_projects: number;
  total_inserted: number;
  total_duplicates: number;
  errors: string[];
  inserted_projects: NewsUpdate[];
}
