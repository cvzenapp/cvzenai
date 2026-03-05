// Simple test to verify catch-all route works
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Simulate the same path resolution logic
const possiblePaths = [
  path.join(__dirname, "dist/spa"),
  path.join(process.cwd(), "dist/spa"),
  path.join(__dirname, "../dist/spa"),
];

let distPath = possiblePaths[0];

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

console.log('Final distPath:', distPath);

// Serve static files
if (fs.existsSync(distPath)) {
  console.log('✅ Serving static files from:', distPath);
  app.use(express.static(distPath));
} else {
  console.error('❌ Static files directory not found:', distPath);
}

// Add some API routes for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API works!' });
});

// Catch-all route
app.get("*", (req, res) => {
  console.log(`📄 Catch-all triggered for: ${req.path}`);
  
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
        </body>
      </html>
    `);
  }
});

const port = 3002;
app.listen(port, () => {
  console.log(`🚀 Test server running on port ${port}`);
  console.log(`Test routes:`);
  console.log(`  http://localhost:${port}/`);
  console.log(`  http://localhost:${port}/some-route`);
  console.log(`  http://localhost:${port}/api/test`);
});