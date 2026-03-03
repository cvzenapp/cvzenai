import { Client, Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

let pool: Pool | null = null;

export async function initializeDatabase(): Promise<Client> {
  // Railway and other cloud environments - use connection pooling
  if (process.env.RAILWAY_STATIC_URL || process.env.NODE_ENV === 'production' || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error("Database connection string not found in environment variables");
    }
    
    // Create pool if it doesn't exist
    if (!pool) {
      console.log("🚀 [PRODUCTION] Creating database pool...");
      
      const url = new URL(connectionString);
      
      pool = new Pool({
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        database: url.pathname.slice(1),
        user: url.username,
        password: url.password,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 10, // Maximum number of clients in the pool
        min: 2,  // Minimum number of clients in the pool
      });
      
      console.log("✅ [PRODUCTION] Database pool created");
    }
    
    // Get a client from the pool
    const client = await pool.connect();
    return client;
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
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10,
      min: 2,
    });
    
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
    
    console.log("✅ Database pool initialized");
  }
  
  // Get a client from the pool
  const client = await pool.connect();
  return client;
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
