import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { AppError } from '../utils/appError.js';

// Feature 1: Login rate-limit to 5 attempts per 15 min per IP+email
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => {
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${ip}:${email}`;
  },
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests('Too many login attempts. Please try again after 15 minutes.'));
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Feature 8: Chat rate-limit to 20 messages/min/user
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || 'anonymous';
  },
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests('Chat rate limit exceeded (maximum 20 messages per minute).'));
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Feature 10: Forgot password rate-limit to 3 per hour per email
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req: Request) => {
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
    return email || req.ip || 'unknown';
  },
  handler: (_req, _res, next) => {
    next(AppError.tooManyRequests('Too many password reset requests. Please try again in an hour.'));
  },
  standardHeaders: true,
  legacyHeaders: false,
});
