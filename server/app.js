import express from 'express';
import dotenv from 'dotenv';
import analysisRoutes from './routes/analysisRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use('/api/analyze', analysisRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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
