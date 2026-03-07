import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    // Import database connection
    const { getDatabase } = await import('./server/database/connection.ts');
    const db = await getDatabase();
    
    // Read migration SQL
    const migrationSQL = readFileSync(join(__dirname, 'generate-missing-share-tokens.sql'), 'utf8');
    
    console.log('🔄 Running migration to generate missing shareTokens...');
    
    // Execute migration
    await db.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Check results
    const result = await db.query(`
      SELECT COUNT(*) as total_resumes,
             COUNT(rs.share_token) as resumes_with_tokens
      FROM resumes r
      LEFT JOIN resume_shares rs ON r.id = rs.resume_id
    `);
    
    console.log('📊 Results:', result.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();