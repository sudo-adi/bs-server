/**
 * Social Media Post DTOs
 */

// ==================== REQUEST ====================

export interface CreateSocialMediaPostDto {
  title: string;
  content: string;
  platforms: string[];
  scheduledAt?: Date | string;
  mediaUrls?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateSocialMediaPostDto {
  title?: string;
  content?: string;
  platforms?: string[];
  scheduledAt?: Date | string;
  mediaUrls?: string[];
  tags?: string[];
  status?: 'draft' | 'scheduled' | 'published' | 'failed';
}

// ==================== RESPONSE ====================

export interface SocialMediaPostResponse {
  id: string;
  title: string | null;
  content: string | null;
  status: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdByProfileId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  platformPosts?: SocialMediaPlatformPostResponse[];
  media?: SocialMediaPostMediaResponse[];
  tags?: SocialMediaPostTagResponse[];
}

export interface SocialMediaPlatformPostResponse {
  id: string;
  postId: string | null;
  platform: string | null;
  platformPostId: string | null;
  platformPostUrl: string | null;
  status: string | null;
  publishedAt: Date | null;
  errorMessage: string | null;
  metrics: Record<string, unknown> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SocialMediaPostMediaResponse {
  id: string;
  postId: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  order: number | null;
  createdAt: Date | null;
}

export interface SocialMediaPostTagResponse {
  id: string;
  postId: string | null;
  tag: string | null;
  createdAt: Date | null;
}

// ==================== QUERY ====================

export interface SocialMediaPostListQuery {
  status?: string;
  platform?: string;
  createdByProfileId?: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ==================== PLATFORM ====================

export interface SocialMediaPlatformResponse {
  id: string;
  name: string | null;
  isActive: boolean | null;
  config: Record<string, unknown> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}
