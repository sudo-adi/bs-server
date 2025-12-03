/**
 * Common filter types used across the application
 */

export interface BaseFilter {
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface StatusFilter {
  status?: string | string[];
}

export interface SearchFilter {
  search?: string;
}

export interface SortOptions {
  field: string;
  order: 'asc' | 'desc';
}
