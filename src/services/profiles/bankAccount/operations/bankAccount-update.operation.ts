import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { BankAccount, UpdateBankAccountDto } from '@/models/profiles/bankAccount.model';
import { VerificationStatus, VERIFICATION_STATUSES } from '@/types/enums';

export class BankAccountUpdateOperation {
  static async update(id: string, data: UpdateBankAccountDto): Promise<BankAccount> {
    const existingAccount = await prisma.bank_accounts.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw new AppError('Bank account not found', 404);
    }

    const updateData: any = {};

    if (data.account_holder_name !== undefined) updateData.account_holder_name = data.account_holder_name;
    if (data.account_number !== undefined) updateData.account_number = data.account_number;
    if (data.ifsc_code !== undefined) updateData.ifsc_code = data.ifsc_code;
    if (data.bank_name !== undefined) updateData.bank_name = data.bank_name;
    if (data.branch_name !== undefined) updateData.branch_name = data.branch_name;
    if (data.account_type !== undefined) updateData.account_type = data.account_type;
    if (data.is_primary !== undefined) updateData.is_primary = data.is_primary;
    if (data.verification_status !== undefined) {
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

    if (data.is_primary === true) {
      return await prisma.$transaction(async (tx) => {
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
}
