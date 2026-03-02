/**
 * Script to apply subscription and payment history migrations
 * Run with: node scripts/apply-subscription-migrations.js
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function applyMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting subscription migrations...\n');

    // Migration files to apply
    const migrations = [
      '051_subscription_system.sql',
      '053_payment_history_invoices.sql'
    ];

    for (const migrationFile of migrations) {
      const filePath = path.join(__dirname, '..', 'server', 'database', 'migrations', migrationFile);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Migration file not found: ${migrationFile}`);
        continue;
      }

      console.log(`📄 Applying ${migrationFile}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await client.query(sql);
      console.log(`✅ ${migrationFile} applied successfully\n`);
    }

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tables = [
      'subscription_plans',
      'company_subscriptions',
      'user_subscriptions',
      'subscription_usage',
      'subscription_history',
      'payment_history',
      'invoices'
    ];

    for (const table of tables) {
      const result = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        )`,
        [table]
      );
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' NOT found`);
      }
    }

    // Check if default plans exist
    console.log('\n🔍 Checking subscription plans...');
    const plansResult = await client.query('SELECT name, display_name, user_type FROM subscription_plans');
    
    if (plansResult.rows.length > 0) {
      console.log(`✅ Found ${plansResult.rows.length} subscription plans:`);
      plansResult.rows.forEach(plan => {
        console.log(`   - ${plan.display_name} (${plan.name}) for ${plan.user_type}s`);
      });
    } else {
      console.log('⚠️  No subscription plans found');
    }

    console.log('\n✅ All migrations applied successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
applyMigrations()
  .then(() => {
    console.log('\n🎉 Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
