import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import { connectMongo } from './config/mongo.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import studyPlanRoutes from './routes/studyPlanRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(cors());
app.use(express.json());

// Connect to MongoDB (non-fatal if offline during tests)
connectMongo().catch((err) => {
  console.warn(`⚠️ MongoDB initial connection notice: ${err.message}`);
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Planora API is running successfully',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Planora Backend API',
    version: '1.0.0',
    healthCheck: '/api/health',
    endpoints: {
      auth: '/api/auth',
      subjects: '/api/subjects',
      tasks: '/api/tasks',
      ai: '/api/ai',
      studyPlans: '/api/study-plans',
    },
  });
});

// Route Mount Points
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/study-plans', studyPlanRoutes);

// Error Handling Middlewares (MUST be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server only when executed directly (node server.js)
if (process.argv[1] && (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1].endsWith('server.js'))) {
  app.listen(PORT, () => {
    console.log(`🚀 Planora backend running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
