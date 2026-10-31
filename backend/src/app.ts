import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/appError.js';

export const app = express();

// Security headers
app.use(helmet());

// Strict CORS to CLIENT_ORIGIN per spec
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching origin
      const isLocalDevOrigin =
        config.nodeEnv !== 'production' && !!origin && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (!origin || origin === config.clientOrigin || origin === 'http://localhost:5173' || isLocalDevOrigin) {
        callback(null, true);
      } else {
        callback(new AppError(403, 'FORBIDDEN', 'CORS policy does not allow access from this origin'));
      }
    },
    credentials: true,
  })
);

// Body size limit 1 MB per spec
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Request logging (skip during test run to keep output clean)
if (process.env.NODE_ENV !== 'test') {
  const pinoMiddleware = (pinoHttp as any).default || pinoHttp;
  app.use(pinoMiddleware({ logger }));
}

// API Routes
app.use('/api', apiRouter);

// Explicit 404 handler for unmatched routes
app.use((_req, _res, next) => {
  next(AppError.notFound('Endpoint not found'));
});

// Centralized error handler
app.use(errorHandler);
