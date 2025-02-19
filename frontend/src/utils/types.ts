/**
 * types.ts
 * Type definitions for BeatFlow security and monitoring systems
 */

// Security Types
export interface SecurityConfig {
  encryption: EncryptionConfig;
  authentication: AuthConfig;
  monitoring: MonitoringConfig;
  worker: WorkerConfig;
  wasm: WasmConfig;
}

export interface EncryptionConfig {
  algorithm: 'AES-GCM' | 'AES-CBC';
  keyLength: 128 | 256;
  ivLength: number;
  saltLength: number;
}

export interface AuthConfig {
  tokenExpiry: number;
  refreshTokenExpiry: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  require2FA: boolean;
}

export interface MonitoringConfig {
  performanceEnabled: boolean;
  errorReportingEnabled: boolean;
  analyticsEnabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface WorkerConfig {
  maxWorkers: number;
  taskTimeout: number;
  memoryLimit: number;
  enableSharedArrayBuffer: boolean;
}

export interface WasmConfig {
  memoryPages: number;
  enableSIMD: boolean;
  enableThreads: boolean;
  enableBulkMemory: boolean;
}

// Audio Processing Types
export interface AudioProcessingOptions {
  quality: 'low' | 'medium' | 'high';
  enableAI: boolean;
  applyWatermark: boolean;
  format: AudioFormat;
  effects: AudioEffect[];
}

export interface AudioFormat {
  sampleRate: 44100 | 48000 | 96000;
  bitDepth: 16 | 24 | 32;
  channels: 1 | 2;
  codec: 'wav' | 'mp3' | 'aac' | 'ogg';
}

export interface AudioEffect {
  type: 'reverb' | 'delay' | 'compression' | 'eq' | 'limiter';
  params: Record<string, number>;
  bypass: boolean;
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  audio: AudioMetrics;
  wasm: WasmMetrics;
  worker: WorkerMetrics;
  memory: MemoryMetrics;
  network: NetworkMetrics;
}

export interface AudioMetrics {
  processingTime: number;
  bufferUnderruns: number;
  latency: number;
  quality: number;
}

export interface WasmMetrics {
  compilationTime: number;
  executionTime: number;
  memoryUsage: number;
  simdUtilization: number;
}

export interface WorkerMetrics {
  activeWorkers: number;
  queueLength: number;
  avgProcessingTime: number;
  errors: number;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

export interface NetworkMetrics {
  rtt: number;
  bandwidth: number;
  packetLoss: number;
  connectionType: string;
}

// Error Handling Types
export interface ErrorDetails {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: number;
  context: Record<string, any>;
  stack?: string;
}

export enum ErrorCategory {
  SECURITY = 'SECURITY',
  AUDIO = 'AUDIO',
  WASM = 'WASM',
  WORKER = 'WORKER',
  NETWORK = 'NETWORK',
  STORAGE = 'STORAGE',
  VALIDATION = 'VALIDATION',
  SYSTEM = 'SYSTEM'
}

export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO'
}

// Initialization Types
export interface InitializationStatus {
  state: InitState;
  progress: number;
  errors: ErrorDetails[];
  systems: SystemStatus;
}

export enum InitState {
  PENDING = 'PENDING',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface SystemStatus {
  security: boolean;
  audio: boolean;
  wasm: boolean;
  worker: boolean;
  monitoring: boolean;
}

// Export type utilities
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends object ? Immutable<T[P]> : T[P];
}; 