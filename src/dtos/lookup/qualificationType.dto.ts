/**
 * Qualification Type DTOs
 */

export interface CreateQualificationTypeDto {
  name: string;
}

export interface UpdateQualificationTypeDto {
  name?: string;
}

export interface QualificationTypeResponse {
  id: string;
  name: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface QualificationTypeListQuery {
  page?: number;
  limit?: number;
  search?: string;
}
