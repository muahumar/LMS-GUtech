import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/appError.js';
import { UserRole } from '../repositories/types.js';

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(AppError.unauthorized('Authentication required'));
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (jwtErr) {
      return next(AppError.unauthorized('Invalid or expired token'));
    }

    if (!decoded || !decoded.id) {
      return next(AppError.unauthorized('Invalid token payload'));
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return next(AppError.unauthorized('User not found'));
    }

    // Spec Rule 4: A user with profiles.is_active = false is rejected even with a valid token
    if (!user.isActive) {
      return next(new AppError(403, 'FORBIDDEN', 'User account is deactivated'));
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(`Requires one of roles: ${roles.join(', ')}`));
    }

    next();
  };
};
