import prisma from '@/config/prisma';
import type { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type {
  CreateInteractionDto,
  Interaction,
  UpdateInteractionDto,
} from '@/types/prisma.types';

export class InteractionService {
  async getProfileInteractions(profileId: string): Promise<Interaction[]> {
    const interactions = await prisma.interactions.findMany({
      where: { profile_id: profileId },
      orderBy: { interaction_date: 'desc' },
      include: {
        profiles: true,
      },
    });

    return interactions;
  }

  async createInteraction(data: CreateInteractionDto): Promise<Interaction> {
    const interaction = await prisma.interactions.create({
      data: {
        profile_id: data.profile_id,
        interaction_type_id: data.interaction_type_id,
        subject: data.subject,
        description: data.description,
        outcome: data.outcome,
        next_follow_up_date: data.next_follow_up_date ? new Date(data.next_follow_up_date) : null,
        created_by_user_id: data.created_by_user_id,
      },
      include: {
        profiles: true,
        interaction_types: true,
      },
    });

    return interaction;
  }

  async updateInteraction(id: string, data: UpdateInteractionDto): Promise<Interaction> {
    // Check if interaction exists
    const existingInteraction = await prisma.interactions.findUnique({
      where: { id },
    });

    if (!existingInteraction) {
      throw new AppError('Interaction not found', 404);
    }

    // Build update data object
    const updateData: Prisma.interactionsUpdateInput = {};

    if (data.interaction_type_id !== undefined) {
      updateData.interaction_types = { connect: { id: data.interaction_type_id } };
    }
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.outcome !== undefined) updateData.outcome = data.outcome;
    if (data.next_follow_up_date !== undefined) {
      updateData.next_follow_up_date = data.next_follow_up_date
        ? new Date(data.next_follow_up_date)
        : null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const interaction = await prisma.interactions.update({
      where: { id },
      data: updateData,
      include: {
        profiles: true,
      },
    });

    return interaction;
  }

  async deleteInteraction(id: string): Promise<void> {
    // Check if interaction exists
    const existingInteraction = await prisma.interactions.findUnique({
      where: { id },
    });

    if (!existingInteraction) {
      throw new AppError('Interaction not found', 404);
    }

    await prisma.interactions.delete({
      where: { id },
    });
  }
}

export default new InteractionService();
