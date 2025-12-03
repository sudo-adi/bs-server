import type { Address, CreateAddressDto, UpdateAddressDto } from '@/types';
import { AddressCreateOperation } from './operations/address-create.operation';
import { AddressDeleteOperation } from './operations/address-delete.operation';
import { AddressUpdateOperation } from './operations/address-update.operation';
import { AddressQuery } from './queries/address.query';

export class AddressService {
  async getProfileAddresses(profileId: string): Promise<Address[]> {
    return AddressQuery.getProfileAddresses(profileId);
  }

  async createAddress(data: CreateAddressDto): Promise<Address> {
    return AddressCreateOperation.create(data);
  }

  async updateAddress(id: string, data: UpdateAddressDto): Promise<Address> {
    return AddressUpdateOperation.update(id, data);
  }

  async deleteAddress(id: string): Promise<void> {
    return AddressDeleteOperation.delete(id);
  }
}

export default new AddressService();
