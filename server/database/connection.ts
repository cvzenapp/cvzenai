import { Client } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

let db: Client | null = null;

export async function initializeDatabase(): Promise<Client> {
  // Railway and other cloud environments - Railway sets RAILWAY_STATIC_URL or NODE_ENV=production
  if (process.env.RAILWAY_STATIC_URL || process.env.NODE_ENV === 'production' || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error("Database connection string not found in environment variables");
    }
    
    console.log("🚀 [PRODUCTION] Connecting to database...");
    console.log("🔍 [DEBUG] Connection string:", connectionString);
    
    // Parse the connection string manually to avoid parsing issues
    const url = new URL(connectionString);
    
    const client = new Client({
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      query_timeout: 30000,
    });
    
    // Set max listeners to prevent memory leak warnings
    client.setMaxListeners(20);
    
    console.log("🔍 [DEBUG] Parsed connection:", {
      host: url.hostname,
      port: url.port,
      database: url.pathname.slice(1),
      user: url.username
    });
    
    await client.connect();
    console.log("✅ [PRODUCTION] Database connected successfully");
    return client;
  }

  // For local development, use persistent connection with better error handling
  if (db && db._connected) {
    // Test the connection before returning it
    try {
      await db.query('SELECT 1');
      return db;
    } catch (error) {
      console.warn('⚠️ Existing database connection is stale, creating new one...');
      try {
        await db.end();
      } catch (closeError) {
        // Ignore close errors
      }
      db = null;
    }
  }

  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error("Database connection string not found in environment variables");
  }
  
  console.log("Initializing database connection...", connectionString);
  db = new Client({ 
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Add connection timeout and keep-alive for local development
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  });
  
  // Set max listeners to prevent memory leak warnings
  db.setMaxListeners(20);
  
  await db.connect();
  
  // Set up error handlers to detect connection issues
  db.on('error', (err) => {
    console.error('Database connection error:', err);
    db = null; // Force reconnection on next request
  });
  
  db.on('end', () => {
    console.log('Database connection ended');
    db = null; // Force reconnection on next request
  });
  
  return db;
}

export async function getDatabase(): Promise<Client> {
  return await initializeDatabase();
}

export async function closeDatabase(client?: Client): Promise<void> {
  if (client) {
    await client.end();
  } else if (db) {
    await db.end();
    db = null;
  }
}

// Database will be initialized when needed
