// Shared type definitions
export interface BaseResponse {
  success: boolean;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

// News Scraper types
export interface ScrapedArticle {
  url: string;
  content: string;
  scraped_at: Date;
}

export interface ExtractedProjectData {
  project_name: string;
  sector: string;
  company_authority: string;
  location: string;
  value_cr: number;
  status: string;
  revised_budget?: number;
  revised_timeline?: string;
  delay_reason?: string;
  source_type: string;
  summary_remarks: string;
}

export interface ScraperResult {
  success: boolean;
  total_urls_found: number;
  total_articles_scraped: number;
  total_valid_projects: number;
  total_inserted: number;
  total_duplicates: number;
  errors: string[];
  inserted_projects: any[];
}

export interface CreateNewsUpdateDto extends ExtractedProjectData {
  source_url: string;
}

// Project Import types
export interface ProjectImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}
