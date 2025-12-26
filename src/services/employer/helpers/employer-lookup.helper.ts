import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

/**
 * Get employer by ID or throw not found error
 */
export async function getEmployerOrThrow(id: string, tx?: Prisma.TransactionClient): Promise<any> {
  const client = tx || prisma;
  const employer = await client.employer.findUnique({
    where: { id, deletedAt: null },
  });

  if (!employer) {
    throw new Error('Employer not found');
  }

  return employer;
}

/**
 * Ensure only one primary authorized person per employer
 */
export async function ensureSinglePrimary(
  employerId: string,
  excludePersonId?: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx || prisma;
  const where: Prisma.EmployerAuthorizedPersonWhereInput = {
    employerId,
    isPrimary: true,
  };
  if (excludePersonId) {
    where.id = { not: excludePersonId };
  }

  await client.employerAuthorizedPerson.updateMany({
    where,
    data: { isPrimary: false },
  });
}
