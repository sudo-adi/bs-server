import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type {
  BankAccount,
  CreateBankAccountDto,
  UpdateBankAccountDto,
  VerifyBankAccountDto,
} from '@/models/profiles/bankAccount.model';
import {
  VerificationStatus,
  VERIFICATION_STATUSES,
} from '@/types/enums';

export class BankAccountService {
  async getProfileBankAccounts(profileId: string): Promise<BankAccount[]> {
    const accounts = await prisma.bank_accounts.findMany({
      where: { profile_id: profileId },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
      include: {
        profiles: true,
      },
    });

    return accounts;
  }

  async createBankAccount(data: CreateBankAccountDto): Promise<BankAccount> {
    // Use Prisma transaction to handle setting is_primary
    const account = await prisma.$transaction(async (tx) => {
      // If this is set as primary, unset other primary accounts for this profile
      if (data.is_primary) {
        await tx.bank_accounts.updateMany({
          where: { profile_id: data.profile_id },
          data: { is_primary: false },
        });
      }

      return await tx.bank_accounts.create({
        data: {
          profile_id: data.profile_id,
          account_holder_name: data.account_holder_name,
          account_number: data.account_number,
          ifsc_code: data.ifsc_code,
          bank_name: data.bank_name,
          branch_name: data.branch_name,
          account_type: data.account_type,
          is_primary: data.is_primary || false,
          verification_status: VerificationStatus.PENDING, // Always pending when created
        },
        include: {
          profiles: true,
        },
      });
    });

    return account;
  }

  async updateBankAccount(id: string, data: UpdateBankAccountDto): Promise<BankAccount> {
    // Check if bank account exists
    const existingAccount = await prisma.bank_accounts.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw new AppError('Bank account not found', 404);
    }

    // Build update data object
    const updateData: any = {};

    if (data.account_holder_name !== undefined) updateData.account_holder_name = data.account_holder_name;
    if (data.account_number !== undefined) updateData.account_number = data.account_number;
    if (data.ifsc_code !== undefined) updateData.ifsc_code = data.ifsc_code;
    if (data.bank_name !== undefined) updateData.bank_name = data.bank_name;
    if (data.branch_name !== undefined) updateData.branch_name = data.branch_name;
    if (data.account_type !== undefined) updateData.account_type = data.account_type;
    if (data.is_primary !== undefined) updateData.is_primary = data.is_primary;
    // Note: is_verified is deprecated - use verification_status only
    if (data.verification_status !== undefined) {
      // Validate verification_status
      if (!VERIFICATION_STATUSES.includes(data.verification_status as VerificationStatus)) {
        throw new AppError(
          `Invalid verification_status: ${data.verification_status}. Must be one of: ${VERIFICATION_STATUSES.join(', ')}`,
          400
        );
      }
      updateData.verification_status = data.verification_status;
    }
    if (data.verified_at !== undefined) updateData.verified_at = data.verified_at;
    if (data.verified_by_user_id !== undefined) updateData.verified_by_user_id = data.verified_by_user_id;

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    // If setting this as primary, use transaction
    if (data.is_primary === true) {
      return await prisma.$transaction(async (tx) => {
        // Unset other primary accounts for this profile
        await tx.bank_accounts.updateMany({
          where: {
            profile_id: existingAccount.profile_id!,
            id: { not: id },
          },
          data: { is_primary: false },
        });

        return await tx.bank_accounts.update({
          where: { id },
          data: updateData,
          include: {
            profiles: true,
          },
        });
      });
    }

    const account = await prisma.bank_accounts.update({
      where: { id },
      data: updateData,
      include: {
        profiles: true,
      },
    });

    return account;
  }

  async verifyBankAccount(id: string, data: VerifyBankAccountDto): Promise<BankAccount> {
    // Check if bank account exists
    const existingAccount = await prisma.bank_accounts.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw new AppError('Bank account not found', 404);
    }

    // Validate verification_status
    if (!VERIFICATION_STATUSES.includes(data.verification_status as VerificationStatus)) {
      throw new AppError(
        `Invalid verification_status: ${data.verification_status}. Must be one of: ${VERIFICATION_STATUSES.join(', ')}`,
        400
      );
    }

    const account = await prisma.bank_accounts.update({
      where: { id },
      data: {
        verification_status: data.verification_status,
        verified_by_user_id: data.verified_by_user_id,
        verified_at: new Date(),
      },
      include: {
        profiles: true,
      },
    });

    return account;
  }

  async deleteBankAccount(id: string): Promise<void> {
    // Check if bank account exists
    const existingAccount = await prisma.bank_accounts.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw new AppError('Bank account not found', 404);
    }

    await prisma.bank_accounts.delete({
      where: { id },
    });
  }
}

export default new BankAccountService();
