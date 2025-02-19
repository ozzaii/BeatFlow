/**
 * validateEnv.ts
 * Environment configuration validation for BeatFlow
 * Ensures all required security settings are properly configured
 */

import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables
config();

// Validation schemas
const audioSchema = z.object({
  AUDIO_ENCRYPTION_KEY: z.string().min(32),
  AUDIO_PROCESSING_THREADS: z.coerce.number().min(1).max(32),
  AUDIO_BUFFER_SIZE: z.coerce.number().min(512).max(8192),
  AUDIO_SAMPLE_RATE: z.coerce.number().oneOf([44100, 48000, 96000]),
  MAX_AUDIO_FILE_SIZE: z.coerce.number().min(1000000).max(100000000),
});

const wasmSchema = z.object({
  WASM_MEMORY_PAGES: z.coerce.number().min(16).max(65536),
  WASM_SHARED_MEMORY: z.coerce.boolean(),
  WASM_SIMD_ENABLED: z.coerce.boolean(),
});

const apiSchema = z.object({
  API_URL: z.string().url(),
  API_VERSION: z.string().regex(/^v\d+$/),
  API_TIMEOUT: z.coerce.number().min(1000).max(60000),
  API_MAX_RETRIES: z.coerce.number().min(0).max(10),
  API_RATE_LIMIT: z.coerce.number().min(10).max(1000),
  API_RATE_WINDOW: z.coerce.number().min(60000).max(3600000),
});

const authSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.coerce.number().min(300).max(86400 * 7),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRY: z.coerce.number().min(86400).max(86400 * 30),
});

const securitySchema = z.object({
  ALLOWED_ORIGINS: z.string().transform(str => str.split(',')),
  CORS_MAX_AGE: z.coerce.number().min(3600).max(86400 * 7),
  CSP_REPORT_URI: z.string().startsWith('/'),
  ENABLE_RATE_LIMITING: z.coerce.boolean(),
  ENABLE_2FA: z.coerce.boolean(),
  PASSWORD_MIN_LENGTH: z.coerce.number().min(8).max(128),
  SESSION_SECRET: z.string().min(32),
});

const storageSchema = z.object({
  STORAGE_PROVIDER: z.enum(['local', 's3', 'gcs']),
  STORAGE_BUCKET: z.string(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),
}).refine(data => {
  if (data.STORAGE_PROVIDER !== 'local') {
    return !!data.STORAGE_ACCESS_KEY && !!data.STORAGE_SECRET_KEY;
  }
  return true;
}, 'Cloud storage credentials are required when not using local storage');

const aiSchema = z.object({
  AI_MODEL_PATH: z.string(),
  AI_MODEL_VERSION: z.string().regex(/^\d+\.\d+\.\d+$/),
  AI_BATCH_SIZE: z.coerce.number().min(1).max(128),
  AI_INFERENCE_TIMEOUT: z.coerce.number().min(1000).max(30000),
});

const monitoringSchema = z.object({
  SENTRY_DSN: z.string().url().optional(),
  ANALYTICS_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']),
  PERFORMANCE_MONITORING: z.coerce.boolean(),
  ERROR_REPORTING: z.coerce.boolean(),
});

const featureFlagsSchema = z.object({
  ENABLE_REALTIME_COLLAB: z.coerce.boolean(),
  ENABLE_AI_PROCESSING: z.coerce.boolean(),
  ENABLE_OFFLINE_MODE: z.coerce.boolean(),
  ENABLE_PUSH_NOTIFICATIONS: z.coerce.boolean(),
  ENABLE_AUDIO_WATERMARK: z.coerce.boolean(),
});

// Combined environment schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  APP_SECRET: z.string().min(32),
  ...audioSchema.shape,
  ...wasmSchema.shape,
  ...apiSchema.shape,
  ...authSchema.shape,
  ...securitySchema.shape,
  ...storageSchema.shape,
  ...aiSchema.shape,
  ...monitoringSchema.shape,
  ...featureFlagsSchema.shape,
});

// Validation function
export const validateEnv = (): z.infer<typeof envSchema> => {
  try {
    const env = envSchema.parse(process.env);
    
    // Additional runtime checks
    if (env.NODE_ENV === 'production') {
      if (!env.ERROR_REPORTING) {
        console.warn('Warning: Error reporting is disabled in production');
      }
      if (!env.PERFORMANCE_MONITORING) {
        console.warn('Warning: Performance monitoring is disabled in production');
      }
      if (env.STORAGE_PROVIDER === 'local') {
        throw new Error('Local storage is not allowed in production');
      }
    }

    // Security checks
    const keyStrength = (key: string) => {
      const hasUpperCase = /[A-Z]/.test(key);
      const hasLowerCase = /[a-z]/.test(key);
      const hasNumbers = /\d/.test(key);
      const hasSpecialChars = /[^A-Za-z0-9]/.test(key);
      return (hasUpperCase ? 1 : 0) + (hasLowerCase ? 1 : 0) + 
             (hasNumbers ? 1 : 0) + (hasSpecialChars ? 1 : 0);
    };

    const criticalKeys = [
      env.APP_SECRET,
      env.JWT_SECRET,
      env.REFRESH_TOKEN_SECRET,
      env.SESSION_SECRET,
      env.AUDIO_ENCRYPTION_KEY,
    ];

    criticalKeys.forEach(key => {
      if (keyStrength(key) < 3) {
        throw new Error('Critical security keys must contain at least 3 types of characters');
      }
    });

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:', JSON.stringify(error.errors, null, 2));
    }
    throw error;
  }
};

// Export validated environment
export const env = validateEnv();
export default env; 