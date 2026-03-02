const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

function setupDemoUser() {
  const db = Database('./server/database/resume_builder.db');

  // Create users table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT NOT NULL CHECK (role IN ('jobseeker', 'recruiter', 'admin')),
      is_verified BOOLEAN DEFAULT 0,
      verification_token TEXT,
      reset_token TEXT,
      reset_token_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert demo user if not exists
  const hashedPassword = bcrypt.hashSync('demo_password', 10);
  const insertStmt = db.prepare('INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)');
  insertStmt.run('demo@jobseeker.com', hashedPassword, 'Demo', 'Jobseeker', 'jobseeker', 1);

  console.log('Demo user setup complete.');
  db.close();
}

try {
  setupDemoUser();
} catch (error) {
  console.error('Error setting up demo user:', error.message);
}