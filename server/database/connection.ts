import { Client, Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

let pool: Pool | null = null;

export async function initializeDatabase(): Promise<Client> {
  // Railway and other cloud environments - use connection pooling
  if (process.env.RAILWAY_STATIC_URL || process.env.NODE_ENV === 'production' || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error("Database connection string not found in environment variables");
    }
    
    console.log("Initializing database connection...");
    console.log("Connection string format check: ✅ Valid format detected");
    
    // Clean up malformed connection strings
    if (connectionString.startsWith('DATABASE_URL=')) {
      connectionString = connectionString.replace('DATABASE_URL=', '');
      console.log("🔧 Cleaned malformed DATABASE_URL prefix");
    }
    
    // Validate connection string format
    if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
      throw new Error(`Invalid DATABASE_URL format. Expected postgresql:// or postgres://, got: ${connectionString.substring(0, 20)}...`);
    }
    
    // Create pool if it doesn't exist
    if (!pool) {
      console.log("🚀 [PRODUCTION] Creating database pool...");
      
      // Use the connection string directly instead of parsing URL
      pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 60000, // Increased to 60 seconds for cold starts
        idleTimeoutMillis: 30000,
        max: 10, // Maximum number of clients in the pool
        min: 1,  // Reduced minimum to avoid connection issues
        acquireTimeoutMillis: 60000, // Time to wait for a connection from pool
        createTimeoutMillis: 60000,  // Time to wait for new connection creation
      });
      
      pool.on('error', (err) => {
        console.error('Database pool error:', err);
      });
      
      console.log("✅ [PRODUCTION] Database pool created");
    }
    
    // Get a client from the pool with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        console.log(`🔄 Attempting database connection (${4 - retries}/3)...`);
        const client = await pool.connect();
        console.log("✅ Database connection successful");
        return client;
      } catch (error) {
        retries--;
        console.error(`❌ Database connection attempt failed. Retries left: ${retries}`);
        console.error(`   Error: ${error.message}`);
        
        // Check for specific Supabase/pooler errors
        if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
          console.error('💡 Possible causes:');
          console.error('   - Supabase project is paused (free tier)');
          console.error('   - Network connectivity issues');
          console.error('   - Incorrect connection string');
        }
        
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
      }
    }
  }

  // For local development, use connection pool as well
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error("Database connection string not found in environment variables");
    }
    
    console.log("Initializing database pool...");
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 60000, // Increased to 60 seconds for cold starts
      idleTimeoutMillis: 30000,
      max: 10,
      min: 1, // Reduced minimum
      acquireTimeoutMillis: 60000, // Time to wait for a connection from pool
      createTimeoutMillis: 60000,  // Time to wait for new connection creation
    });
    
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
    
    console.log("✅ Database pool initialized");
  }
  
  // Get a client from the pool with retry logic
  let retries = 3;
  while (retries > 0) {
    try {
      console.log(`🔄 Attempting database connection (${4 - retries}/3)...`);
      const client = await pool.connect();
      console.log("✅ Database connection successful");
      return client;
    } catch (error) {
      retries--;
      console.error(`❌ Database connection attempt failed. Retries left: ${retries}`);
      console.error(`   Error: ${error.message}`);
      
      // Check for specific Supabase/pooler errors
      if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
        console.error('💡 Possible causes:');
        console.error('   - Supabase project is paused (free tier)');
        console.error('   - Network connectivity issues');
        console.error('   - Incorrect connection string');
      }
      
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
    }
  }
}

export async function getDatabase(): Promise<Client> {
  return await initializeDatabase();
}

export async function closeDatabase(client?: Client): Promise<void> {
  if (client) {
    // Release the client back to the pool instead of ending it
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Database will be initialized when needed
