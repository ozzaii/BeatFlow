/**
 * @file audio-worker.js
 * @description High-performance audio processing worker
 * Features:
 * - Zero-copy audio streaming with SharedArrayBuffer
 * - SIMD-optimized processing
 * - Predictive loading
 * - Real-time AI processing
 */

import { initializeWasm } from '../wasm/audio-processor'
import * as Comlink from 'comlink'

class AudioWorker {
  constructor() {
    this.processor = null
    this.sharedBuffer = null
    this.aiModel = null
    this.predictiveCache = new Map()
    this.isProcessing = false
  }

  async initialize(config) {
    // Initialize WebAssembly module
    const wasmModule = await initializeWasm()
    this.processor = new wasmModule.AudioProcessor(config.bufferSize)

    // Set up shared buffer for zero-copy streaming
    this.sharedBuffer = config.sharedBuffer
    this.sharedArray = new Float32Array(this.sharedBuffer)

    // Initialize AI model
    await this.initializeAI()

    // Set up performance monitoring
    this.perfMonitor = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      // Monitor processing time and adjust quality if needed
      this.adaptiveQuality(entries)
    })
    this.perfMonitor.observe({ entryTypes: ['measure'] })
  }

  async initializeAI() {
    // Load ONNX model for audio enhancement
    const modelPath = '/models/audio-enhancer.onnx'
    const response = await fetch(modelPath)
    const modelBuffer = await response.arrayBuffer()
    
    // Initialize ONNX runtime
    this.aiModel = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
      executionMode: 'parallel',
    })
  }

  async processAudio(inputBuffer) {
    if (this.isProcessing) return // Prevent overlapping processing

    this.isProcessing = true
    performance.mark('process-start')

    try {
      // Copy input to shared buffer
      this.sharedArray.set(inputBuffer)

      // Process audio with WebAssembly
      this.processor.process(this.sharedArray, this.sharedArray)

      // Apply AI enhancement if enabled
      if (this.aiModel) {
        await this.enhanceAudio()
      }

      // Notify main thread of completion
      self.postMessage({ type: 'processed' })

    } catch (error) {
      console.error('Audio processing error:', error)
      self.postMessage({ type: 'error', error: error.message })
    } finally {
      this.isProcessing = false
      performance.mark('process-end')
      performance.measure('audio-processing', 'process-start', 'process-end')
    }
  }

  async enhanceAudio() {
    // Prepare input tensor
    const tensor = new ort.Tensor('float32', this.sharedArray, [1, 2, this.sharedArray.length / 2])
    
    // Run inference
    const results = await this.aiModel.run({ input: tensor })
    
    // Copy enhanced audio back to shared buffer
    this.sharedArray.set(results.output.data)
  }

  adaptiveQuality(perfEntries) {
    const avgProcessingTime = perfEntries.reduce((sum, entry) => sum + entry.duration, 0) / perfEntries.length

    // Adjust quality based on performance
    if (avgProcessingTime > 16.67) { // Targeting 60fps
      this.processor.setQuality('low')
    } else if (avgProcessingTime < 8.33) { // Well under budget
      this.processor.setQuality('high')
    }
  }

  predictiveLoad(urls) {
    urls.forEach(url => {
      if (!this.predictiveCache.has(url)) {
        fetch(url)
          .then(response => response.arrayBuffer())
          .then(buffer => {
            this.predictiveCache.set(url, buffer)
            // Notify main thread of cache update
            self.postMessage({ type: 'cached', url })
          })
          .catch(console.error)
      }
    })
  }

  // Handle messages from main thread
  handleMessage(event) {
    const { type, data } = event.data

    switch (type) {
      case 'init':
        this.initialize(data)
        break
      case 'process':
        this.processAudio(data.buffer)
        break
      case 'preload':
        this.predictiveLoad(data.urls)
        break
      case 'setParam':
        this.processor[`set${data.param}`](data.value)
        break
      case 'dispose':
        this.cleanup()
        break
    }
  }

  cleanup() {
    this.processor?.delete()
    this.aiModel?.dispose()
    this.predictiveCache.clear()
    this.perfMonitor.disconnect()
  }
}

// Create worker instance
const worker = new AudioWorker()

// Set up message handling
self.onmessage = (event) => worker.handleMessage(event)

// Export worker interface
export const audioWorker = Comlink.wrap(worker) 