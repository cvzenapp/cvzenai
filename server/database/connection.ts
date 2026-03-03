import { Client, Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

let pool: Pool | null = null;
let isConnected = false;
let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 10;

async function createPool(): Promise<void> {
  let connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error("Database connection string not found in environment variables");
  }
  
  // Clean up malformed connection strings
  if (connectionString.startsWith('DATABASE_URL=')) {
    connectionString = connectionString.replace('DATABASE_URL=', '');
    console.log("🔧 Cleaned malformed DATABASE_URL prefix");
  }
  
  // Validate connection string format
  if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
    throw new Error(`Invalid DATABASE_URL format. Expected postgresql:// or postgres://, got: ${connectionString.substring(0, 20)}...`);
  }
  
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 5,
    min: 0,
    acquireTimeoutMillis: 15000,
    createTimeoutMillis: 15000,
  });
  
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
    isConnected = false;
  });
}

async function testConnection(): Promise<boolean> {
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    return false;
  }
}

async function retryConnection(): Promise<void> {
  if (connectionRetryCount >= MAX_RETRY_ATTEMPTS) {
    console.error(`❌ Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Database will remain unavailable.`);
    return;
  }
  
  connectionRetryCount++;
  const backoffDelay = Math.min(1000 * Math.pow(2, connectionRetryCount - 1), 30000); // Max 30s
  
  console.log(`🔄 Retrying database connection (${connectionRetryCount}/${MAX_RETRY_ATTEMPTS}) in ${backoffDelay}ms...`);
  
  setTimeout(async () => {
    try {
      if (!pool) {
        await createPool();
      }
      
      const connected = await testConnection();
      if (connected) {
        isConnected = true;
        connectionRetryCount = 0;
        console.log("✅ Database connection restored");
      } else {
        await retryConnection();
      }
    } catch (error) {
      console.error(`❌ Retry attempt ${connectionRetryCount} failed:`, error.message);
      await retryConnection();
    }
  }, backoffDelay);
}

export async function initializeDatabaseBackground(): Promise<void> {
  try {
    console.log("🔄 Initializing database connection...");
    await createPool();
    
    const connected = await testConnection();
    if (connected) {
      isConnected = true;
      console.log("✅ Database connection successful");
    } else {
      console.warn("⚠️ Initial database connection failed, starting retry process...");
      await retryConnection();
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    console.log("🔄 Starting background retry process...");
    await retryConnection();
  }
}
export async function initializeDatabase(): Promise<Client> {
  if (!isConnected || !pool) {
    throw new Error("Database not available. Please try again later.");
  }
  
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    isConnected = false;
    // Trigger retry in background
    retryConnection();
    throw new Error("Database connection failed. Retrying in background.");
  }
}

export async function getDatabase(): Promise<Client | null> {
  if (!isConnected) {
    return null;
  }
  
  try {
    return await initializeDatabase();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return null;
  }
}

export async function getDatabaseSafe(): Promise<Client | null> {
  if (!isConnected) {
    return null;
  }
  
  try {
    return await initializeDatabase();
  } catch (error) {
    console.warn('⚠️ Database unavailable:', error.message);
    return null;
  }
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

// Helper function for routes to handle database unavailability
export function handleDatabaseError(res: any, error: any, fallbackMessage = "Database temporarily unavailable") {
  console.error('Database error in route:', error.message);
  return res.status(503).json({
    success: false,
    error: fallbackMessage,
    details: "Please try again in a few moments"
  });
}

export function isDatabaseConnected(): boolean {
  return isConnected;
}

// Database will be initialized when needed
