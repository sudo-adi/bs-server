import type { Trainer } from '@/types/prisma.types';
import type { UpdateDTO } from '@/types/shared';

// Create DTO: profile_id is required, other trainer-specific fields are optional
export type CreateTrainerDto = Pick<Trainer, 'profile_id'> &
  Partial<Omit<Trainer, 'id' | 'profile_id' | 'created_at' | 'updated_at' | 'profiles' | 'users' | 'trainer_batch_assignments'>>;

export type UpdateTrainerDto = UpdateDTO<Trainer>;
