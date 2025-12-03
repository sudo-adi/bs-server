import type { NewsUpdate } from '@/types/prisma.types';

// Scraper related interfaces
export interface ScrapedArticle {
  url: string;
  title?: string;
  content: string;
  scraped_at: Date;
}

export interface ExtractedProjectData {
  project_name: string;
  sector: string; // Required - has default "N/A" in DB
  company_authority?: string;
  location?: string;
  value_cr: number;
  status?: string;
  revised_budget?: number;
  revised_timeline?: string;
  delay_reason?: string;
  source_type?: string;
  summary_remarks: string; // Required - has default "N/A" in DB
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
