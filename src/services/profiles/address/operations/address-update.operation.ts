import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { Address, UpdateAddressDto } from '@/types';

export class AddressUpdateOperation {
  static async update(id: string, data: UpdateAddressDto): Promise<Address> {
    const existingAddress = await prisma.addresses.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      throw new AppError('Address not found', 404);
    }

    // Filter out undefined values - only include defined fields
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    ) as Partial<UpdateAddressDto>;

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    // Helper function to perform the update
    const performUpdate = async (tx: any) => {
      if (data.is_current === true) {
        await tx.addresses.updateMany({
          where: {
            profile_id: existingAddress.profile_id!,
            id: { not: id },
          },
          data: { is_current: false },
        });
      }

      return await tx.addresses.update({
        where: { id },
        data: updateData,
      });
    };

    // Use transaction only if setting as current
    if (data.is_current === true) {
      return await prisma.$transaction(performUpdate);
    }

    return await performUpdate(prisma);
  }
}
