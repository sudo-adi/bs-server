import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { Address, CreateAddressDto, UpdateAddressDto } from '@/types/prisma.types';

export class AddressService {
  async getProfileAddresses(profileId: string): Promise<Address[]> {
    const addresses = await prisma.addresses.findMany({
      where: { profile_id: profileId },
      orderBy: [{ is_current: 'desc' }, { created_at: 'desc' }],
    });
    return addresses;
  }

  async createAddress(data: CreateAddressDto): Promise<Address> {
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

  async updateAddress(id: string, data: UpdateAddressDto): Promise<Address> {
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

  async deleteAddress(id: string): Promise<void> {
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

export default new AddressService();
