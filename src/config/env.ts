import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  API_PREFIX: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GEMINI_API_KEY?: string;
  JINA_API_KEY?: string;
  SCRAPER_CRON_SCHEDULE?: string;
  SCRAPER_TIMEZONE?: string;
  MAKE_WEBHOOK_URL?: string;
  MAKE_WEBHOOK_ID?: string;
  UPLOAD_DIR?: string;
  BASE_URL?: string;
  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET_DOCUMENTS?: string;
  AWS_S3_BUCKET_PROFILES?: string;
  AWS_S3_BUCKET_CERTIFICATES?: string;
  AWS_S3_ENDPOINT?: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

export const env: EnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: getEnvNumber('PORT', 8080),
  HOST: getEnvVar('HOST', 'localhost'),
  API_PREFIX: getEnvVar('API_PREFIX', '/api/v1'),
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', '*'),
  RATE_LIMIT_WINDOW_MS: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
  RATE_LIMIT_MAX_REQUESTS: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info'),
  DB_HOST: getEnvVar('DB_HOST', 'localhost'),
  DB_PORT: getEnvNumber('DB_PORT', 5432),
  DB_NAME: getEnvVar('DB_NAME', 'buildsewa'),
  DB_USER: getEnvVar('DB_USER', 'postgres'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD', 'postgres'),
  JWT_SECRET: getEnvVar('JWT_SECRET', 'your-secret-key-change-in-production'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  JINA_API_KEY: process.env.JINA_API_KEY,
  SCRAPER_CRON_SCHEDULE: process.env.SCRAPER_CRON_SCHEDULE,
  SCRAPER_TIMEZONE: process.env.SCRAPER_TIMEZONE,
  MAKE_WEBHOOK_URL: process.env.MAKE_WEBHOOK_URL,
  MAKE_WEBHOOK_ID: process.env.MAKE_WEBHOOK_ID,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  BASE_URL: process.env.BASE_URL,
  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_S3_BUCKET_DOCUMENTS: process.env.AWS_S3_BUCKET_DOCUMENTS || 'buildsewa-documents',
  AWS_S3_BUCKET_PROFILES: process.env.AWS_S3_BUCKET_PROFILES || 'buildsewa-profiles',
  AWS_S3_BUCKET_CERTIFICATES: process.env.AWS_S3_BUCKET_CERTIFICATES || 'buildsewa-certificates',
  AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
};

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
