import { Pool } from 'pg';
import { env } from '../config/env';

async function killAllConnections() {
  // Create a temporary pool just for this operation
  const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 1, // Only need 1 connection for this
  });

  try {
    console.log('Terminating all active connections...');

    const result = await pool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid()
        AND datname = $1
        AND usename = $2;
    `, [env.DB_NAME, env.DB_USER]);

    console.log(`Successfully terminated ${result.rowCount} connections`);
  } catch (error) {
    console.error('Error terminating connections:', error);
  } finally {
    await pool.end();
  }
}

killAllConnections();
