import prisma from '@/config/prisma';
import type { BankAccount } from '@/types';

export class BankAccountQuery {
  static async getProfileBankAccounts(profileId: string): Promise<BankAccount[]> {
    const accounts = await prisma.bank_accounts.findMany({
      where: { profile_id: profileId },
      orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
      include: {
        profiles: true,
      },
    });

    return accounts;
  }
}
