// Pattern generation worker

const PATTERN_STYLES = {
  BASIC: 'basic',
  COMPLEX: 'complex',
  SYNCOPATED: 'syncopated',
  POLYRHYTHMIC: 'polyrhythmic',
  MINIMAL: 'minimal',
}

const VARIATION_TYPES = {
  DENSITY: 'density',
  DISPLACEMENT: 'displacement',
  INVERSION: 'inversion',
  RANDOMIZATION: 'randomization',
  HUMANIZE: 'humanize',
}

// Handle messages from main thread
self.onmessage = (e) => {
  const { type, data } = e.data

  switch (type) {
    case 'GENERATE_PATTERN':
      const pattern = generatePattern(data)
      self.postMessage({ type: 'PATTERN_GENERATED', data: pattern })
      break
      
    case 'CREATE_VARIATION':
      const variation = createVariation(data.pattern, data.variationType)
      self.postMessage({ type: 'VARIATION_CREATED', data: variation })
      break
      
    case 'ANALYZE_PATTERN':
      const analysis = analyzePattern(data.pattern)
      self.postMessage({ type: 'ANALYSIS_COMPLETE', data: analysis })
      break
  }
}

// Generate a new pattern based on parameters
const generatePattern = ({ patternType, style = PATTERN_STYLES.BASIC, complexity = 0.5, density = 0.5 }) => {
  const steps = 16
  const pattern = {
    type: patternType,
    steps: new Array(steps).fill(false),
    velocity: new Array(steps).fill(1),
    probability: new Array(steps).fill(1),
  }

  switch (style) {
    case PATTERN_STYLES.BASIC:
      generateBasicPattern(pattern, density)
      break
    case PATTERN_STYLES.COMPLEX:
      generateComplexPattern(pattern, complexity, density)
      break
    case PATTERN_STYLES.SYNCOPATED:
      generateSyncopatedPattern(pattern, complexity)
      break
    case PATTERN_STYLES.POLYRHYTHMIC:
      generatePolyrhythmicPattern(pattern, complexity)
      break
    case PATTERN_STYLES.MINIMAL:
      generateMinimalPattern(pattern, density)
      break
  }

  // Apply humanization
  humanizePattern(pattern, 0.1)

  return pattern
}

// Generate basic pattern with common rhythmic placements
const generateBasicPattern = (pattern, density) => {
  const { steps } = pattern
  
  // Common beat positions
  const commonPositions = [0, 4, 8, 12] // Quarter notes
  commonPositions.forEach(pos => {
    if (Math.random() < density) {
      steps[pos] = true
      pattern.velocity[pos] = 0.8 + Math.random() * 0.4
    }
  })

  // Add off-beat hits based on density
  for (let i = 0; i < steps.length; i++) {
    if (!commonPositions.includes(i) && Math.random() < density * 0.5) {
      steps[i] = true
      pattern.velocity[i] = 0.6 + Math.random() * 0.3
    }
  }
}

// Generate complex pattern with varied rhythmic elements
const generateComplexPattern = (pattern, complexity, density) => {
  const { steps } = pattern
  
  // Generate rhythmic subdivisions
  const subdivisions = Math.floor(2 + complexity * 3) // 2 to 5 subdivisions
  const subLength = steps.length / subdivisions

  for (let i = 0; i < steps.length; i++) {
    const subPosition = i % subLength
    const probability = density * (1 - (complexity * 0.3 * (subPosition / subLength)))
    
    if (Math.random() < probability) {
      steps[i] = true
      pattern.velocity[i] = 0.7 + Math.random() * 0.3
      pattern.probability[i] = 0.8 + Math.random() * 0.2
    }
  }
}

// Generate syncopated pattern with off-beat emphasis
const generateSyncopatedPattern = (pattern, complexity) => {
  const { steps } = pattern
  
  // Start with basic pattern
  generateBasicPattern(pattern, 0.5)

  // Add syncopation
  for (let i = 0; i < steps.length; i++) {
    if (steps[i] && Math.random() < complexity) {
      // Move hit to next position
      steps[i] = false
      steps[(i + 1) % steps.length] = true
      pattern.velocity[(i + 1) % steps.length] = 0.8 + Math.random() * 0.2
    }
  }
}

// Generate polyrhythmic pattern combining different rhythmic cycles
const generatePolyrhythmicPattern = (pattern, complexity) => {
  const { steps } = pattern
  
  // Generate 2-3 different rhythmic cycles
  const numCycles = Math.floor(2 + complexity)
  const cycles = [3, 4, 5, 7].slice(0, numCycles)

  cycles.forEach(cycle => {
    for (let i = 0; i < steps.length; i += cycle) {
      if (Math.random() < 0.7) {
        steps[i % steps.length] = true
        pattern.velocity[i % steps.length] = 0.7 + Math.random() * 0.3
      }
    }
  })
}

// Generate minimal pattern with sparse placement
const generateMinimalPattern = (pattern, density) => {
  const { steps } = pattern
  
  // Place hits sparsely
  for (let i = 0; i < steps.length; i++) {
    if (Math.random() < density * 0.3) {
      steps[i] = true
      pattern.velocity[i] = 0.9 + Math.random() * 0.1
    }
  }
}

// Create a variation of an existing pattern
const createVariation = (originalPattern, variationType) => {
  const variation = {
    originalId: originalPattern.id,
    type: originalPattern.type,
    steps: [...originalPattern.steps],
    velocity: [...originalPattern.velocity],
    probability: [...originalPattern.probability],
  }

  switch (variationType) {
    case VARIATION_TYPES.DENSITY:
      createDensityVariation(variation)
      break
    case VARIATION_TYPES.DISPLACEMENT:
      createDisplacementVariation(variation)
      break
    case VARIATION_TYPES.INVERSION:
      createInversionVariation(variation)
      break
    case VARIATION_TYPES.RANDOMIZATION:
      createRandomVariation(variation)
      break
    case VARIATION_TYPES.HUMANIZE:
      humanizePattern(variation, 0.2)
      break
  }

  return variation
}

// Create variation by changing pattern density
const createDensityVariation = (pattern) => {
  const { steps, velocity } = pattern
  
  for (let i = 0; i < steps.length; i++) {
    if (steps[i] && Math.random() < 0.3) {
      // Remove some hits
      steps[i] = false
    } else if (!steps[i] && Math.random() < 0.2) {
      // Add some hits
      steps[i] = true
      velocity[i] = 0.7 + Math.random() * 0.3
    }
  }
}

// Create variation by shifting pattern
const createDisplacementVariation = (pattern) => {
  const shift = Math.floor(Math.random() * 4) // Shift by 1-4 steps
  
  pattern.steps = [
    ...pattern.steps.slice(shift),
    ...pattern.steps.slice(0, shift),
  ]
  
  pattern.velocity = [
    ...pattern.velocity.slice(shift),
    ...pattern.velocity.slice(0, shift),
  ]
  
  pattern.probability = [
    ...pattern.probability.slice(shift),
    ...pattern.probability.slice(0, shift),
  ]
}

// Create variation by inverting pattern
const createInversionVariation = (pattern) => {
  const { steps, velocity } = pattern
  
  for (let i = 0; i < steps.length; i++) {
    steps[i] = !steps[i]
    if (steps[i]) {
      velocity[i] = 0.7 + Math.random() * 0.3
    }
  }
}

// Create randomized variation
const createRandomVariation = (pattern) => {
  const { steps, velocity, probability } = pattern
  
  for (let i = 0; i < steps.length; i++) {
    if (Math.random() < 0.3) {
      steps[i] = !steps[i]
      if (steps[i]) {
        velocity[i] = 0.6 + Math.random() * 0.4
        probability[i] = 0.7 + Math.random() * 0.3
      }
    }
  }
}

// Add human-like variations to timing and velocity
const humanizePattern = (pattern, amount) => {
  const { velocity, probability } = pattern
  
  for (let i = 0; i < velocity.length; i++) {
    if (pattern.steps[i]) {
      // Vary velocity
      velocity[i] *= 1 + (Math.random() * 2 - 1) * amount
      velocity[i] = Math.max(0.5, Math.min(1, velocity[i]))
      
      // Vary probability
      probability[i] *= 1 - Math.random() * amount * 0.5
    }
  }
}

// Analyze pattern characteristics
const analyzePattern = (pattern) => {
  const analysis = {
    density: calculateDensity(pattern),
    syncopation: calculateSyncopation(pattern),
    complexity: calculateComplexity(pattern),
    repetition: findRepetitions(pattern),
  }

  return analysis
}

// Calculate pattern density
const calculateDensity = (pattern) => {
  const activeSteps = pattern.steps.filter(step => step).length
  return activeSteps / pattern.steps.length
}

// Calculate syncopation level
const calculateSyncopation = (pattern) => {
  let syncopation = 0
  const { steps } = pattern
  
  for (let i = 0; i < steps.length; i++) {
    if (steps[i] && i % 4 !== 0) { // If hit is not on quarter note
      syncopation += 1
    }
  }
  
  return syncopation / (steps.length / 4)
}

// Calculate pattern complexity
const calculateComplexity = (pattern) => {
  const { steps } = pattern
  let complexity = 0
  
  // Check for consecutive hits
  for (let i = 1; i < steps.length; i++) {
    if (steps[i] && steps[i - 1]) {
      complexity += 1
    }
  }
  
  // Check for isolated hits
  for (let i = 1; i < steps.length - 1; i++) {
    if (steps[i] && !steps[i - 1] && !steps[i + 1]) {
      complexity += 2
    }
  }
  
  return complexity / steps.length
}

// Find repetitive patterns
const findRepetitions = (pattern) => {
  const { steps } = pattern
  const repetitions = []
  
  // Look for repeating sequences of different lengths
  for (let length = 2; length <= steps.length / 2; length++) {
    for (let start = 0; start <= steps.length - length * 2; start++) {
      const sequence = steps.slice(start, start + length)
      const nextSequence = steps.slice(start + length, start + length * 2)
      
      if (arraysEqual(sequence, nextSequence)) {
        repetitions.push({
          start,
          length,
          sequence,
        })
      }
    }
  }
  
  return repetitions
}

// Utility function to compare arrays
const arraysEqual = (a, b) => {
  if (a.length !== b.length) return false
  return a.every((val, index) => val === b[index])
} 