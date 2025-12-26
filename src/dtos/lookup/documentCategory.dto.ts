/**
 * Document Category & Type DTOs
 */

// ==================== DOCUMENT CATEGORY ====================

export interface CreateDocumentCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateDocumentCategoryDto {
  name?: string;
  description?: string;
}

export interface DocumentCategoryResponse {
  id: string;
  name: string | null;
  description: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// ==================== DOCUMENT TYPE ====================

export interface CreateDocumentTypeDto {
  name: string;
  categoryId?: string;
}

export interface UpdateDocumentTypeDto {
  name?: string;
  categoryId?: string;
}

export interface DocumentTypeResponse {
  id: string;
  name: string | null;
  categoryId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  documentCategory?: DocumentCategoryResponse | null;
}

// ==================== QUERY ====================

export interface DocumentCategoryListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DocumentTypeListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}
