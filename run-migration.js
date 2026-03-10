import { getDatabase } from './server/database/connection.js';
import { readFileSync } from 'fs';

async function runMigration() {
  try {
    const db = await getDatabase();
    const sql = readFileSync('./server/database/migrations/056_fix_rating_constraint.sql', 'utf8');
    
    console.log('Running migration: 056_fix_rating_constraint.sql');
    console.log('This will change rating column from INTEGER to DECIMAL(3,1)');
    await db.query(sql);
    console.log('✅ Migration completed successfully');
    console.log('Rating column now supports decimal values like 7.5, 8.2, etc.');
    
    await db.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();