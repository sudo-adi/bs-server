export interface Blog {
  id: bigint;
  created_at: Date;
  title: string | null;
  content: string | null;
  image_url: string | null;
  category: string | null;
  created_by_user_id: string | null;
  published_at?: Date | null;
  status?: string; // draft, published, archived
  author_name?: string;
}

export interface CreateBlogDTO {
  title: string;
  content: string;
  image_url?: string;
  category?: string;
  status?: 'draft' | 'published';
}

export interface UpdateBlogDTO {
  title?: string;
  content?: string;
  image_url?: string;
  category?: string;
  status?: 'draft' | 'published';
}

export interface BlogResponse {
  success: boolean;
  data: Blog;
  message: string;
}

export interface BlogsResponse {
  success: boolean;
  data: Blog[];
  total: number;
  limit: number;
  offset: number;
}

export interface BlogFilters {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}
