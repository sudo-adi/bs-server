// Re-export BankAccount types from Prisma types
export type { BankAccount, CreateBankAccountDto, UpdateBankAccountDto } from '@/types/prisma.types';

// Additional DTOs specific to bank account operations
export interface VerifyBankAccountDto {
  verification_status: string;
  verified_by_user_id: string;
}
