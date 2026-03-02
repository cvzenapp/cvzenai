import { Client } from 'pg';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

// Use your existing PostgreSQL connection as a temporary fix
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('Missing database connection string. Please check DATABASE_URL or SUPABASE_DB_URL environment variables.');
}

let db: Client;

export function getPostgresClient(): Client {
  if (!db) {
    db = new Client({ connectionString });
    db.connect().catch(console.error);
  }
  return db;
}

// Database service for PostgreSQL operations
export class DatabaseService {
  static async createUser(email: string, hashedPassword: string, userData: any) {
    const client = getPostgresClient();
    
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, email, first_name, last_name, created_at
    `;
    
    try {
      const result = await client.query(query, [
        email,
        hashedPassword,
        userData.first_name || '',
        userData.last_name || ''
      ]);
      
      return { user: result.rows[0] };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async getUserByEmail(email: string) {
    const client = getPostgresClient();
    
    const query = `
      SELECT id, email, password_hash, first_name, last_name, created_at
      FROM users 
      WHERE email = $1
    `;
    
    try {
      const result = await client.query(query, [email]);
      return { user: result.rows[0] || null };
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  static async getUserById(userId: string) {
    const client = getPostgresClient();
    
    const query = `
      SELECT id, email, first_name, last_name, created_at
      FROM users 
      WHERE id = $1
    `;
    
    try {
      const result = await client.query(query, [userId]);
      return { user: result.rows[0] || null };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
}

// Ensure required tables exist
export async function ensureTablesExist() {
  const client = getPostgresClient();
  
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      user_type VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  const createCompaniesTable = `
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      website VARCHAR(255),
      industry VARCHAR(100),
      size_range VARCHAR(50),
      location VARCHAR(255),
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  const createRecruitersTable = `
    CREATE TABLE IF NOT EXISTS recruiters (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      email VARCHAR(255) UNIQUE NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      job_title VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      linkedin_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  const createRecruiterProfilesTable = `
    CREATE TABLE IF NOT EXISTS recruiter_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      job_title VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      linkedin_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  const createRecruiterShortlistsTable = `
    CREATE TABLE IF NOT EXISTS recruiter_shortlists (
      id SERIAL PRIMARY KEY,
      recruiter_id INTEGER NOT NULL,
      resume_id INTEGER NOT NULL,
      share_token VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(recruiter_id, resume_id)
    );
  `;
  
  try {
    await client.query(createUsersTable);
    await client.query(createCompaniesTable);
    await client.query(createRecruitersTable);
    await client.query(createRecruiterProfilesTable);
    await client.query(createRecruiterShortlistsTable);
    console.log('✅ Database tables ensured successfully');
  } catch (error) {
    console.error('❌ Error ensuring database tables:', error);
    throw error;
  }
}

// Temporary Auth Service to replace Supabase functionality
export class TempAuthService {
  static async createUser(email: string, password: string, userData: any = {}) {
    try {
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const client = getPostgresClient();
      
      const query = `
        INSERT INTO users (email, password_hash, first_name, last_name, user_type, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id, email, first_name, last_name, user_type, created_at
      `;
      
      const result = await client.query(query, [
        email,
        hashedPassword,
        userData.first_name || '',
        userData.last_name || '',
        userData.user_type || 'user'
      ]);
      
      return { 
        user: result.rows[0],
        error: null 
      };
    } catch (error) {
      console.error('TempAuthService.createUser error:', error);
      return { 
        user: null, 
        error: { message: error instanceof Error ? error.message : 'Failed to create user' } 
      };
    }
  }
  
  static async signInWithPassword(email: string, password: string) {
    try {
      const client = getPostgresClient();
      
      const query = `
        SELECT id, email, password_hash, first_name, last_name, user_type, created_at
        FROM users 
        WHERE email = $1
      `;
      
      const result = await client.query(query, [email]);
      const user = result.rows[0];
      
      if (!user) {
        return {
          data: null,
          error: { message: 'Invalid email or password' }
        };
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        return {
          data: null,
          error: { message: 'Invalid email or password' }
        };
      }
      
      // Generate a simple token (in production, use JWT or proper session management)
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      // Remove password_hash from response
      const { password_hash, ...userWithoutPassword } = user;
      
      return {
        data: {
          user: userWithoutPassword,
          session: {
            access_token: token,
            user: userWithoutPassword
          }
        },
        error: null
      };
    } catch (error) {
      console.error('TempAuthService.signInWithPassword error:', error);
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Authentication failed' }
      };
    }
  }
}

// Create required tables
export async function createTempTables() {
  const client = getPostgresClient();
  
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      user_type VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  const createRecruiterProfilesTable = `
    CREATE TABLE IF NOT EXISTS recruiter_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      job_title VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      linkedin_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  
  try {
    await client.query(createUsersTable);
    await client.query(createRecruiterProfilesTable);
    console.log('✅ Temp tables created successfully');
  } catch (error) {
    console.error('❌ Error creating temp tables:', error);
    throw error;
  }
}

export default { getPostgresClient, DatabaseService, ensureTablesExist, TempAuthService, createTempTables };
