import prisma from '@/config/prisma';

export class ProfileCodeHelper {
  /**
   * Generate unique profile code in format: BSW-00001
   */
  static async generate(): Promise<string> {
    const lastProfile = await prisma.profiles.findFirst({
      where: { candidate_code: { startsWith: 'BSW-' } },
      orderBy: { candidate_code: 'desc' },
      select: { candidate_code: true },
    });

    let nextCode = 1;
    if (lastProfile?.candidate_code) {
      const match = lastProfile.candidate_code.match(/BSW-(\d+)/);
      if (match) nextCode = parseInt(match[1]) + 1;
    }

    return `BSW-${String(nextCode).padStart(5, '0')}`;
  }
}
