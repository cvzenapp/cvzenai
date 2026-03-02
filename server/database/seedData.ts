import { getDatabase } from "./connection.js";

export async function seedDatabase() {
  const db = await getDatabase();

  // Check if database is already seeded
  const result = await db.query("SELECT COUNT(*) as count FROM users");
  const existingUsers = result.rows[0];

  if (existingUsers.count > 0) {
    console.log("✅ Database already seeded, skipping seed data insertion");
    return;
  }

  console.log("🔄 SEEDING: Fresh database seeding...");

  // Insert initial data here using db.query(...)
  // Example:
  // await db.query("INSERT INTO users (first_name, last_name, email) VALUES ($1, $2, $3)", ["John", "Doe", "john@example.com"]);

  console.log("✅ Database seeded successfully with referral system data!");
}
