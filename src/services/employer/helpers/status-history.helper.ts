import prisma from '@/config/prisma';
import { Prisma } from '@/generated/prisma';

/**
 * Create employer status history entry
 */
export async function createStatusHistoryEntry(
  employerId: string,
  previousStatus: string,
  newStatus: string,
  changedByProfileId?: string,
  reason?: string,
  metadata?: Prisma.JsonValue,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const client = tx || prisma;
  await client.employerStatusHistory.create({
    data: {
      employerId,
      previousStatus,
      newStatus,
      changedByProfileId,
      changedAt: new Date(),
      reason: reason || `Status changed to ${newStatus}`,
      metadata: metadata as any,
    },
  });
}
