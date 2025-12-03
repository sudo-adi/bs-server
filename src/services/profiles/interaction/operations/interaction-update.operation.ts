import prisma from '@/config/prisma';
import type { Prisma } from '@/generated/prisma';
import { AppError } from '@/middlewares/errorHandler';
import type { UpdateInteractionDto } from '@/types';
import type { Interaction } from '@/types/prisma.types';
import { cleanUuid } from '@/utils/uuidHelper';

export class InteractionUpdateOperation {
  static async update(id: string, data: UpdateInteractionDto): Promise<Interaction> {
    const existingInteraction = await prisma.interactions.findUnique({
      where: { id },
    });

    if (!existingInteraction) {
      throw new AppError('Interaction not found', 404);
    }

    const updateData: Prisma.interactionsUpdateInput = {};

    if (data.interaction_type_id !== undefined) {
      // Clean up interaction_type_id - convert empty strings to null for UUID fields
      const typeId = cleanUuid(data.interaction_type_id);

      if (typeId) {
        updateData.interaction_types = { connect: { id: typeId } };
      } else {
        updateData.interaction_types = { disconnect: true };
      }
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
}
