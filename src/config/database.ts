import { Pool, PoolClient } from 'pg';
import { env } from './env';
import logger from './logger';

class Database {
  private pool: Pool;
  private static instance: Database;

  private constructor() {
    // AWS RDS PostgreSQL connection configuration
    const poolConfig: any = {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      max: 20, // Reasonable pool size for AWS RDS
      min: 2, // Keep minimum connections alive
      idleTimeoutMillis: 10000, // Close idle connections after 10s
      connectionTimeoutMillis: 10000, // Reduce timeout to fail faster
      ssl: {
        rejectUnauthorized: false,
      },
      family: 4,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000,
    };

    // In production environments (like Render), add search path
    if (env.NODE_ENV === 'production') {
      poolConfig.options = '-c search_path=public';
    }

    this.pool = new Pool(poolConfig);

    this.pool.on('error', (err: any) => {
      logger.error('Unexpected error on idle client', err.message || err);
      // Don't crash on connection errors, let the pool handle reconnection
    });

    this.pool.on('connect', () => {
      logger.debug('New client connected to database pool');
    });

    this.pool.on('remove', () => {
      logger.debug('Client removed from database pool');
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Error executing query', { text, error });
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async testConnection(retries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.info(`Testing database connection (attempt ${attempt}/${retries})...`);
        const result = await this.query('SELECT NOW()');
        logger.info('Database connection successful', { time: result.rows[0].now });
        return true;
      } catch (error: any) {
        logger.error(`Database connection attempt ${attempt} failed:`, error.message || error);

        if (attempt < retries) {
          const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
          logger.info(`Retrying in ${waitTime / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    logger.error('All database connection attempts failed');
    return false;
  }

  public async killAllConnections(): Promise<void> {
    try {
      const result = await this.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE pid <> pg_backend_pid()
          AND datname = current_database()
          AND usename = current_user;
      `);
      logger.info(`Terminated ${result.rowCount} connections`);
    } catch (error) {
      logger.error('Error killing connections', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool closed');
  }
}

export const db = Database.getInstance();
export default db;
