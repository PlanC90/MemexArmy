import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = 'data';

// Enable CORS
app.use(cors());

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR);
  }
}

// Initialize data file if it doesn't exist
async function initializeDataFile(filename, defaultContent) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
  }
}

// Initialize all data files
async function initializeDataFiles() {
  await ensureDataDir();
  
  const defaultFiles = {
    'users.json': { users: [] },
    'links.json': { links: [] },
    'admin.json': { admins: [], settings: { taskReward: 10000, supportReward: 5000 } },
    'cekim.json': { withdrawals: [] }
  };

  for (const [filename, content] of Object.entries(defaultFiles)) {
    await initializeDataFile(filename, content);
  }
}

async function startServer() {
  // Initialize data files
  await initializeDataFiles();

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);
  
  app.use(express.static('public'));
  app.use(bodyParser.json());

  // Data file endpoints
  app.get('/data/:filename', async (req, res) => {
    try {
      const filePath = path.join(DATA_DIR, req.params.filename);
      const data = await fs.readFile(filePath, 'utf-8');
      res.json(JSON.parse(data));
    } catch (error) {
      console.error(`Error reading ${req.params.filename}:`, error);
      res.status(404).json({ error: 'File not found' });
    }
  });

  app.put('/data/:filename', async (req, res) => {
    try {
      const filePath = path.join(DATA_DIR, req.params.filename);
      await fs.writeFile(filePath, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      console.error(`Error writing ${req.params.filename}:`, error);
      res.status(500).json({ success: false, error: 'Failed to write file' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  });

  // Serve index.html for all routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
