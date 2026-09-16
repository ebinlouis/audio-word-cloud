import express from 'express';
import analysisRoutes from './routes/analysisRoutes.js';

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
