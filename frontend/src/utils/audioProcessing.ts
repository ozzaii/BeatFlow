/**
 * audioProcessing.ts
 * Secure audio processing utility for BeatFlow
 * Implements encryption, watermarking, and performance optimization
 */

import { AudioSecurity, WasmSecurity } from '../config/security';
import { env } from '../config/validateEnv';
import { Buffer } from 'buffer';

// Audio Processing Constants
const CHUNK_SIZE = env.AUDIO_BUFFER_SIZE;
const SAMPLE_RATE = env.AUDIO_SAMPLE_RATE;
const MAX_FILE_SIZE = env.MAX_AUDIO_FILE_SIZE;

// WebAssembly Module
let wasmModule: WebAssembly.Module | null = null;
let wasmInstance: WebAssembly.Instance | null = null;

// Audio Context
let audioContext: AudioContext | null = null;

export class SecureAudioProcessor {
  private readonly worker: Worker;
  private readonly buffers: Map<string, ArrayBuffer>;
  private isInitialized: boolean;

  constructor() {
    this.worker = new Worker(new URL('../workers/audio-worker.js', import.meta.url));
    this.buffers = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the audio processor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize AudioContext
      audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: SAMPLE_RATE,
        latencyHint: 'interactive'
      });

      // Load and validate WASM module
      const response = await fetch('/wasm/audio-processor.wasm');
      const moduleBytes = await response.arrayBuffer();
      
      if (!WasmSecurity.validateWasmModule(moduleBytes)) {
        throw new Error('Invalid WASM module');
      }

      wasmModule = await WebAssembly.compile(moduleBytes);
      wasmInstance = await WebAssembly.instantiate(wasmModule, {
        env: {
          memory: new WebAssembly.Memory({
            initial: env.WASM_MEMORY_PAGES,
            maximum: env.WASM_MEMORY_PAGES * 2,
            shared: env.WASM_SHARED_MEMORY
          })
        }
      });

      WasmSecurity.secureWasmMemory(wasmInstance.exports.memory as WebAssembly.Memory);

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      throw error;
    }
  }

  /**
   * Process audio data securely
   */
  async processAudio(
    input: ArrayBuffer,
    userId: string,
    options: {
      applyWatermark?: boolean;
      enableAI?: boolean;
      quality?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<ArrayBuffer> {
    if (!this.isInitialized) {
      throw new Error('Audio processor not initialized');
    }

    try {
      // Validate input
      if (input.byteLength > MAX_FILE_SIZE) {
        throw new Error('Audio file too large');
      }

      // Encrypt input for worker transfer
      const encryptedInput = AudioSecurity.encryptAudioBuffer(input);
      
      // Add watermark if enabled
      const processedBuffer = options.applyWatermark
        ? AudioSecurity.addWatermark(input, userId)
        : input;

      // Split into chunks for processing
      const chunks = this.splitBuffer(processedBuffer);
      const processedChunks: ArrayBuffer[] = [];

      for (const chunk of chunks) {
        // Process chunk using WASM
        const processedChunk = await this.processChunk(chunk, options.quality || 'high');
        processedChunks.push(processedChunk);
      }

      // Combine processed chunks
      const result = this.combineBuffers(processedChunks);

      // Store in secure buffer
      const bufferId = crypto.randomUUID();
      this.buffers.set(bufferId, result);

      return result;
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    }
  }

  /**
   * Process a single chunk of audio data
   */
  private async processChunk(
    chunk: ArrayBuffer,
    quality: 'low' | 'medium' | 'high'
  ): Promise<ArrayBuffer> {
    if (!wasmInstance) {
      throw new Error('WASM instance not initialized');
    }

    const memory = wasmInstance.exports.memory as WebAssembly.Memory;
    const processAudio = wasmInstance.exports.processAudio as CallableFunction;

    // Allocate memory for input
    const inputPtr = (wasmInstance.exports.malloc as CallableFunction)(chunk.byteLength);
    new Uint8Array(memory.buffer).set(new Uint8Array(chunk), inputPtr);

    // Process audio
    const outputPtr = processAudio(inputPtr, chunk.byteLength, quality);
    
    // Copy result
    const result = memory.buffer.slice(outputPtr, outputPtr + chunk.byteLength);
    
    // Free memory
    (wasmInstance.exports.free as CallableFunction)(inputPtr);
    (wasmInstance.exports.free as CallableFunction)(outputPtr);

    return result;
  }

  /**
   * Split buffer into processable chunks
   */
  private splitBuffer(buffer: ArrayBuffer): ArrayBuffer[] {
    const chunks: ArrayBuffer[] = [];
    let offset = 0;

    while (offset < buffer.byteLength) {
      const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
      chunks.push(chunk);
      offset += CHUNK_SIZE;
    }

    return chunks;
  }

  /**
   * Combine processed chunks back into a single buffer
   */
  private combineBuffers(chunks: ArrayBuffer[]): ArrayBuffer {
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    const result = new ArrayBuffer(totalLength);
    const view = new Uint8Array(result);
    
    let offset = 0;
    for (const chunk of chunks) {
      view.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    return result;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.worker.terminate();
    this.buffers.clear();
    
    if (audioContext) {
      await audioContext.close();
      audioContext = null;
    }

    wasmModule = null;
    wasmInstance = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const audioProcessor = new SecureAudioProcessor();
export default audioProcessor; 