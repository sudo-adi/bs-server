import { EmployerStatusHistory, Prisma } from '@/generated/prisma';

/**
 * Fields excluded from Create DTO
 */
type CreateExcludedFields = 'id' | 'employerId' | 'changedAt';

/**
 * DTO for creating employer status history entry
 */
export type CreateStatusHistoryDto = Partial<Omit<EmployerStatusHistory, CreateExcludedFields>>;

/**
 * Response DTO for employer status history
 */
export type StatusHistoryResponseDto = EmployerStatusHistory & {
  changedByProfile?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

/**
 * DTO for status change request
 */
export interface ChangeStatusDto {
  newStatus: string;
  reason?: string;
  metadata?: Prisma.JsonValue;
}

/**
 * DTO for verify employer request
 */
export interface VerifyEmployerDto {
  reason?: string;
  metadata?: Prisma.JsonValue;
}

/**
 * DTO for reject employer request
 */
export interface RejectEmployerDto {
  reason?: string;
  metadata?: Prisma.JsonValue;
}
