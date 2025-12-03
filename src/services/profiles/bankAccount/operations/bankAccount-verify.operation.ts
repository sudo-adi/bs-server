import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { BankAccount, VerifyBankAccountDto } from '@/types';
import { VERIFICATION_STATUSES, VerificationStatus } from '@/types/enums';

export class BankAccountVerifyOperation {
  static async verify(id: string, data: VerifyBankAccountDto): Promise<BankAccount> {
    const existingAccount = await prisma.bank_accounts.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw new AppError('Bank account not found', 404);
    }

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
}
