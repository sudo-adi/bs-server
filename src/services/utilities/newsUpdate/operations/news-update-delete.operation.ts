import logger from '@/config/logger';
import prisma from '@/config/prisma';

export class NewsUpdateDeleteOperation {
  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.newsUpdate.delete({
        where: { id },
      });
      logger.info('News update deleted successfully', { id });
      return true;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        logger.warn('News update not found for deletion', { id });
        return false;
      }
      logger.error('Error deleting news update', { error, id });
      throw error;
    }
  }
}
