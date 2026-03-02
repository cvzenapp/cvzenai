import fs from 'fs';
import path from 'path';
import { connectDatabase, getDatabase, closeDatabase } from './connection';
import { logger } from '../utils/logger';

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

async function createMigrationsTable(): Promise<void> {
  const db = await getDatabase();
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations(): Promise<string[]> {
  const db = await getDatabase();
  const result = await db.query('SELECT id FROM migrations ORDER BY id');
  return result.rows.map(row => row.id);
}

async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  const migrations: Migration[] = [];
  
  for (const file of files) {
    const id = file.replace('.sql', '');
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    migrations.push({
      id,
      filename: file,
      sql
    });
  }
  
  return migrations;
}

async function executeMigration(migration: Migration): Promise<void> {
  const db = await getDatabase();
  
  try {
    // Execute migration SQL
    await db.query(migration.sql);
    
    // Record migration as executed
    await db.query(
      'INSERT INTO migrations (id, filename) VALUES ($1, $2)',
      [migration.id, migration.filename]
    );
    
    logger.info(`Migration executed: ${migration.filename}`);
  } catch (error) {
    logger.error(`Migration failed: ${migration.filename}`, error as Error);
    throw error;
  }
}

export async function runMigrations(): Promise<void> {
  try {
    await connectDatabase();
    await createMigrationsTable();
    
    const executedMigrations = await getExecutedMigrations();
    const allMigrations = await loadMigrations();
    
    const pendingMigrations = allMigrations.filter(
      migration => !executedMigrations.includes(migration.id)
    );
    
    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }
    
    logger.info(`Executing ${pendingMigrations.length} pending migrations`);
    
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration process failed:', error as Error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}