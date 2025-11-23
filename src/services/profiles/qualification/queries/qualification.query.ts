import prisma from '@/config/prisma';
import type { Qualification } from '@/models/profiles/qualification.model';

export class QualificationQuery {
  static async getProfileQualifications(profileId: string): Promise<Qualification[]> {
    const qualifications = await prisma.qualifications.findMany({
      where: { profile_id: profileId },
      orderBy: { year_of_completion: 'desc' },
      include: {
        profiles: true,
      },
    });

    return qualifications;
  }
}
