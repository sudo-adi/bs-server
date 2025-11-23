import type { news_updates } from '@/generated/prisma';
import { NewsUpdateCreateOperation } from './operations/news-update-create.operation';
import { NewsUpdateDeleteOperation } from './operations/news-update-delete.operation';
import { NewsUpdateUpdateOperation } from './operations/news-update-update.operation';
import {
  NewsUpdateFilters,
  NewsUpdateQuery,
  NewsUpdateStats,
  PaginatedResponse,
  PaginationParams,
} from './queries/news-update.query';

export class NewsUpdateService {
  async create(data: any): Promise<news_updates> {
    return NewsUpdateCreateOperation.create(data);
  }

  async getAll(
    filters?: NewsUpdateFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<news_updates>> {
    return NewsUpdateQuery.getAll(filters, pagination);
  }

  async getById(id: string): Promise<news_updates | null> {
    return NewsUpdateQuery.getById(id);
  }

  async update(id: string, data: any): Promise<news_updates | null> {
    return NewsUpdateUpdateOperation.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return NewsUpdateDeleteOperation.delete(id);
  }

  async existsBySourceUrl(sourceUrl: string): Promise<boolean> {
    return NewsUpdateQuery.existsBySourceUrl(sourceUrl);
  }

  async getStats(): Promise<NewsUpdateStats> {
    return NewsUpdateQuery.getStats();
  }

  async bulkCreate(items: any[]): Promise<{ inserted: news_updates[]; duplicates: number }> {
    return NewsUpdateCreateOperation.bulkCreate(items);
  }

  async getWithFilters(
    filters: NewsUpdateFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<news_updates>> {
    return NewsUpdateQuery.getWithFilters(filters, pagination);
  }

  async searchProjects(query: string): Promise<news_updates[]> {
    return NewsUpdateQuery.searchProjects(query);
  }

  async search(query: string, limit?: number): Promise<news_updates[]> {
    return NewsUpdateQuery.search(query, limit);
  }
}

export default new NewsUpdateService();
