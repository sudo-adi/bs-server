import prisma from '@/config/prisma';
import type { BankAccount, CreateBankAccountDto } from '@/types';
import { VerificationStatus } from '@/types/enums';

export class BankAccountCreateOperation {
  static async create(data: CreateBankAccountDto): Promise<BankAccount> {
    const account = await prisma.$transaction(async (tx) => {
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
          verification_status: VerificationStatus.PENDING,
        },
        include: {
          profiles: true,
        },
      });
    });

    return account;
  }
}
