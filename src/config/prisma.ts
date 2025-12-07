import { PrismaClient } from '../generated/prisma';
import logger from './logger';

class PrismaClientSingleton {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      const baseClient = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      // Log queries in development
      if (process.env.NODE_ENV === 'development') {
        baseClient.$on('query' as never, (e: unknown) => {
          const event = e as { query: string; params: string; duration: number };
          logger.debug('Prisma Query', {
            query: event.query,
            params: event.params,
            duration: `${event.duration}ms`,
          });
        });
      }

      // Log errors
      baseClient.$on('error' as never, (e: unknown) => {
        logger.error('Prisma Error', e);
      });

      // Log warnings
      baseClient.$on('warn' as never, (e: unknown) => {
        logger.warn('Prisma Warning', e);
      });

      PrismaClientSingleton.instance = baseClient;

      // Handle shutdown gracefully
      process.on('beforeExit', async () => {
        await PrismaClientSingleton.instance.$disconnect();
        logger.info('Prisma client disconnected');
      });
    }

    return PrismaClientSingleton.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      logger.info('Prisma client manually disconnected');
    }
  }

  public static async testConnection(retries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info(`Testing Prisma connection (attempt ${attempt}/${retries})...`);
        const prisma = PrismaClientSingleton.getInstance();
        await prisma.$queryRaw`SELECT 1`;
        logger.info('Prisma database connection successful');
        return true;
      } catch (error: any) {
        logger.error(`Prisma connection attempt ${attempt} failed:`, error.message || error);

        if (attempt < retries) {
          const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
          logger.info(`Retrying in ${waitTime / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    logger.error('All Prisma connection attempts failed');
    return false;
  }
}

export const prisma = PrismaClientSingleton.getInstance();
export const testPrismaConnection = PrismaClientSingleton.testConnection;
export const disconnectPrisma = PrismaClientSingleton.disconnect;

export default prisma;
