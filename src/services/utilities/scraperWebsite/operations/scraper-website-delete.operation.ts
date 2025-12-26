// @ts-nocheck
import prisma from '@/config/prisma';

export class ScraperWebsiteDeleteOperation {
  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.scraperWebsite.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }
}
