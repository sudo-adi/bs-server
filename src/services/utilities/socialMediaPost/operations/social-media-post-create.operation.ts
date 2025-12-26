// @ts-nocheck
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

export class SocialMediaPostCreateOperation {
  static async create(data: CreateSocialMediaPostDto): Promise<social_media_posts> {
    return await prisma.socialMediaPost.create({
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
}
