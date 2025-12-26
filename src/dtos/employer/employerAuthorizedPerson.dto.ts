import { EmployerAuthorizedPerson } from '@/generated/prisma';

/**
 * Fields excluded from Create DTO
 */
type CreateExcludedFields = 'id' | 'employerId' | 'createdAt' | 'updatedAt';

/**
 * Fields excluded from Update DTO
 */
type UpdateExcludedFields = 'id' | 'employerId' | 'createdAt' | 'updatedAt';

/**
 * DTO for creating employer authorized person
 */
export type CreateAuthorizedPersonDto = Partial<Omit<EmployerAuthorizedPerson, CreateExcludedFields>> & {
  name: string;
};

/**
 * DTO for updating employer authorized person
 */
export type UpdateAuthorizedPersonDto = Partial<Omit<EmployerAuthorizedPerson, UpdateExcludedFields>>;

/**
 * Response DTO for employer authorized person
 */
export type AuthorizedPersonResponseDto = EmployerAuthorizedPerson;

/**
 * DTO for nested authorized person in employer operations
 * Supports create, update, and delete operations
 */
export interface NestedAuthorizedPersonDto {
  id?: string;
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  address?: string;
  isPrimary?: boolean;
  _delete?: boolean;
}
