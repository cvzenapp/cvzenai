import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool;

export async function connectDatabase(): Promise<void> {
  try {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'interview_system',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    // Use connectionString if provided, otherwise use individual config
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ...config
      });
    } else {
      pool = new Pool(config);
    }

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed:', error as Error);
    throw error;
  }
}

export async function getDatabase(): Promise<Pool> {
  if (!pool) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
}

// Helper function for transactions
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Helper function for safe queries
export async function query<T = any>(
  text: string, 
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    };
  } finally {
    client.release();
  }
}