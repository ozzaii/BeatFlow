/**
 * security.ts
 * Comprehensive security configuration for BeatFlow
 * Handles encryption, authentication, and data protection
 */

import { AES, enc } from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';

// Security Constants
const ENCRYPTION_KEY_LENGTH = 256;
const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '24h';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Audio Processing Security
export const AudioSecurity = {
  // Secure audio buffer transfer
  encryptAudioBuffer: (buffer: ArrayBuffer): string => {
    const wordArray = enc.Utf8.parse(Buffer.from(buffer).toString('base64'));
    return AES.encrypt(wordArray, process.env.AUDIO_ENCRYPTION_KEY || '').toString();
  },

  decryptAudioBuffer: (encrypted: string): ArrayBuffer => {
    const decrypted = AES.decrypt(encrypted, process.env.AUDIO_ENCRYPTION_KEY || '');
    const base64 = decrypted.toString(enc.Utf8);
    return Buffer.from(base64, 'base64');
  },

  // Audio watermarking
  addWatermark: (buffer: ArrayBuffer, userId: string): ArrayBuffer => {
    const watermark = {
      userId,
      timestamp: Date.now(),
      signature: uuidv4()
    };
    // Implement steganography here
    return buffer; // Placeholder
  },

  verifyWatermark: (buffer: ArrayBuffer): boolean => {
    // Implement watermark verification
    return true; // Placeholder
  }
};

// WebAssembly Security
export const WasmSecurity = {
  validateWasmModule: (moduleBytes: ArrayBuffer): boolean => {
    // Implement WASM validation
    return true; // Placeholder
  },

  secureWasmMemory: (memory: WebAssembly.Memory): void => {
    // Implement memory protection
  }
};

// Worker Security
export const WorkerSecurity = {
  validateMessageOrigin: (origin: string): boolean => {
    return origin === window.location.origin;
  },

  sanitizeWorkerMessage: (message: any): any => {
    // Implement message sanitization
    return message;
  }
};

// Data Protection
export const DataProtection = {
  sanitizeUserInput: (input: string): string => {
    // Implement input sanitization
    return input.replace(/<[^>]*>/g, '');
  },

  hashSensitiveData: (data: string): string => {
    // Implement data hashing
    return AES.encrypt(data, process.env.DATA_ENCRYPTION_KEY || '').toString();
  },

  maskSensitiveData: (data: string): string => {
    return data.replace(/\w(?=\w{4})/g, '*');
  }
};

// API Security
export const ApiSecurity = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },

  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
};

// Session Security
export const SessionSecurity = {
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },

  jwt: {
    expiresIn: TOKEN_EXPIRY,
    algorithm: 'HS256'
  }
};

// Content Security Policy
export const CSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'blob:'],
    mediaSrc: ["'self'", 'data:', 'blob:'],
    connectSrc: ["'self'"],
    workerSrc: ["'self'", 'blob:'],
    childSrc: ["'self'", 'blob:'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    manifestSrc: ["'self'"]
  }
};

// Export security configuration
export const SecurityConfig = {
  AudioSecurity,
  WasmSecurity,
  WorkerSecurity,
  DataProtection,
  ApiSecurity,
  SessionSecurity,
  CSP
};

export default SecurityConfig; 