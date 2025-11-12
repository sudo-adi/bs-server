export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'youtube';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';

// Make.com webhook response type
export interface MakeWebhookResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown; // Allow additional properties from Make.com
}

// Main SocialMediaPost interface matching Prisma schema exactly
export interface SocialMediaPost {
  id: string; // UUID (not number)
  title: string | null;
  caption: string | null;
  description: string | null;
  content: string; // NOT NULL
  platforms: string[]; // Array in Prisma
  tags: string[]; // Array with default []

  // Media URLs
  image_url: string | null;
  video_url: string | null;
  media_urls: string[]; // Array with default []

  // Project/Source information
  project_name: string | null;
  source_url: string | null;

  // Publishing details
  status: string | null; // String in Prisma with default 'draft'
  scheduled_at: Date | null; // Timestamptz
  published_at: Date | null; // Timestamptz

  // Make.com response
  make_response: Record<string, unknown> | null; // Json type in Prisma
  make_webhook_id: string | null;

  // Platform-specific content
  platform_content: Record<string, unknown> | null; // Json type in Prisma

  // YouTube specific fields
  youtube_category: string | null;
  youtube_privacy: string | null; // String in Prisma with default 'public'
  youtube_thumbnail: string | null;

  // Engagement tracking
  engagement: Record<string, unknown> | null; // Json type with default {}

  // Metadata
  created_by: string | null;
  created_at: Date | null; // Timestamptz
  updated_at: Date | null; // Timestamptz
}

// Platform post interface matching Prisma schema
export interface SocialMediaPlatformPost {
  id: string; // UUID (not number)
  post_id: string | null; // UUID reference
  platform: string; // NOT NULL
  platform_post_id: string | null;
  status: string | null; // With default 'pending'
  published_at: Date | null; // Timestamptz
  error_message: string | null;
  engagement: Record<string, unknown> | null; // Json with default {}
  created_at: Date | null; // Timestamptz
  updated_at: Date | null; // Timestamptz
}

export interface CreateSocialMediaPostDto {
  title?: string;
  caption?: string;
  description?: string;
  content: string;
  platforms: SocialPlatform[];
  tags?: string[];
  image_url?: string;
  video_url?: string;
  media_urls?: string[];
  project_name?: string;
  source_url?: string;
  status?: PostStatus;
  scheduled_at?: Date;
  published_at?: Date;
  youtube_category?: string;
  youtube_privacy?: 'public' | 'unlisted' | 'private';
  youtube_thumbnail?: string;
  created_by?: string;
  make_response?: MakeWebhookResponse;
  make_webhook_id?: string;
  platform_content?: Record<string, unknown>;
}

export interface UpdateSocialMediaPostDto {
  title?: string;
  caption?: string;
  description?: string;
  content?: string;
  platforms?: SocialPlatform[];
  tags?: string[];
  image_url?: string;
  video_url?: string;
  media_urls?: string[];
  project_name?: string;
  source_url?: string;
  status?: PostStatus;
  scheduled_at?: Date;
  published_at?: Date;
  youtube_category?: string;
  youtube_privacy?: 'public' | 'unlisted' | 'private';
  youtube_thumbnail?: string;
  engagement?: Record<string, unknown>;
}

export interface SocialMediaPostFilters {
  status?: PostStatus;
  platform?: SocialPlatform;
  search?: string;
  start_date?: Date;
  end_date?: Date;
  project_name?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by: string;
  sort_order: string;
}

export interface PaginatedSocialMediaPostsResponse {
  data: SocialMediaPost[];
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
