import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
  passwordResetRedirect: process.env.PASSWORD_RESET_REDIRECT || 'http://localhost:5173/reset-password',
  jwtSecret: process.env.JWT_SECRET || 'gutech-internal-lms-jwt-token-secret-2026',
  nodeEnv: process.env.NODE_ENV || 'development',
  isSupabaseConfigured: () => {
    if (process.env.NODE_ENV === 'test') return false;
    return Boolean(
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.SUPABASE_URL.includes('your-project') &&
      !process.env.SUPABASE_URL.includes('placeholder')
    );
  }
};
