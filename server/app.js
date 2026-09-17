import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import analysisRoutes from './routes/analysisRoutes.js';
import analysesRoutes from './routes/analysesRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const clientDistPath = path.resolve(__dirname, '../client/dist');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(express.json());

app.use('/api/analyze', analysisRoutes);
app.use('/api/analyses', analysesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message || err);
  const status = err.status || 500;
  const code = err.code || 'ANALYSIS_FAILED';
  const message = err.message || 'Something went wrong while analyzing the audio.';
  res.status(status).json({
    error: message,
    code: code
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
server.timeout = 180000;

export default app;
