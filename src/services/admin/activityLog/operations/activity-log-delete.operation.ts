import prisma from '@/config/prisma';

export class ActivityLogDeleteOperation {
  /**
   * Delete old activity logs
   */
  static async deleteOldLogs(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.activity_logs.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}
