/**
 * Skill Category DTOs
 */

export interface CreateSkillCategoryDto {
  name: string;
  categoryType?: string;
  workerType?: string;
}

export interface UpdateSkillCategoryDto {
  name?: string;
  categoryType?: string;
  workerType?: string;
}

export interface SkillCategoryResponse {
  id: string;
  name: string | null;
  categoryType: string | null;
  workerType: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface SkillCategoryListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryType?: string;
  workerType?: string;
}
