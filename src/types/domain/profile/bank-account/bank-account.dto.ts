import type { BankAccount } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type CreateBankAccountDto = CreateDTO<BankAccount>;
export type UpdateBankAccountDto = UpdateDTO<BankAccount>;

// Bank account verification DTO
export interface VerifyBankAccountDto {
  verification_status: string;
  verified_by_user_id: string;
}

export interface VerifyBankAccountDto {
  verification_status: string;
  verified_by_user_id: string;
}
