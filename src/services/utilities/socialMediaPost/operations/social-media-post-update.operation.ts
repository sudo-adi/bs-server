// @ts-nocheck
import prisma from '@/config/prisma';
import type { Prisma, social_media_posts } from '@/generated/prisma';
import { SocialMediaPostQuery } from '../queries/social-media-post.query';

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

export class SocialMediaPostUpdateOperation {
  static async update(
    id: string,
    data: UpdateSocialMediaPostDto
  ): Promise<social_media_posts | null> {
    const updateData: Prisma.SocialMediaPostUpdateInput = {};

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
      return await SocialMediaPostQuery.getById(id);
    }

    try {
      return await prisma.socialMediaPost.update({
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
}
