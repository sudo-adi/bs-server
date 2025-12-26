import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

/**
 * Validate email uniqueness across employers
 */
export async function validateEmailUniqueness(
  email: string,
  excludeId?: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  if (!email) return;

  const client = tx || prisma;
  const where: Prisma.EmployerWhereInput = { email, deletedAt: null };
  if (excludeId) {
    where.id = { not: excludeId };
  }

  const existing = await client.employer.findFirst({ where });
  if (existing) {
    throw new Error(
      excludeId
        ? 'Email already in use by another employer'
        : 'Employer with this email already exists'
    );
  }
}
