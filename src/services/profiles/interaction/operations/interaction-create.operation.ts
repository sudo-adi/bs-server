import prisma from '@/config/prisma';
import type { CreateInteractionDto } from '@/types';
import type { Interaction } from '@/types/prisma.types';
import { cleanUuid } from '@/utils/uuidHelper';

export class InteractionCreateOperation {
  static async create(data: CreateInteractionDto): Promise<Interaction> {
    const interaction = await prisma.interactions.create({
      data: {
        profile_id: data.profile_id,
        interaction_type_id: cleanUuid(data.interaction_type_id),
        subject: data.subject,
        description: data.description,
        outcome: data.outcome,
        next_follow_up_date: data.next_follow_up_date ? new Date(data.next_follow_up_date) : null,
        created_by_user_id: cleanUuid(data.created_by_user_id),
      },
      include: {
        profiles: true,
        interaction_types: true,
      },
    });

    return interaction;
  }
}
