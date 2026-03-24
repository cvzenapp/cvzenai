import { Client } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

let db: Client | null = null;

export async function initializeDatabase(): Promise<Client> {
  // In serverless environments, create a new connection each time
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!connectionString) {
      throw new Error("Database connection string not found in environment variables");
    }

    const testClient = new Client({ connectionString });
    await testClient.connect();
    console.log('Direct connect OK');
    await testClient.end();

    const client = new Client({
      connectionString,
      // Add connection timeout for serverless
      connectionTimeoutMillis: 5000,
      query_timeout: 10000,
      // SSL configuration for production databases
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    await client.connect();
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

  console.log("Initializing database connection...");
  db = new Client({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Add connection timeout and keep-alive for local development
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  });

  try {
    await db.connect();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    db = null;
    throw error;
  }

  // Set up error handlers to detect connection issues
  if (db) {
    db.on('error', (err) => {
      console.error('Database connection error:', err);
      db = null; // Force reconnection on next request
    });

    db.on('end', () => {
      console.log('Database connection ended');
      db = null; // Force reconnection on next request
    });
  }

  return db;
}

export async function getDatabase(): Promise<Client> {
  try {
    return await initializeDatabase();
  } catch (error) {
    console.error('❌ Failed to get database connection:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
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
