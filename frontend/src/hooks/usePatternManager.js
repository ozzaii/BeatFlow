import { useState, useCallback, useRef } from 'react'

const PATTERN_TYPES = {
  KICK: 'kick',
  SNARE: 'snare',
  HIHAT: 'hihat',
  CLAP: 'clap',
  PERCUSSION: 'percussion',
}

const GROOVE_TEMPLATES = {
  STRAIGHT: 'straight',
  SWING: 'swing',
  SHUFFLE: 'shuffle',
  TRIPLET: 'triplet',
  BROKEN: 'broken',
}

export const usePatternManager = () => {
  const [patterns, setPatterns] = useState(new Map())
  const [currentPattern, setCurrentPattern] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const historyRef = useRef({
    past: [],
    future: [],
  })
  
  const workerRef = useRef(null)

  // Initialize worker
  useState(() => {
    workerRef.current = new Worker(
      new URL('../workers/patternWorker.js', import.meta.url)
    )

    workerRef.current.onmessage = (e) => {
      const { type, data } = e.data
      
      switch (type) {
        case 'PATTERN_GENERATED':
          handlePatternGenerated(data)
          break
        case 'VARIATION_CREATED':
          handleVariationCreated(data)
          break
      }
    }

    return () => workerRef.current?.terminate()
  }, [])

  // Create a new pattern
  const createPattern = useCallback((type, length = 16) => {
    const id = crypto.randomUUID()
    const newPattern = {
      id,
      type,
      steps: new Array(length).fill(false),
      velocity: new Array(length).fill(1),
      probability: new Array(length).fill(1),
      groove: GROOVE_TEMPLATES.STRAIGHT,
      variations: [],
    }

    setPatterns(prev => new Map(prev).set(id, newPattern))
    return id
  }, [])

  // Update pattern
  const updatePattern = useCallback((id, updates) => {
    setPatterns(prev => {
      const newPatterns = new Map(prev)
      const pattern = newPatterns.get(id)
      
      if (pattern) {
        // Save to history
        historyRef.current.past.push({
          type: 'UPDATE',
          id,
          pattern: { ...pattern },
        })
        historyRef.current.future = []

        newPatterns.set(id, { ...pattern, ...updates })
      }
      
      return newPatterns
    })
  }, [])

  // Generate pattern using AI
  const generatePattern = useCallback(async (type, params) => {
    setIsGenerating(true)
    
    try {
      workerRef.current?.postMessage({
        type: 'GENERATE_PATTERN',
        data: {
          patternType: type,
          ...params,
        },
      })
    } catch (error) {
      console.error('Failed to generate pattern:', error)
      setIsGenerating(false)
    }
  }, [])

  // Create pattern variation
  const createVariation = useCallback((id, variationType) => {
    const pattern = patterns.get(id)
    if (!pattern) return

    workerRef.current?.postMessage({
      type: 'CREATE_VARIATION',
      data: {
        pattern,
        variationType,
      },
    })
  }, [patterns])

  // Apply groove template
  const applyGroove = useCallback((id, grooveType, amount = 0.5) => {
    setPatterns(prev => {
      const newPatterns = new Map(prev)
      const pattern = newPatterns.get(id)
      
      if (pattern) {
        const grooved = { ...pattern, groove: grooveType }
        
        // Apply timing modifications based on groove type
        switch (grooveType) {
          case GROOVE_TEMPLATES.SWING:
            // Apply swing timing
            grooved.timing = pattern.steps.map((_, i) => 
              i % 2 === 1 ? amount * 0.33 : 0
            )
            break
          case GROOVE_TEMPLATES.SHUFFLE:
            // Apply shuffle timing
            grooved.timing = pattern.steps.map((_, i) => 
              i % 3 === 2 ? amount * 0.166 : 0
            )
            break
          case GROOVE_TEMPLATES.TRIPLET:
            // Apply triplet timing
            grooved.timing = pattern.steps.map((_, i) => 
              i % 3 === 0 ? -amount * 0.166 : 0
            )
            break
          default:
            grooved.timing = pattern.steps.map(() => 0)
        }

        newPatterns.set(id, grooved)
      }
      
      return newPatterns
    })
  }, [])

  // Undo last action
  const undo = useCallback(() => {
    const { past, future } = historyRef.current
    
    if (past.length === 0) return
    
    const lastAction = past[past.length - 1]
    
    setPatterns(prev => {
      const newPatterns = new Map(prev)
      
      // Save current state to future
      const currentPattern = newPatterns.get(lastAction.id)
      if (currentPattern) {
        future.push({
          type: lastAction.type,
          id: lastAction.id,
          pattern: { ...currentPattern },
        })
      }

      // Restore past state
      newPatterns.set(lastAction.id, lastAction.pattern)
      
      past.pop()
      return newPatterns
    })
  }, [])

  // Redo last undone action
  const redo = useCallback(() => {
    const { past, future } = historyRef.current
    
    if (future.length === 0) return
    
    const nextAction = future[future.length - 1]
    
    setPatterns(prev => {
      const newPatterns = new Map(prev)
      
      // Save current state to past
      const currentPattern = newPatterns.get(nextAction.id)
      if (currentPattern) {
        past.push({
          type: nextAction.type,
          id: nextAction.id,
          pattern: { ...currentPattern },
        })
      }

      // Restore future state
      newPatterns.set(nextAction.id, nextAction.pattern)
      
      future.pop()
      return newPatterns
    })
  }, [])

  // Handle generated pattern
  const handlePatternGenerated = useCallback((generatedPattern) => {
    const id = createPattern(generatedPattern.type)
    updatePattern(id, {
      steps: generatedPattern.steps,
      velocity: generatedPattern.velocity,
      probability: generatedPattern.probability,
    })
    setIsGenerating(false)
  }, [createPattern, updatePattern])

  // Handle variation created
  const handleVariationCreated = useCallback((variation) => {
    updatePattern(variation.originalId, {
      variations: [...patterns.get(variation.originalId).variations, variation],
    })
  }, [patterns, updatePattern])

  return {
    patterns,
    currentPattern,
    isGenerating,
    createPattern,
    updatePattern,
    generatePattern,
    createVariation,
    applyGroove,
    undo,
    redo,
    PATTERN_TYPES,
    GROOVE_TEMPLATES,
  }
} 