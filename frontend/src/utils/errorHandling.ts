/**
 * errorHandling.ts
 * Secure error handling and monitoring utility for BeatFlow
 * Implements error tracking, sanitization, and reporting
 */

import { env } from '../config/validateEnv';
import { DataProtection } from '../config/security';
import * as Sentry from '@sentry/browser';
import { Severity } from '@sentry/types';

// Initialize Sentry if configured
if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    enabled: env.ERROR_REPORTING,
    tracesSampleRate: 1.0,
    maxBreadcrumbs: 50,
    beforeSend: (event) => sanitizeErrorEvent(event)
  });
}

// Error Categories
export enum ErrorCategory {
  SECURITY = 'SECURITY',
  AUDIO_PROCESSING = 'AUDIO_PROCESSING',
  WASM = 'WASM',
  WORKER = 'WORKER',
  API = 'API',
  AUTHENTICATION = 'AUTHENTICATION',
  STORAGE = 'STORAGE',
  PERFORMANCE = 'PERFORMANCE',
  VALIDATION = 'VALIDATION'
}

// Error Severity Levels
export enum ErrorSeverity {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// Error Interface
interface SecureError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

// Create secure error class
export class SecureError extends Error implements SecureError {
  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'SecureError';
    this.category = category;
    this.severity = severity;
    this.metadata = metadata;
    this.timestamp = Date.now();
  }
}

// Error Handler Class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: SecureError[] = [];
  private readonly maxLogSize = 1000;

  private constructor() {
    // Private constructor for singleton
    window.onerror = this.handleGlobalError.bind(this);
    window.onunhandledrejection = this.handleUnhandledRejection.bind(this);
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log a secure error
   */
  public handleError(error: SecureError): void {
    try {
      // Sanitize error data
      const sanitizedError = this.sanitizeError(error);

      // Log locally
      this.logError(sanitizedError);

      // Report to monitoring service if enabled
      if (env.ERROR_REPORTING && error.severity !== ErrorSeverity.INFO) {
        this.reportError(sanitizedError);
      }

      // Handle critical errors
      if (error.severity === ErrorSeverity.CRITICAL) {
        this.handleCriticalError(sanitizedError);
      }
    } catch (e) {
      console.error('Error in error handler:', e);
    }
  }

  /**
   * Sanitize error data
   */
  private sanitizeError(error: SecureError): SecureError {
    return {
      ...error,
      message: DataProtection.sanitizeUserInput(error.message),
      metadata: error.metadata ? this.sanitizeMetadata(error.metadata) : undefined
    };
  }

  /**
   * Sanitize error metadata
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') {
        sanitized[key] = DataProtection.sanitizeUserInput(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Log error locally
   */
  private logError(error: SecureError): void {
    this.errorLog.push(error);
    
    // Maintain max log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (env.NODE_ENV === 'development') {
      console.error(
        `[${error.category}][${error.severity}] ${error.message}`,
        error.metadata
      );
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportError(error: SecureError): void {
    if (env.SENTRY_DSN) {
      Sentry.captureException(error, {
        level: error.severity as Severity,
        tags: {
          category: error.category,
          environment: env.NODE_ENV
        },
        extra: error.metadata
      });
    }
  }

  /**
   * Handle critical errors
   */
  private handleCriticalError(error: SecureError): void {
    // Notify appropriate channels
    this.notifyCriticalError(error);

    // Attempt recovery or graceful degradation
    this.attemptRecovery(error);
  }

  /**
   * Handle global errors
   */
  private handleGlobalError(
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error
  ): void {
    const secureError = new SecureError(
      typeof message === 'string' ? message : 'Global Error',
      ErrorCategory.SECURITY,
      ErrorSeverity.ERROR,
      {
        source,
        lineno,
        colno,
        originalError: error
      }
    );

    this.handleError(secureError);
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const secureError = new SecureError(
      'Unhandled Promise Rejection',
      ErrorCategory.SECURITY,
      ErrorSeverity.ERROR,
      {
        reason: event.reason
      }
    );

    this.handleError(secureError);
  }

  /**
   * Notify appropriate channels of critical errors
   */
  private notifyCriticalError(error: SecureError): void {
    // Implement notification logic (e.g., alert DevOps team)
  }

  /**
   * Attempt recovery from critical errors
   */
  private attemptRecovery(error: SecureError): void {
    // Implement recovery strategies based on error category
    switch (error.category) {
      case ErrorCategory.AUDIO_PROCESSING:
        // Attempt to restart audio processing
        break;
      case ErrorCategory.WASM:
        // Attempt to reinitialize WASM
        break;
      case ErrorCategory.WORKER:
        // Attempt to restart worker
        break;
      default:
        // Generic recovery attempt
        break;
    }
  }

  /**
   * Get error log
   */
  public getErrorLog(): SecureError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Sanitize error event before sending to Sentry
function sanitizeErrorEvent(event: any): any {
  if (!event) return null;

  // Remove sensitive data
  delete event.request?.cookies;
  delete event.request?.headers?.authorization;
  delete event.request?.headers?.cookie;

  // Sanitize user data
  if (event.user) {
    event.user = {
      id: event.user.id,
      ip_address: null,
      email: null
    };
  }

  return event;
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();
export default errorHandler; 