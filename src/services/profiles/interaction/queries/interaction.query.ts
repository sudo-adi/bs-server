import prisma from '@/config/prisma';
import type { Interaction } from '@/types/prisma.types';

export class InteractionQuery {
  static async getProfileInteractions(profileId: string): Promise<Interaction[]> {
    const interactions = await prisma.interactions.findMany({
      where: { profile_id: profileId },
      orderBy: { interaction_date: 'desc' },
      include: {
        profiles: true,
      },
    });

    return interactions;
  }
}
