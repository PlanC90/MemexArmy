import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'handle-json-writes',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.method === 'PUT' && req.url?.startsWith('/data/')) {
            const filename = req.url.replace('/data/', '');
            const filePath = path.join('data', filename);
            
            // Read the request body
            let body = '';
            for await (const chunk of req) {
              body += chunk;
            }

            try {
              await fs.promises.writeFile(filePath, body);
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              console.error(`Error writing to ${filename}:`, error);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: 'Failed to write file' }));
            }
            return;
          }
          next();
        });
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
