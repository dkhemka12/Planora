import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Planora API is running successfully',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Planora Backend API',
    version: '1.0.0',
    healthCheck: '/api/health'
  });
});

// Route mount points (will be wired up in respective phases)
// app.use('/api/auth', authRoutes);
// app.use('/api/subjects', subjectRoutes);
// app.use('/api/tasks', taskRoutes);
// app.use('/api/ai', aiRoutes);
// app.use('/api/study-plans', studyPlanRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Planora backend running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
