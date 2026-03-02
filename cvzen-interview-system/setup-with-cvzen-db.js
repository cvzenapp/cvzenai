const { Pool } = require('pg');

async function setupInterviewTables() {
  // Use the same connection as CVZen
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    database: 'cvzen', // Same database as CVZen
    user: 'postgres',
    password: 'postgres',
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to CVZen database');

    // Test if we can connect and query
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0].now);

    // Check if interview tables already exist
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'interview_%'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Interview tables already exist:', tableCheck.rows.map(r => r.table_name));
    } else {
      console.log('ℹ️  No interview tables found. Run migrations to create them.');
    }

    client.release();
    console.log('✅ Setup completed successfully');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔧 Password authentication failed. Try these solutions:');
      console.log('1. Check if PostgreSQL is running');
      console.log('2. Verify the password in .env file');
      console.log('3. Check PostgreSQL configuration (pg_hba.conf)');
      console.log('4. Try connecting with psql: psql -U postgres -d cvzen');
    }
  } finally {
    await pool.end();
  }
}

setupInterviewTables();