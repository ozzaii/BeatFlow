// Audio processing worker
self.onmessage = async (e) => {
  const { type, data } = e.data

  switch (type) {
    case 'PROCESS_BUFFER':
      const { buffer, operations } = data
      const processedBuffer = await processAudioBuffer(buffer, operations)
      self.postMessage({ type: 'BUFFER_PROCESSED', buffer: processedBuffer })
      break

    case 'ANALYZE_WAVEFORM':
      const { samples } = data
      const analysis = analyzeWaveform(samples)
      self.postMessage({ type: 'ANALYSIS_COMPLETE', analysis })
      break

    case 'GENERATE_PATTERN':
      const { params } = data
      const pattern = generatePattern(params)
      self.postMessage({ type: 'PATTERN_GENERATED', pattern })
      break
  }
}

// Process audio buffer with various operations
const processAudioBuffer = async (buffer, operations) => {
  // Clone the buffer to avoid modifying the original
  const processedBuffer = buffer.slice()

  for (const operation of operations) {
    switch (operation.type) {
      case 'normalize':
        normalizeBuffer(processedBuffer)
        break
      case 'reverse':
        reverseBuffer(processedBuffer)
        break
      case 'gain':
        applyGain(processedBuffer, operation.value)
        break
      case 'fade':
        applyFade(processedBuffer, operation.fadeIn, operation.fadeOut)
        break
    }
  }

  return processedBuffer
}

// Analyze waveform for visualization
const analyzeWaveform = (samples) => {
  const peaks = []
  const rms = []
  const blockSize = Math.floor(samples.length / 100)

  for (let i = 0; i < samples.length; i += blockSize) {
    const block = samples.slice(i, i + blockSize)
    let peak = 0
    let sum = 0

    for (const sample of block) {
      const abs = Math.abs(sample)
      peak = Math.max(peak, abs)
      sum += sample * sample
    }

    peaks.push(peak)
    rms.push(Math.sqrt(sum / block.length))
  }

  return { peaks, rms }
}

// Generate rhythmic patterns based on parameters
const generatePattern = ({ complexity, density, syncopation }) => {
  const steps = 16
  const pattern = new Array(steps).fill(false)
  
  // Basic rhythm generation based on complexity
  const baseBeats = [0, 4, 8, 12] // Standard 4/4 beats
  baseBeats.forEach(beat => pattern[beat] = true)

  // Add additional hits based on density
  const additionalHits = Math.floor(density * (steps / 4))
  for (let i = 0; i < additionalHits; i++) {
    const position = Math.floor(Math.random() * steps)
    pattern[position] = true
  }

  // Add syncopation
  if (syncopation > 0) {
    for (let i = 0; i < steps; i++) {
      if (pattern[i] && Math.random() < syncopation) {
        pattern[i] = false
        pattern[(i + 1) % steps] = true
      }
    }
  }

  return pattern
}

// Audio buffer processing utilities
const normalizeBuffer = (buffer) => {
  let maxAmp = 0
  for (const sample of buffer) {
    maxAmp = Math.max(maxAmp, Math.abs(sample))
  }

  if (maxAmp > 0) {
    const scale = 1 / maxAmp
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] *= scale
    }
  }
}

const reverseBuffer = (buffer) => {
  for (let i = 0; i < buffer.length / 2; i++) {
    const temp = buffer[i]
    buffer[i] = buffer[buffer.length - 1 - i]
    buffer[buffer.length - 1 - i] = temp
  }
}

const applyGain = (buffer, gain) => {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] *= gain
  }
}

const applyFade = (buffer, fadeInTime, fadeOutTime) => {
  const fadeInSamples = Math.floor(buffer.length * fadeInTime)
  const fadeOutSamples = Math.floor(buffer.length * fadeOutTime)

  // Apply fade in
  for (let i = 0; i < fadeInSamples; i++) {
    const gain = i / fadeInSamples
    buffer[i] *= gain
  }

  // Apply fade out
  for (let i = 0; i < fadeOutSamples; i++) {
    const gain = 1 - (i / fadeOutSamples)
    buffer[buffer.length - 1 - i] *= gain
  }
} 