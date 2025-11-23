import type { CreateInteractionDto, Interaction, UpdateInteractionDto } from '@/types/prisma.types';
import { InteractionCreateOperation } from './operations/interaction-create.operation';
import { InteractionDeleteOperation } from './operations/interaction-delete.operation';
import { InteractionUpdateOperation } from './operations/interaction-update.operation';
import { InteractionQuery } from './queries/interaction.query';

export class InteractionService {
  async getProfileInteractions(profileId: string): Promise<Interaction[]> {
    return InteractionQuery.getProfileInteractions(profileId);
  }

  async createInteraction(data: CreateInteractionDto): Promise<Interaction> {
    return InteractionCreateOperation.create(data);
  }

  async updateInteraction(id: string, data: UpdateInteractionDto): Promise<Interaction> {
    return InteractionUpdateOperation.update(id, data);
  }

  async deleteInteraction(id: string): Promise<void> {
    return InteractionDeleteOperation.delete(id);
  }
}

export default new InteractionService();
