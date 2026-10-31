import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // Handle Multer upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 422, 'UNPROCESSABLE_ENTITY', 'File size exceeds maximum allowed limit');
  }

  logger.error({ err }, 'Unhandled exception caught in errorHandler');

  return sendError(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message || 'Internal server error'
  );
};
