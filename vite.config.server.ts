import { defineConfig } from "vite";
import path from "path";

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build.ts"),
      name: "server",
      fileName: "node-build",
      formats: ["es"],
    },
    outDir: "dist/server",
    target: "node18",
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs", "fs/promises", "path", "url", "http", "https", "os", "crypto",
        "stream", "util", "events", "buffer", "querystring", "child_process",
        "net", "tls", "zlib", "dns", "cluster", "worker_threads",
        // External dependencies that should not be bundled
        "express", "cors", "bcrypt", "bcryptjs", "jsonwebtoken", "dotenv",
        "better-sqlite3", "sqlite3", "pg", "@supabase/supabase-js",
        "stripe", "node-fetch", "serverless-http",
        // All node_modules should be external for server builds
        /^node:.*/,
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    minify: false, // Keep readable for debugging
    sourcemap: false, // Disable sourcemaps for faster builds
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
