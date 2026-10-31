import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../schemas/auth.schemas.js';
import {
  loginRateLimiter,
  forgotPasswordRateLimiter,
} from '../middleware/rateLimit.js';

export const authRoutes = Router();

authRoutes.post('/login', loginRateLimiter, validateBody(loginSchema), authController.login);
authRoutes.post('/logout', requireAuth, authController.logout);
authRoutes.post('/refresh', authController.refresh);
authRoutes.get('/me', requireAuth, authController.getMe);
authRoutes.patch('/profile', requireAuth, validateBody(updateProfileSchema), authController.updateProfile);
authRoutes.post('/forgot-password', forgotPasswordRateLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
authRoutes.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);
authRoutes.post('/change-password', requireAuth, validateBody(changePasswordSchema), authController.changePassword);
