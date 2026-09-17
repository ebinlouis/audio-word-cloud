import express from 'express';
import dotenv from 'dotenv';
import analysisRoutes from './routes/analysisRoutes.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for JSON parsing
app.use(express.json());

// API Routes
app.use('/api/analyze', analysisRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Centralized Error Handling Middleware
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

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Configure server timeouts for long-running AI transcription requests (up to 3 minutes)
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
server.timeout = 180000;

export default app;
