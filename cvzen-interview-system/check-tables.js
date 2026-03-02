const { Pool } = require('pg');

async function checkTables() {
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    database: 'interview_system',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    const client = await pool.connect();
    
    // Check what tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('✅ Database tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check migrations table
    const migrations = await client.query('SELECT * FROM migrations ORDER BY id');
    console.log('\n✅ Executed migrations:');
    migrations.rows.forEach(row => {
      console.log(`  - ${row.id}: ${row.filename}`);
    });

    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();