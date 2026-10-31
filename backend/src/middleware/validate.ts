import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/appError.js';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        const primaryMessage = err.errors[0]?.message || 'Validation failed';
        return next(new AppError(422, 'UNPROCESSABLE_ENTITY', primaryMessage, details));
      }
      next(err);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        const primaryMessage = err.errors[0]?.message || 'Invalid query parameters';
        return next(new AppError(422, 'UNPROCESSABLE_ENTITY', primaryMessage, details));
      }
      next(err);
    }
  };
};
