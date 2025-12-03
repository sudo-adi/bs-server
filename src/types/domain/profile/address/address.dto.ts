import type { Address } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type CreateAddressDto = CreateDTO<Address>;
export type UpdateAddressDto = UpdateDTO<Address>;
