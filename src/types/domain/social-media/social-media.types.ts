export type SocialPlatform = 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'youtube';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type YouTubePrivacy = 'public' | 'unlisted' | 'private';

// Make.com webhook response type
export interface MakeWebhookResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown;
}
