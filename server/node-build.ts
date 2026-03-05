import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get proper directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (two levels up from dist/server)
const envPath = path.resolve(__dirname, '../.env');
console.log('🔍 Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('⚠️  Warning: Could not load .env file:', result.error.message);
  console.log('🔍 Trying alternative path...');
  // Try loading from current directory as fallback
  dotenv.config();
} else {
  console.log('✅ Environment variables loaded successfully');
  console.log('🔍 DATABASE_URL present:', !!process.env.DATABASE_URL);
  console.log('🔍 GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
}

import { createServer } from "./index";
import express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
console.log('🔍 Debug path info:');
console.log('  import.meta.url:', import.meta.url);
console.log('  __filename:', __filename);
console.log('  __dirname:', __dirname);

const distPath = path.join(__dirname, "../spa");
console.log('  distPath:', distPath);

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  const { closeDatabase } = await import("./database/connection.js");
  await closeDatabase();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  const { closeDatabase } = await import("./database/connection.js");
  await closeDatabase();
  process.exit(0);
});
