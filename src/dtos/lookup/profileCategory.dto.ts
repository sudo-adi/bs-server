/**
 * Profile Category DTOs
 */

export interface CreateProfileCategoryDto {
  name: string;
}

export interface UpdateProfileCategoryDto {
  name?: string;
}

export interface ProfileCategoryResponse {
  id: string;
  name: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AssignProfileCategoryDto {
  profileId: string;
  categoryId: string;
}

export interface ProfileCategoryAssignmentResponse {
  id: string;
  profileId: string | null;
  categoryId: string | null;
  assignedAt: Date | null;
  assignedByProfileId: string | null;
  category?: ProfileCategoryResponse | null;
}

export interface ProfileCategoryListQuery {
  page?: number;
  limit?: number;
  search?: string;
}
