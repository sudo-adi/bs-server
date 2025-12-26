/**
 * Language DTOs
 */

export interface CreateLanguageDto {
  name: string;
}

export interface UpdateLanguageDto {
  name?: string;
}

export interface LanguageResponse {
  id: string;
  name: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface LanguageListQuery {
  page?: number;
  limit?: number;
  search?: string;
}
