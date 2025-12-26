// @ts-nocheck
import type { NewsUpdate } from '@/generated/prisma';
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
  async create(data: any): Promise<NewsUpdate> {
    return NewsUpdateCreateOperation.create(data);
  }

  async getAll(
    filters?: NewsUpdateFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<NewsUpdate>> {
    return NewsUpdateQuery.getAll(filters, pagination);
  }

  async getById(id: string): Promise<NewsUpdate | null> {
    return NewsUpdateQuery.getById(id);
  }

  async update(id: string, data: any): Promise<NewsUpdate | null> {
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

  async bulkCreate(items: any[]): Promise<{ inserted: NewsUpdate[]; duplicates: number }> {
    return NewsUpdateCreateOperation.bulkCreate(items);
  }

  async getWithFilters(
    filters: NewsUpdateFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<NewsUpdate>> {
    return NewsUpdateQuery.getWithFilters(filters, pagination);
  }

  async searchProjects(query: string): Promise<NewsUpdate[]> {
    return NewsUpdateQuery.searchProjects(query);
  }

  async search(query: string, limit?: number): Promise<NewsUpdate[]> {
    return NewsUpdateQuery.search(query, limit);
  }
}

export default new NewsUpdateService();
