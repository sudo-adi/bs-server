import type { SocialMediaPlatformPost, SocialMediaPost } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';
import type { BaseFilter } from '@/types/shared/filter.types';
import type { PostStatus, SocialPlatform } from './social-media.types';

export type CreateSocialMediaPostDto = CreateDTO<
  SocialMediaPost,
  'make_response' | 'make_webhook_id' | 'published_at' | 'engagement' | 'platform_content'
>;

export type UpdateSocialMediaPostDto = UpdateDTO<
  SocialMediaPost,
  'make_response' | 'make_webhook_id'
>;

export type CreateSocialMediaPlatformPostDto = CreateDTO<
  SocialMediaPlatformPost,
  'platform_post_id' | 'published_at' | 'error_message' | 'engagement'
>;

export type UpdateSocialMediaPlatformPostDto = UpdateDTO<SocialMediaPlatformPost>;

export interface SocialMediaPostFilters extends BaseFilter {
  status?: PostStatus;
  platform?: SocialPlatform;
  start_date?: Date;
  end_date?: Date;
  project_name?: string;
}

export interface SocialMediaPostStats {
  total: number;
  published: number;
  scheduled: number;
  drafts: number;
  failed: number;
}
