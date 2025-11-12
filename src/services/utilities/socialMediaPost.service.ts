import prisma from '@/config/prisma';
import type { Prisma, social_media_posts } from '@/generated/prisma';

interface CreateSocialMediaPostDto {
  title?: string;
  caption?: string;
  description?: string;
  content: string;
  platforms: string[];
  tags?: string[];
  image_url?: string;
  video_url?: string;
  media_urls?: string[];
  project_name?: string;
  source_url?: string;
  status?: string;
  scheduled_at?: Date;
  published_at?: Date;
  youtube_category?: string;
  youtube_privacy?: string;
  youtube_thumbnail?: string;
  created_by?: string;
  make_response?: Record<string, unknown>;
  make_webhook_id?: string;
  platform_content?: Record<string, unknown>;
}

interface UpdateSocialMediaPostDto {
  title?: string;
  caption?: string;
  description?: string;
  content?: string;
  platforms?: string[];
  tags?: string[];
  image_url?: string;
  video_url?: string;
  media_urls?: string[];
  project_name?: string;
  source_url?: string;
  status?: string;
  scheduled_at?: Date;
  published_at?: Date;
  youtube_category?: string;
  youtube_privacy?: string;
  youtube_thumbnail?: string;
  engagement?: Record<string, unknown>;
  make_response?: Record<string, unknown>;
  make_webhook_id?: string;
  platform_content?: Record<string, unknown>;
}

interface SocialMediaPostFilters {
  status?: string;
  platform?: string;
  search?: string;
  start_date?: Date;
  end_date?: Date;
  project_name?: string;
}

interface SocialMediaPostStats {
  total: number;
  published: number;
  scheduled: number;
  drafts: number;
  failed: number;
}

interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: string;
}

interface PaginatedSocialMediaPostsResponse {
  data: social_media_posts[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

class SocialMediaPostService {
  /**
   * Get all posts with filters and pagination
   */
  async getAll(
    filters: SocialMediaPostFilters,
    pagination: PaginationParams
  ): Promise<PaginatedSocialMediaPostsResponse> {
    const { page, limit, sort_by = 'created_at', sort_order = 'desc' } = pagination;
    const sortOrder = (sort_order || 'desc').toLowerCase() as 'asc' | 'desc';
    const skip = (page - 1) * limit;

    const where: Prisma.social_media_postsWhereInput = {};

    // Apply filters
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

  /**
   * Get post by ID
   */
  async getById(id: string): Promise<social_media_posts | null> {
    return await prisma.social_media_posts.findUnique({
      where: { id },
      include: {
        social_media_platform_posts: true,
      },
    });
  }

  /**
   * Create new post
   */
  async create(data: CreateSocialMediaPostDto): Promise<social_media_posts> {
    return await prisma.social_media_posts.create({
      data: {
        title: data.title,
        caption: data.caption,
        description: data.description,
        content: data.content,
        platforms: data.platforms,
        tags: data.tags || [],
        image_url: data.image_url,
        video_url: data.video_url,
        media_urls: data.media_urls || [],
        project_name: data.project_name,
        source_url: data.source_url,
        status: data.status || 'draft',
        scheduled_at: data.scheduled_at,
        youtube_category: data.youtube_category,
        youtube_privacy: data.youtube_privacy || 'public',
        youtube_thumbnail: data.youtube_thumbnail,
        created_by: data.created_by || 'system',
        make_response: data.make_response as Prisma.InputJsonValue,
        make_webhook_id: data.make_webhook_id,
        platform_content: data.platform_content as Prisma.InputJsonValue,
      },
      include: {
        social_media_platform_posts: true,
      },
    });
  }

  /**
   * Update post
   */
  async update(id: string, data: UpdateSocialMediaPostDto): Promise<social_media_posts | null> {
    const updateData: Prisma.social_media_postsUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.caption !== undefined) updateData.caption = data.caption;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.platforms !== undefined) updateData.platforms = data.platforms;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.video_url !== undefined) updateData.video_url = data.video_url;
    if (data.media_urls !== undefined) updateData.media_urls = data.media_urls;
    if (data.project_name !== undefined) updateData.project_name = data.project_name;
    if (data.source_url !== undefined) updateData.source_url = data.source_url;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.scheduled_at !== undefined) updateData.scheduled_at = data.scheduled_at;
    if (data.published_at !== undefined) updateData.published_at = data.published_at;
    if (data.youtube_category !== undefined) updateData.youtube_category = data.youtube_category;
    if (data.youtube_privacy !== undefined) updateData.youtube_privacy = data.youtube_privacy;
    if (data.youtube_thumbnail !== undefined) updateData.youtube_thumbnail = data.youtube_thumbnail;
    if (data.engagement !== undefined)
      updateData.engagement = data.engagement as Prisma.InputJsonValue;
    if (data.make_response !== undefined)
      updateData.make_response = data.make_response as Prisma.InputJsonValue;
    if (data.make_webhook_id !== undefined) updateData.make_webhook_id = data.make_webhook_id;
    if (data.platform_content !== undefined)
      updateData.platform_content = data.platform_content as Prisma.InputJsonValue;

    if (Object.keys(updateData).length === 0) {
      return await this.getById(id);
    }

    try {
      return await prisma.social_media_posts.update({
        where: { id },
        data: updateData,
        include: {
          social_media_platform_posts: true,
        },
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete post
   */
  async delete(id: string): Promise<boolean> {
    try {
      await prisma.social_media_posts.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<SocialMediaPostStats> {
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

  /**
   * Search posts
   */
  async search(keyword: string, limit: number = 20): Promise<social_media_posts[]> {
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
}

export default new SocialMediaPostService();
