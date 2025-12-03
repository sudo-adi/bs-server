/**
 * Common database field patterns
 */
export type SystemFields = {
  id: string;
  created_at: Date | null;
  updated_at: Date | null;
};

export type SoftDeleteFields = {
  deleted_at: Date | null;
  deleted_by_user_id: string | null;
};

export type VerificationFields = {
  verified_at: Date | null;
  verified_by_user_id: string | null;
  verification_status: string | null;
  is_verified: boolean | null;
};

/**
 * Generic DTO factory patterns
 */
type BaseCreateDTO<T> = Omit<T, keyof SystemFields>;

export type CreateDTO<T, ExcludeFields extends keyof T = never> = Omit<
  BaseCreateDTO<T>,
  keyof SoftDeleteFields | ExcludeFields
>;

export type UpdateDTO<T, ExcludeFields extends keyof T = never> = Partial<
  CreateDTO<T, ExcludeFields>
>;

export type CreateDTOWithVerification<T> = Omit<
  BaseCreateDTO<T>,
  keyof SoftDeleteFields | keyof VerificationFields
>;

export type ReadDTO<T> = Readonly<T>;

export type CreateDTOWithRequired<T, RequiredFields extends keyof T> = Omit<
  BaseCreateDTO<T>,
  keyof SoftDeleteFields
> &
  Required<Pick<T, RequiredFields>>;

export type LoginDTO<T, Fields extends keyof T> = Pick<T, Fields>;

export type PartialUpdateDTO<T, AllowedFields extends keyof T> = Partial<Pick<T, AllowedFields>>;

export type WithRelations<T, Relations> = T & Relations;

export type NestedCreateDTO<T, NestedData> = CreateDTO<T> & NestedData;

export type BulkCreateDTO<T> = CreateDTO<T>[];
export type BulkUpdateDTO<T> = { id: string; data: UpdateDTO<T> }[];

export type FilterDTO<T> = {
  [K in keyof T]?: T[K] | { contains?: T[K]; in?: T[K][]; not?: T[K] };
};

export type SortDTO<T> = {
  [K in keyof T]?: 'asc' | 'desc';
};

/**
 * Validation error type for form/CSV validation
 */
export interface ValidationError {
  field: string;
  message: string;
}
