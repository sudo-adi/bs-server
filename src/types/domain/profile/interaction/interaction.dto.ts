import type { Interaction } from '@/types/prisma.types';
import type { CreateDTO, UpdateDTO } from '@/types/shared';

export type CreateInteractionDto = CreateDTO<Interaction>;
export type UpdateInteractionDto = UpdateDTO<Interaction>;
