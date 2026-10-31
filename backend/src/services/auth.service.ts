import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/appError.js';
import { UserProfile } from '../repositories/types.js';

export class AuthService {
  async login(email: string, passwordAttempt: string) {
    const user = await userRepository.verifyCredentials(email, passwordAttempt);
    // Generic error per spec: "Invalid email or password" (never reveal which part was wrong)
    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(403, 'FORBIDDEN', 'Your account has been deactivated. Please contact an administrator.');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ ...payload, isRefresh: true }, config.jwtSecret, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      profile: user,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(refreshToken, config.jwtSecret);
      if (!decoded || !decoded.id) {
        throw AppError.unauthorized('Invalid refresh token');
      }

      const user = await userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        throw AppError.unauthorized('User not found or inactive');
      }

      const newAccessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      return { accessToken: newAccessToken, profile: user };
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string) {
    const normalized = email.toLowerCase().trim();
    // Rule: never reveal whether an email exists; always return 200 with the same message
    const user = await userRepository.findByEmail(normalized);
    let resetToken = '';
    if (user && user.isActive) {
      resetToken = jwt.sign({ id: user.id, email: user.email, purpose: 'reset' }, config.jwtSecret, { expiresIn: '1h' });
    }
    return {
      message: 'If the email is registered with GUtech LMS, you will receive password reset instructions.',
      // In dev mode, provide token for testing convenience
      token: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded: any = jwt.verify(token, config.jwtSecret);
      if (!decoded || !decoded.id || decoded.purpose !== 'reset') {
        throw AppError.badRequest('Invalid or expired reset token');
      }

      const user = await userRepository.findById(decoded.id);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      const success = await userRepository.updatePassword(user.email, newPassword);
      if (!success) {
        throw AppError.internal('Failed to update password');
      }

      return { message: 'Password reset successfully. You may now log in.' };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw AppError.badRequest('Expired or invalid reset token. Please request a new link.');
    }
  }

  async changePassword(userId: string, currentPasswordAttempt: string, newPassword: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    const verified = await userRepository.verifyCredentials(user.email, currentPasswordAttempt);
    if (!verified) {
      throw AppError.badRequest('Incorrect current password');
    }

    const success = await userRepository.updatePassword(user.email, newPassword);
    if (!success) {
      throw AppError.internal('Failed to update password');
    }

    return { message: 'Password updated successfully' };
  }

  async getMe(userId: string): Promise<UserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, fullName: string): Promise<UserProfile> {
    const updated = await userRepository.updateUser(userId, { fullName });
    if (!updated) {
      throw AppError.notFound('User not found');
    }
    return updated;
  }
}

export const authService = new AuthService();
