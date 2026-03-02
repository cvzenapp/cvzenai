import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: __dirname,
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward the original host in x-forwarded-host header
            proxyReq.setHeader('x-forwarded-host', req.headers.host);
            proxyReq.setHeader('x-forwarded-proto', req.protocol || 'http');
          });
        }
      }
    }
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-tabs', '@radix-ui/react-dialog'],
          'pdf-vendor': ['jspdf', 'html2canvas'],
          // Template chunks
           'templates': [
           ]
        }
      }
    },
    chunkSizeWarningLimit: 5000
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

// Removed expressPlugin - now using proxy to separate Express server
