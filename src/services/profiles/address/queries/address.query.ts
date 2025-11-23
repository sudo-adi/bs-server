import prisma from '@/config/prisma';
import type { Address } from '@/types/prisma.types';

export class AddressQuery {
  static async getProfileAddresses(profileId: string): Promise<Address[]> {
    const addresses = await prisma.addresses.findMany({
      where: { profile_id: profileId },
      orderBy: [{ is_current: 'desc' }, { created_at: 'desc' }],
    });
    return addresses;
  }
}
