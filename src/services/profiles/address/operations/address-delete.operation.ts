import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

export class AddressDeleteOperation {
  static async delete(id: string): Promise<void> {
    const existingAddress = await prisma.addresses.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      throw new AppError('Address not found', 404);
    }

    await prisma.addresses.delete({
      where: { id },
    });
  }
}
