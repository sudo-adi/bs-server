import prisma from '@/config/prisma';
import type { Address, CreateAddressDto } from '@/types/prisma.types';

export class AddressCreateOperation {
  static async create(data: CreateAddressDto): Promise<Address> {
    const address = await prisma.$transaction(async (tx) => {
      if (data.is_current) {
        await tx.addresses.updateMany({
          where: { profile_id: data.profile_id },
          data: { is_current: false },
        });
      }

      return await tx.addresses.create({
        data: {
          ...data,
          is_current: data.is_current || false,
        },
      });
    });

    return address;
  }
}
