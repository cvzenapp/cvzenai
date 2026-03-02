import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'better-sqlite3';
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
if (!SUPABASE_DB_URL) {
  console.error('Please set SUPABASE_DB_URL in .env with your Supabase PostgreSQL connection string');
  process.exit(1);
}
const SQLITE_DB_PATH = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace('sqlite:///', '') : 'cvzen.db';

function adaptSql(sql) {
  return sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
    .replace(/AUTOINCREMENT/g, 'SERIAL')
    .replace(/DATETIME/g, 'TIMESTAMP')
    .replace(/BLOB/g, 'BYTEA')
    .replace(/DEFAULT CURRENT_TIMESTAMP/g, 'DEFAULT CURRENT_TIMESTAMP')
    .replace(/BEGIN TRANSACTION;/g, '')
    .replace(/COMMIT;/g, '')
    .replace(/--.*$/gm, '') // Remove comments if needed
    .trim();
}

async function executeMultiStatement(client, sql) {
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  for (const stmt of statements) {
    try {
      await client.query(stmt);
    } catch (err) {
      console.error('Error executing statement:', stmt);
      throw err;
    }
  }
}

async function migrate() {
  console.log('Connecting to Supabase PostgreSQL...');
  const pgClient = new Client(SUPABASE_DB_URL);
  await pgClient.connect();

  console.log('Connecting to SQLite...');
  const sqliteDb = sqlite3(SQLITE_DB_PATH);

  try {
    // Apply initial schema
    const schemaPath = path.join(process.cwd(), 'server/database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Applying initial schema...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const adaptedSchema = adaptSql(schemaSql);
      await executeMultiStatement(pgClient, adaptedSchema);
    }

    // Apply migrations
    const migrationDir = path.join(process.cwd(), 'server/database/migrations');
    if (fs.existsSync(migrationDir)) {
      const migrations = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();
      for (const file of migrations) {
        console.log(`Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
        const adapted = adaptSql(sql);
        await executeMultiStatement(pgClient, adapted);
      }
    }

    // Get list of tables
    const tables = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);

    // Migrate data
    for (const table of tables) {
      console.log(`Migrating data for table: ${table}`);
      const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) continue;

      const columns = Object.keys(rows[0]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const insertSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

      for (const row of rows) {
        await pgClient.query(insertSql, Object.values(row));
      }

      // Set sequence if id is serial
      const hasId = columns.includes('id');
      if (hasId) {
        await pgClient.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) + 1 FROM ${table}), 1), false)`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    sqliteDb.close();
    await pgClient.end();
  }
}

migrate().catch(console.error);