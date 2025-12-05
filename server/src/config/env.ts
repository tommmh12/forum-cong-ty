import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// In development, load .env.local as an override; otherwise use default .env
const nodeEnvRaw = process.env.NODE_ENV || 'development';
if (nodeEnvRaw === 'development') {
  // Load .env.local for development overrides
  dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
}
// Always load .env as fallback (dotenv won't override existing vars)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export interface EnvConfig {
  // Server
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  frontendUrl: string;

  // Database
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };

  // JWT
  jwt: {
    secret: string;
    expiresIn: string;
  };

  // Google OAuth
  googleClientId: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

function getEnvVarAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
}

const nodeEnv = getEnvVar('NODE_ENV', 'development') as EnvConfig['nodeEnv'];

// JWT secret handling - require in production and test, warn in development
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    if (nodeEnv === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production. Please set a strong, randomly generated secret.');
    }
    if (nodeEnv === 'test') {
      throw new Error('JWT_SECRET environment variable is required for testing. Please configure it in your test environment.');
    }
    // Development only - use default but warn
    // Note: Can't use logger here as it depends on env, use console directly
    if (nodeEnv === 'development') {
      console.warn('⚠️  WARNING: Using default JWT secret for development. This is insecure - set JWT_SECRET in .env.local for production!');
    }
    return 'default_dev_secret_do_not_use_in_production';
  }
  
  return secret;
}

// Google Client ID handling - require in production
function getGoogleClientId(): string {
  // Check for server-side env var first, then fall back to VITE_ prefix for compatibility
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    if (nodeEnv === 'production') {
      throw new Error('GOOGLE_CLIENT_ID environment variable is required in production for Google OAuth.');
    }
    console.warn('⚠️  WARNING: GOOGLE_CLIENT_ID not set. Google OAuth will not work properly.');
    return '';
  }
  
  return clientId;
}

export const env: EnvConfig = {
  // Server
  port: getEnvVarAsNumber('PORT', 3001),
  nodeEnv,
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:5173'),

  // Database
  db: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: getEnvVarAsNumber('DB_PORT', 3306),
    name: getEnvVar('DB_NAME', 'nexus_portal'),
    user: getEnvVar('DB_USER', 'root'),
    password: getEnvVar('DB_PASSWORD', ''),
  },

  // JWT
  jwt: {
    secret: getJwtSecret(),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
  },

  // Google OAuth
  googleClientId: getGoogleClientId(),
};

export default env;
