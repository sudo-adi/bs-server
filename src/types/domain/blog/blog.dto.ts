import type { Blog } from '@/types/prisma.types';

// CreateBlogDto - All fields optional except those with explicit requirements
export type CreateBlogDto = Omit<
  Blog,
  | 'id' // Auto-generated BigInt
  | 'created_at' // Auto-set
  | 'created_by_user_id' // Set from authenticated user
  // Relations
  | 'users'
>;

// UpdateBlogDto - All fields optional
export type UpdateBlogDto = Partial<
  Omit<
    Blog,
    | 'id' // Cannot update
    | 'created_at' // Cannot update
    | 'created_by_user_id' // Cannot update
    // Relations
    | 'users'
  >
>;

// Keep specialized response types and filters
export interface BlogFilters {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}
