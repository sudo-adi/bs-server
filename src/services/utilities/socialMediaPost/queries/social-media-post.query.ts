import prisma from '@/config/prisma';
import type { Prisma, social_media_posts } from '@/generated/prisma';

export interface SocialMediaPostFilters {
  status?: string;
  platform?: string;
  search?: string;
  start_date?: Date;
  end_date?: Date;
  project_name?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: string;
}

export interface PaginatedSocialMediaPostsResponse {
  data: social_media_posts[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface SocialMediaPostStats {
  total: number;
  published: number;
  scheduled: number;
  drafts: number;
  failed: number;
}

export class SocialMediaPostQuery {
  static async getAll(
    filters: SocialMediaPostFilters,
    pagination: PaginationParams
  ): Promise<PaginatedSocialMediaPostsResponse> {
    const { page, limit, sort_by = 'created_at', sort_order = 'desc' } = pagination;
    const sortOrder = (sort_order || 'desc').toLowerCase() as 'asc' | 'desc';
    const skip = (page - 1) * limit;

    const where: Prisma.social_media_postsWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.platform) {
      where.platforms = { has: filters.platform };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { caption: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { project_name: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ];
    }

    if (filters.start_date || filters.end_date) {
      where.created_at = {};
      if (filters.start_date) {
        where.created_at.gte = filters.start_date;
      }
      if (filters.end_date) {
        where.created_at.lte = filters.end_date;
      }
    }

    if (filters.project_name) {
      where.project_name = { contains: filters.project_name, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.social_media_posts.findMany({
        where,
        orderBy: { [sort_by]: sortOrder },
        take: limit,
        skip,
        include: {
          social_media_platform_posts: true,
        },
      }),
      prisma.social_media_posts.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string): Promise<social_media_posts | null> {
    return await prisma.social_media_posts.findUnique({
      where: { id },
      include: {
        social_media_platform_posts: true,
      },
    });
  }

  static async getStats(): Promise<SocialMediaPostStats> {
    const [total, published, scheduled, drafts, failed] = await Promise.all([
      prisma.social_media_posts.count(),
      prisma.social_media_posts.count({ where: { status: 'published' } }),
      prisma.social_media_posts.count({ where: { status: 'scheduled' } }),
      prisma.social_media_posts.count({ where: { status: 'draft' } }),
      prisma.social_media_posts.count({ where: { status: 'failed' } }),
    ]);

    return {
      total,
      published,
      scheduled,
      drafts,
      failed,
    };
  }

  static async search(keyword: string, limit: number = 20): Promise<social_media_posts[]> {
    return await prisma.social_media_posts.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { caption: { contains: keyword, mode: 'insensitive' } },
          { content: { contains: keyword, mode: 'insensitive' } },
          { project_name: { contains: keyword, mode: 'insensitive' } },
          { tags: { has: keyword } },
        ],
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        social_media_platform_posts: true,
      },
    });
  }

  static async getWithFilters(filters: any, pagination: any): Promise<PaginatedSocialMediaPostsResponse> {
    return this.getAll(filters, pagination);
  }

  static async searchPosts(query: string): Promise<social_media_posts[]> {
    return this.search(query);
  }
}
