import { Pool } from 'pg';
import { logger } from '../utils/logger';

async function createDatabaseIfNotExists(): Promise<void> {
  // Connect to postgres database to create our database
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    const client = await adminPool.connect();
    
    // Check if database exists
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [process.env.DB_NAME || 'interview_system']
    );

    if (result.rows.length === 0) {
      // Create database
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'interview_system'}`);
      logger.info(`Database ${process.env.DB_NAME || 'interview_system'} created`);
    } else {
      logger.info(`Database ${process.env.DB_NAME || 'interview_system'} already exists`);
    }

    client.release();
  } catch (error) {
    logger.error('Database setup failed:', error as Error);
    throw error;
  } finally {
    await adminPool.end();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  createDatabaseIfNotExists()
    .then(() => {
      console.log('Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

export { createDatabaseIfNotExists };