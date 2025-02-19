/**
 * performanceMonitoring.ts
 * Performance monitoring utility for BeatFlow
 * Implements real-time performance tracking, optimization, and reporting
 */

import { env } from '../config/validateEnv';
import { errorHandler, ErrorCategory, ErrorSeverity, SecureError } from './errorHandling';

// Performance thresholds
const THRESHOLDS = {
  AUDIO_PROCESSING: {
    WARNING: 100, // ms
    CRITICAL: 200 // ms
  },
  WASM_EXECUTION: {
    WARNING: 50, // ms
    CRITICAL: 100 // ms
  },
  MEMORY_USAGE: {
    WARNING: 0.7, // 70% of available memory
    CRITICAL: 0.9 // 90% of available memory
  },
  FPS: {
    WARNING: 45,
    CRITICAL: 30
  }
};

// Performance metrics types
export interface PerformanceMetrics {
  audioProcessingTime: number;
  wasmExecutionTime: number;
  memoryUsage: number;
  fps: number;
  timestamp: number;
}

// Performance Monitor Class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private readonly maxMetricsLength = 1000;
  private isMonitoring: boolean = false;
  private fpsTime: number = 0;
  private frameCount: number = 0;
  private lastFrameTimestamp: number = 0;

  private constructor() {
    if (env.PERFORMANCE_MONITORING) {
      this.setupPerformanceObserver();
    }
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorFrameRate();
    this.monitorMemoryUsage();
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Setup Performance Observer
   */
  private setupPerformanceObserver(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.handlePerformanceEntry(entry);
      }
    });

    observer.observe({
      entryTypes: ['measure', 'resource', 'longtask'],
      buffered: true
    });
  }

  /**
   * Handle performance entry
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    if (!this.isMonitoring) return;

    switch (entry.entryType) {
      case 'measure':
        if (entry.name.startsWith('audio-processing')) {
          this.checkAudioProcessingPerformance(entry.duration);
        } else if (entry.name.startsWith('wasm-execution')) {
          this.checkWasmExecutionPerformance(entry.duration);
        }
        break;
      case 'longtask':
        this.handleLongTask(entry);
        break;
      case 'resource':
        this.handleResourceLoad(entry as PerformanceResourceTiming);
        break;
    }
  }

  /**
   * Monitor frame rate
   */
  private monitorFrameRate(): void {
    const measureFPS = (timestamp: number) => {
      if (!this.isMonitoring) return;

      if (this.lastFrameTimestamp === 0) {
        this.lastFrameTimestamp = timestamp;
      }

      const deltaTime = timestamp - this.lastFrameTimestamp;
      this.frameCount++;
      this.fpsTime += deltaTime;

      if (this.fpsTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / this.fpsTime);
        this.checkFrameRate(fps);
        this.frameCount = 0;
        this.fpsTime = 0;
      }

      this.lastFrameTimestamp = timestamp;
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    const checkMemory = () => {
      if (!this.isMonitoring) return;

      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        this.checkMemoryUsage(memoryUsage);
      }

      setTimeout(checkMemory, 5000); // Check every 5 seconds
    };

    checkMemory();
  }

  /**
   * Check audio processing performance
   */
  private checkAudioProcessingPerformance(duration: number): void {
    if (duration > THRESHOLDS.AUDIO_PROCESSING.CRITICAL) {
      this.reportPerformanceIssue(
        'Critical audio processing delay',
        ErrorCategory.PERFORMANCE,
        ErrorSeverity.CRITICAL,
        { duration }
      );
    } else if (duration > THRESHOLDS.AUDIO_PROCESSING.WARNING) {
      this.reportPerformanceIssue(
        'Audio processing delay detected',
        ErrorCategory.PERFORMANCE,
        ErrorSeverity.WARNING,
        { duration }
      );
    }
  }

  /**
   * Check WebAssembly execution performance
   */
  private checkWasmExecutionPerformance(duration: number): void {
    if (duration > THRESHOLDS.WASM_EXECUTION.CRITICAL) {
      this.reportPerformanceIssue(
        'Critical WASM execution delay',
        ErrorCategory.PERFORMANCE,
        ErrorSeverity.CRITICAL,
        { duration }
      );
    } else if (duration > THRESHOLDS.WASM_EXECUTION.WARNING) {
      this.reportPerformanceIssue(
        'WASM execution delay detected',
        ErrorCategory.PERFORMANCE,
        ErrorSeverity.WARNING,
        { duration }
      );
    }
  }

  /**
   * Check frame rate
   */
  private checkFrameRate(fps: number): void {
    if (fps < THRESHOLDS.FPS.CRITICAL) {
      this.reportPerformanceIssue(
        'Critical frame rate drop',
        ErrorCategory.PERFORMANCE,
        ErrorSeverity.CRITICAL,
        { fps }
      );
    } else if (fps < THRESHOLDS.FPS.WARNING) {
      this.reportPerformanceIssue(
        'Frame rate drop detected',
        ErrorCategory.PERFORMANCE,
        ErrorSeverity.WARNING,
        { fps }
      );
    }
  }

  /**
   * Check memory usage
   */
  private checkMemoryUsage(usage: number): void {
    if (usage > THRESHOLDS.MEMORY_USAGE.CRITICAL) {
      this.reportPerformanceIssue(
        'Critical memory usage',
        ErrorCategory.PERFORMANCE,
        ErrorSeverity.CRITICAL,
        { usage: Math.round(usage * 100) + '%' }
      );
    } else if (usage > THRESHOLDS.MEMORY_USAGE.WARNING) {
      this.reportPerformanceIssue(
        'High memory usage detected',
        ErrorCategory.PERFORMANCE,
        ErrorSeverity.WARNING,
        { usage: Math.round(usage * 100) + '%' }
      );
    }
  }

  /**
   * Handle long tasks
   */
  private handleLongTask(entry: PerformanceEntry): void {
    if (entry.duration > 100) { // Tasks longer than 100ms
      this.reportPerformanceIssue(
        'Long task detected',
        ErrorCategory.PERFORMANCE,
        ErrorSeverity.WARNING,
        {
          duration: entry.duration,
          startTime: entry.startTime
        }
      );
    }
  }

  /**
   * Handle resource loading
   */
  private handleResourceLoad(entry: PerformanceResourceTiming): void {
    if (entry.duration > 5000) { // Resources taking longer than 5s to load
      this.reportPerformanceIssue(
        'Slow resource loading',
        ErrorCategory.PERFORMANCE,
        ErrorSeverity.WARNING,
        {
          resource: entry.name,
          duration: entry.duration,
          size: entry.transferSize
        }
      );
    }
  }

  /**
   * Report performance issue
   */
  private reportPerformanceIssue(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    metadata?: Record<string, any>
  ): void {
    const error = new SecureError(message, category, severity, metadata);
    errorHandler.handleError(error);
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    return {
      audioProcessingTime: performance.getEntriesByType('measure')
        .filter(entry => entry.name.startsWith('audio-processing'))
        .reduce((acc, entry) => acc + entry.duration, 0) / 
        Math.max(performance.getEntriesByType('measure').length, 1),
      wasmExecutionTime: performance.getEntriesByType('measure')
        .filter(entry => entry.name.startsWith('wasm-execution'))
        .reduce((acc, entry) => acc + entry.duration, 0) /
        Math.max(performance.getEntriesByType('measure').length, 1),
      memoryUsage: performance.memory ? 
        performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit : 0,
      fps: this.frameCount > 0 ? 
        Math.round((this.frameCount * 1000) / this.fpsTime) : 60,
      timestamp: Date.now()
    };
  }

  /**
   * Clear performance metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
export default performanceMonitor; 