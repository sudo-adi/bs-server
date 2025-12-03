import type { Trainer } from '@/types/prisma.types';
import type { UpdateDTO } from '@/types/shared';

// Create DTO: name and phone are required, other fields are optional
export type CreateTrainerDto = Pick<Trainer, 'name' | 'phone'> &
  Partial<Omit<Trainer, 'id' | 'name' | 'phone' | 'created_at' | 'updated_at'>>;

export type UpdateTrainerDto = UpdateDTO<Trainer>;
