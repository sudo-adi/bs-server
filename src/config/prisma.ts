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
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
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

  public static async testConnection(): Promise<boolean> {
    try {
      const prisma = PrismaClientSingleton.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Prisma database connection successful');
      return true;
    } catch (error) {
      logger.error('Prisma database connection failed', error);
      return false;
    }
  }
}

export const prisma = PrismaClientSingleton.getInstance();
export const testPrismaConnection = PrismaClientSingleton.testConnection;
export const disconnectPrisma = PrismaClientSingleton.disconnect;

export default prisma;
