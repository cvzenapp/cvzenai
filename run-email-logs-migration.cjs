// Script to run the email_logs migration
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('✅ Connected to database successfully');

        // Read the migration file
        const migrationSQL = fs.readFileSync('server/database/migrations/053_email_logs.sql', 'utf8');
        
        console.log('📝 Running email_logs migration...');
        
        // Execute the migration
        await client.query(migrationSQL);
        
        console.log('✅ Email logs migration completed successfully');
        
        // Verify the table was created
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'email_logs' AND table_schema = 'public'
        `);
        
        if (tableCheck.rows.length > 0) {
            console.log('✅ email_logs table exists and is ready');
        } else {
            console.log('❌ email_logs table was not created');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await client.end();
    }
}

runMigration();