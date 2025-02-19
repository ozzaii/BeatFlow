/**
 * initialize.ts
 * Secure initialization utility for BeatFlow
 * Coordinates security, monitoring, and audio processing systems
 */

import { env } from '../config/validateEnv';
import { SecurityConfig } from '../config/security';
import { audioProcessor } from './audioProcessing';
import { errorHandler, ErrorCategory, ErrorSeverity } from './errorHandling';
import { performanceMonitor } from './performanceMonitoring';

// Initialization states
export enum InitState {
  PENDING = 'PENDING',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  ERROR = 'ERROR'
}

// System status interface
interface SystemStatus {
  security: boolean;
  audioProcessing: boolean;
  monitoring: boolean;
  worker: boolean;
  wasm: boolean;
}

export class SecureInitializer {
  private static instance: SecureInitializer;
  private state: InitState = InitState.PENDING;
  private status: SystemStatus = {
    security: false,
    audioProcessing: false,
    monitoring: false,
    worker: false,
    wasm: false
  };

  private constructor() {}

  public static getInstance(): SecureInitializer {
    if (!SecureInitializer.instance) {
      SecureInitializer.instance = new SecureInitializer();
    }
    return SecureInitializer.instance;
  }

  /**
   * Initialize all systems securely
   */
  public async initialize(): Promise<void> {
    if (this.state === InitState.INITIALIZING || this.state === InitState.READY) {
      return;
    }

    this.state = InitState.INITIALIZING;

    try {
      // Initialize in sequence with proper error handling
      await this.initializeSecurity();
      await this.initializeMonitoring();
      await this.initializeAudioProcessing();

      this.state = InitState.READY;
    } catch (error) {
      this.state = InitState.ERROR;
      this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * Initialize security systems
   */
  private async initializeSecurity(): Promise<void> {
    try {
      // Validate environment
      if (!env) {
        throw new Error('Environment configuration not loaded');
      }

      // Apply Content Security Policy
      this.applyCSP();

      // Initialize security features
      if (env.ENABLE_2FA) {
        await this.initialize2FA();
      }

      this.status.security = true;
    } catch (error) {
      throw this.createInitError('Security initialization failed', error);
    }
  }

  /**
   * Initialize monitoring systems
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      if (env.PERFORMANCE_MONITORING) {
        performanceMonitor.startMonitoring();
      }

      if (env.ERROR_REPORTING) {
        // Additional error reporting setup if needed
      }

      this.status.monitoring = true;
    } catch (error) {
      throw this.createInitError('Monitoring initialization failed', error);
    }
  }

  /**
   * Initialize audio processing
   */
  private async initializeAudioProcessing(): Promise<void> {
    try {
      await audioProcessor.initialize();
      this.status.audioProcessing = true;
      this.status.worker = true;
      this.status.wasm = true;
    } catch (error) {
      throw this.createInitError('Audio processing initialization failed', error);
    }
  }

  /**
   * Apply Content Security Policy
   */
  private applyCSP(): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.generateCSPString();
    document.head.appendChild(meta);
  }

  /**
   * Generate CSP string from config
   */
  private generateCSPString(): string {
    const { directives } = SecurityConfig.CSP;
    return Object.entries(directives)
      .map(([key, values]) => {
        const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${directive} ${values.join(' ')}`;
      })
      .join('; ');
  }

  /**
   * Initialize 2FA if enabled
   */
  private async initialize2FA(): Promise<void> {
    // Implement 2FA initialization
  }

  /**
   * Create initialization error
   */
  private createInitError(message: string, originalError: any): Error {
    const metadata = {
      state: this.state,
      status: { ...this.status },
      originalError
    };

    return new Error(`Initialization Error: ${message}\n${JSON.stringify(metadata, null, 2)}`);
  }

  /**
   * Handle initialization error
   */
  private handleInitializationError(error: any): void {
    errorHandler.handleError(
      new SecureError(
        'System initialization failed',
        ErrorCategory.SECURITY,
        ErrorSeverity.CRITICAL,
        {
          state: this.state,
          status: this.status,
          error: error.message
        }
      )
    );
  }

  /**
   * Get current initialization state
   */
  public getState(): InitState {
    return this.state;
  }

  /**
   * Get system status
   */
  public getStatus(): SystemStatus {
    return { ...this.status };
  }

  /**
   * Check if system is ready
   */
  public isReady(): boolean {
    return this.state === InitState.READY;
  }

  /**
   * Reset initializer state
   */
  public reset(): void {
    this.state = InitState.PENDING;
    this.status = {
      security: false,
      audioProcessing: false,
      monitoring: false,
      worker: false,
      wasm: false
    };
  }
}

// Export singleton instance
export const secureInitializer = SecureInitializer.getInstance();
export default secureInitializer; 