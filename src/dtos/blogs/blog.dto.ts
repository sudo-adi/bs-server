/**
 * Blog DTOs
 */

// ==================== REQUEST ====================

export interface CreateBlogDto {
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  featuredImageUrl?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
  publishedAt?: Date | string;
  authorProfileId?: string;
}

export interface UpdateBlogDto {
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  featuredImageUrl?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
  publishedAt?: Date | string;
}

// ==================== RESPONSE ====================

export interface BlogResponse {
  id: string;
  title: string | null;
  content: string | null;
  excerpt: string | null;
  slug: string | null;
  featuredImageUrl: string | null;
  category: string | null;
  tags: string[] | null;
  isPublished: boolean | null;
  publishedAt: Date | null;
  authorProfileId: string | null;
  viewCount: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  author?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

// ==================== QUERY ====================

export interface BlogListQuery {
  category?: string;
  isPublished?: boolean;
  authorProfileId?: string;
  tag?: string;
  page?: number;
  limit?: number;
  search?: string;
}
