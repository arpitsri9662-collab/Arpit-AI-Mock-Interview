import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db';
import config from './config';
import authRoutes from './routes/auth';
import resumeRoutes from './routes/resume';
import interviewRoutes from './routes/interview';
import videoRoutes from './routes/video';
import analyticsRoutes from './routes/analytics';
import demoRoutes from './routes/demo';
import { errorHandler } from './middleware/errorHandler';
import path from 'path';

// Handle unhandled Promise rejections
process.on('unhandledRejection', (err: any) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: any) => {
  console.error(`Uncaught Exception: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// In production, relax helmet CSP so the SPA can load its own scripts/styles
app.use(helmet({
  contentSecurityPolicy: config.nodeEnv === 'production' ? false : undefined,
}));

// CORS: allow local dev origins + any Render/custom domain
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5005',
];
app.use(cors({
  origin: config.nodeEnv === 'production'
    ? true  // allow same-origin requests in production (frontend served from same server)
    : allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

connectDB();

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/demo', demoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'AI Mock Interview Platform API is running',
    port: config.port,
    env: config.nodeEnv,
    dbConnected: !!(require('mongoose').connection.readyState === 1)
  });
});

// ---- Serve Frontend in Production ----
// After npm run build, frontend/dist contains the Vite-built SPA.
// The backend serves it as static files so both run on a single Render service.
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');

if (config.nodeEnv === 'production') {
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(frontendDistPath));

  // SPA catch-all: any non-API route returns index.html so React Router works
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
  if (config.nodeEnv === 'production') {
    console.log(`Serving frontend from: ${frontendDistPath}`);
  }
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} is already in use.`);
    console.error(`Please kill the process using port ${config.port} or change the PORT in your .env file.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

export default app;