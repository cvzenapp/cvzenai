import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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

// Try multiple possible paths for the built SPA files
const possiblePaths = [
  path.join(__dirname, "../spa"),           // Standard build output
  path.join(process.cwd(), "dist/spa"),     // Docker container
  path.join(__dirname, "../../dist/spa"),   // Alternative structure
];

let distPath = possiblePaths[0]; // Default fallback

for (const testPath of possiblePaths) {
  console.log('🔍 Checking path:', testPath);
  try {
    if (fs.existsSync(testPath)) {
      console.log('✅ Found SPA files at:', testPath);
      distPath = testPath;
      break;
    }
  } catch (error) {
    console.log('❌ Error checking path:', testPath, error.message);
  }
}

console.log('  Final distPath:', distPath);
console.log('  distPath exists:', fs.existsSync(distPath));

// Serve static files
if (fs.existsSync(distPath)) {
  console.log('✅ Serving static files from:', distPath);
  app.use(express.static(distPath));
} else {
  console.error('❌ Static files directory not found:', distPath);
  console.log('📁 Available files in current directory:');
  try {
    const files = fs.readdirSync(process.cwd());
    console.log(files);
  } catch (error) {
    console.error('Error reading current directory:', error.message);
  }
}

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes or health checks
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "Endpoint not found" });
  }

  const indexPath = path.join(distPath, "index.html");
  
  if (fs.existsSync(indexPath)) {
    console.log(`📄 Serving index.html for route: ${req.path}`);
    res.sendFile(indexPath);
  } else {
    console.error('❌ index.html not found at:', indexPath);
    res.status(404).send(`
      <html>
        <body>
          <h1>Application Not Built</h1>
          <p>The frontend application has not been built yet.</p>
          <p>Expected location: ${indexPath}</p>
          <p>Please run <code>npm run build</code> to build the application.</p>
        </body>
      </html>
    `);
  }
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  const { closePool } = await import("./database/connection.js");
  await closePool();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  const { closePool } = await import("./database/connection.js");
  await closePool();
  process.exit(0);
});
