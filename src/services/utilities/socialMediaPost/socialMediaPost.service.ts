import type { social_media_posts } from '@/generated/prisma';
import { SocialMediaPostCreateOperation } from './operations/social-media-post-create.operation';
import { SocialMediaPostDeleteOperation } from './operations/social-media-post-delete.operation';
import { SocialMediaPostUpdateOperation } from './operations/social-media-post-update.operation';
import {
  PaginatedSocialMediaPostsResponse,
  PaginationParams,
  SocialMediaPostFilters,
  SocialMediaPostQuery,
  SocialMediaPostStats,
} from './queries/social-media-post.query';

export class SocialMediaPostService {
  async getAll(
    filters?: SocialMediaPostFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedSocialMediaPostsResponse> {
    return SocialMediaPostQuery.getAll(filters || {}, pagination || { page: 1, limit: 20 });
  }

  async getById(id: string): Promise<social_media_posts | null> {
    return SocialMediaPostQuery.getById(id);
  }

  async create(data: any): Promise<social_media_posts> {
    return SocialMediaPostCreateOperation.create(data);
  }

  async update(id: string, data: any): Promise<social_media_posts | null> {
    return SocialMediaPostUpdateOperation.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return SocialMediaPostDeleteOperation.delete(id);
  }

  async getStats(): Promise<SocialMediaPostStats> {
    return SocialMediaPostQuery.getStats();
  }

  async getWithFilters(
    filters: SocialMediaPostFilters,
    pagination: PaginationParams
  ): Promise<PaginatedSocialMediaPostsResponse> {
    return SocialMediaPostQuery.getWithFilters(filters, pagination);
  }

  async searchPosts(query: string): Promise<social_media_posts[]> {
    return SocialMediaPostQuery.searchPosts(query);
  }

  async search(query: string, limit?: number): Promise<social_media_posts[]> {
    return SocialMediaPostQuery.search(query, limit);
  }
}

export default new SocialMediaPostService();
