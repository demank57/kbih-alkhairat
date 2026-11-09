import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_STATE } from './src/initialData';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure JSON and URL-encoded body limits for high-res base64 image uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Ensure uploads directory exists on the machine
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  const dbFilePath = path.join(process.cwd(), 'kbih_data.json');

  // Load backend database from disk or seed it with INITIAL_STATE
  let dbState: any = null;

  const loadDatabase = () => {
    if (fs.existsSync(dbFilePath)) {
      try {
        const raw = fs.readFileSync(dbFilePath, 'utf8');
        dbState = JSON.parse(raw);
        console.log('Database loaded successfully from', dbFilePath);
      } catch (err) {
        console.error('Failed to parse database file on disk, backup may be needed:', err);
      }
    }

    if (!dbState) {
      console.log('No local database found or failed to parse. Initializing with default data...');
      dbState = INITIAL_STATE;
      // Save the initialized state
      fs.writeFileSync(dbFilePath, JSON.stringify(dbState, null, 2), 'utf8');
    }
  };

  loadDatabase();

  // API endpoints
  app.get('/api/data', (req, res) => {
    try {
      res.json(dbState);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/data', (req, res) => {
    try {
      dbState = req.body;
      fs.writeFileSync(dbFilePath, JSON.stringify(dbState, null, 2), 'utf8');
      res.json({ success: true, message: 'Data successfully synchronized to local disk!' });
    } catch (err: any) {
      console.error('Error saving database:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/upload', (req, res) => {
    try {
      const { fileName, base64 } = req.body;
      if (!fileName || !base64) {
        return res.status(400).json({ error: 'Missing fileName or base64 payload' });
      }

      // Convert base64 to binary
      const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Sanitize filename to avoid folder traversals
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
      const finalFileName = `${Date.now()}_${cleanFileName}`;
      const filePath = path.join(uploadsDir, finalFileName);

      fs.writeFileSync(filePath, buffer);
      console.log(`Saved local upload: ${finalFileName}`);
      res.json({ url: `/uploads/${finalFileName}` });
    } catch (err: any) {
      console.error('Error saving upload locally:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite Integration for development vs production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`To run locally, navigate or direct tools to http://localhost:${PORT}`);
  });
}

startServer();
