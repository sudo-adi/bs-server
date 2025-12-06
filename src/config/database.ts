import { Pool, PoolClient } from 'pg';
import { env } from './env';
import logger from './logger';

class Database {
  private pool: Pool;
  private static instance: Database;

  private constructor() {
    // For Supabase, use connection pooler on port 6543 (IPv4-friendly)
    // Or use direct connection with proper family configuration
    const poolConfig: any = {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      max: 50, // Reduced from 20 to 5 for Supabase transaction mode pooler
      min: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      ssl: {
        rejectUnauthorized: false,
      },
      // Force IPv4 to avoid DNS resolution issues with IPv6
      family: 4,
    };

    // In production environments (like Render), force IPv4 by setting family to 4
    // This is more reliable than custom DNS lookup
    if (env.NODE_ENV === 'production') {
      poolConfig.options = '-c search_path=public';
      // Set keepalive to maintain connection stability
      poolConfig.keepAlive = true;
      poolConfig.keepAliveInitialDelayMillis = 10000;
    }

    this.pool = new Pool(poolConfig);

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
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

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      logger.info('Database connection successful', { time: result.rows[0].now });
      return true;
    } catch (error) {
      logger.error('Database connection failed', error);
      return false;
    }
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
