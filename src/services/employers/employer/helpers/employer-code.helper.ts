import prisma from '@/config/prisma';

/**
 * Helper for generating employer codes
 */
export class EmployerCodeHelper {
  /**
   * Generate unique employer code in format: BSE-001
   */
  static async generateEmployerCode(): Promise<string> {
    const lastEmployer = await prisma.employers.findFirst({
      where: { employer_code: { startsWith: 'BSE-' } },
      orderBy: { employer_code: 'desc' },
      select: { employer_code: true },
    });

    let nextCode = 1;
    if (lastEmployer?.employer_code) {
      const match = lastEmployer.employer_code.match(/BSE-(\d+)/);
      if (match) nextCode = parseInt(match[1]) + 1;
    }

    return `BSE-${String(nextCode).padStart(3, '0')}`;
  }
}
