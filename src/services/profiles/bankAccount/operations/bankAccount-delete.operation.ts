import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class BankAccountDeleteOperation {
  static async delete(id: string): Promise<void> {
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
