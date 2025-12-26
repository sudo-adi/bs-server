// @ts-nocheck
import type { ScraperWebsite } from '@/generated/prisma';
import { ScraperWebsiteCreateOperation } from './operations/scraper-website-create.operation';
import { ScraperWebsiteDeleteOperation } from './operations/scraper-website-delete.operation';
import { ScraperWebsiteUpdateOperation } from './operations/scraper-website-update.operation';
import { ScraperWebsiteQuery } from './queries/scraper-website.query';

interface CreateScraperWebsiteDto {
  url: string;
  name?: string;
  type?: string;
  isActive?: boolean;
}

interface UpdateScraperWebsiteDto {
  url?: string;
  name?: string;
  type?: string;
  isActive?: boolean;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedResult<T> {
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

class ScraperWebsiteService {
  async getAll(
    activeOnly: boolean = false,
    paginationParams?: PaginationParams
  ): Promise<PaginatedResult<scraper_websites>> {
    return ScraperWebsiteQuery.getAll(activeOnly, paginationParams);
  }

  async getActiveWebsites(): Promise<ScraperWebsite[]> {
    return ScraperWebsiteQuery.getActiveWebsites();
  }

  async getByType(type: string, activeOnly: boolean = false): Promise<ScraperWebsite[]> {
    return ScraperWebsiteQuery.getByType(type, activeOnly);
  }

  async getById(id: string): Promise<scraper_websites | null> {
    return ScraperWebsiteQuery.getById(id);
  }

  async create(data: CreateScraperWebsiteDto): Promise<scraper_websites> {
    return ScraperWebsiteCreateOperation.create(data);
  }

  async update(id: string, data: UpdateScraperWebsiteDto): Promise<scraper_websites | null> {
    return ScraperWebsiteUpdateOperation.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return ScraperWebsiteDeleteOperation.delete(id);
  }

  async bulkCreate(websites: CreateScraperWebsiteDto[]): Promise<number> {
    return ScraperWebsiteCreateOperation.bulkCreate(websites);
  }

  async getStats() {
    return ScraperWebsiteQuery.getStats();
  }

  async urlExists(url: string, excludeId?: string): Promise<boolean> {
    return ScraperWebsiteQuery.urlExists(url, excludeId);
  }
}

export default new ScraperWebsiteService();
