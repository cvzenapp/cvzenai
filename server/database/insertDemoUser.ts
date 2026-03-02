import { getDatabase } from './connection';
import bcrypt from 'bcryptjs';

async function insertDemoUser() {
  const db = getDatabase();
  const email = 'demo@jobseeker.com';
  const password = 'demo_password';
  const hashedPassword = await bcrypt.hash(password, 10);
  const stmt = db.prepare('INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, created_at, updated_at, email_verified) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)');
  const info = stmt.run(email, hashedPassword, 'Demo', 'User');
  if (info.changes > 0) {
    console.log('Demo user inserted successfully.');
  } else {
    console.log('Demo user already exists.');
  }
}

insertDemoUser().catch(console.error);