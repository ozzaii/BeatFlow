import * as Tone from 'tone'
import { useState, useEffect, useCallback, useRef } from 'react'

const SAMPLE_TYPES = {
  KICK: 'kick',
  SNARE: 'snare',
  HIHAT: 'hihat',
  CLAP: 'clap',
  PERCUSSION: 'percussion'
}

const SYNTH_TYPES = {
  FM: 'fm',
  AM: 'am',
  MONO: 'mono',
  POLY: 'poly'
}

export const useSoundEngine = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [bpm, setBpm] = useState(120)
  
  // Refs for audio nodes
  const synthsRef = useRef(new Map())
  const samplesRef = useRef(new Map())
  const effectsRef = useRef(new Map())
  const sequencerRef = useRef(null)
  
  // Performance optimization
  const bufferPool = useRef(new Map())
  const workerRef = useRef(null)

  // Initialize Tone.js and set up audio context
  const initialize = useCallback(async () => {
    try {
      await Tone.start()
      Tone.Transport.bpm.value = bpm
      
      // Set up audio worklet for high-performance processing
      const audioContext = Tone.getContext().rawContext
      
      // Initialize worker for heavy computations
      workerRef.current = new Worker(new URL('../workers/audioWorker.js', import.meta.url))
      
      // Set up master effects chain
      const masterCompressor = new Tone.Compressor({
        threshold: -24,
        ratio: 12,
        attack: 0.003,
        release: 0.25
      }).toDestination()
      
      const masterLimiter = new Tone.Limiter(-1).connect(masterCompressor)
      Tone.Destination.chain(masterLimiter, masterCompressor)
      
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize audio engine:', error)
    }
  }, [bpm])

  // Create and manage synthesizers
  const createSynth = useCallback((type = SYNTH_TYPES.FM, options = {}) => {
    let synth
    
    switch (type) {
      case SYNTH_TYPES.FM:
        synth = new Tone.FMSynth({
          harmonicity: 1,
          modulationIndex: 10,
          ...options
        })
        break
      case SYNTH_TYPES.AM:
        synth = new Tone.AMSynth({
          harmonicity: 2,
          ...options
        })
        break
      case SYNTH_TYPES.MONO:
        synth = new Tone.MonoSynth({
          oscillator: { type: 'square' },
          envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.2,
            release: 0.2
          },
          ...options
        })
        break
      case SYNTH_TYPES.POLY:
        synth = new Tone.PolySynth({
          maxPolyphony: 6,
          ...options
        })
        break
      default:
        synth = new Tone.Synth(options)
    }
    
    // Add effects chain
    const filter = new Tone.Filter(options.filterFreq || 20000, 'lowpass')
    const delay = new Tone.FeedbackDelay(options.delayTime || 0, options.delayFeedback || 0)
    const reverb = new Tone.Reverb(options.reverbDecay || 0)
    
    synth.chain(filter, delay, reverb, Tone.Destination)
    
    const id = crypto.randomUUID()
    synthsRef.current.set(id, { synth, effects: { filter, delay, reverb } })
    
    return id
  }, [])

  // Load and manage samples
  const loadSample = useCallback(async (url, type = SAMPLE_TYPES.KICK) => {
    try {
      // Check buffer pool first
      if (bufferPool.current.has(url)) {
        const buffer = bufferPool.current.get(url)
        const player = new Tone.Player(buffer).toDestination()
        const id = crypto.randomUUID()
        samplesRef.current.set(id, { player, type })
        return id
      }
      
      // Load new sample
      const buffer = new Tone.Buffer(url)
      bufferPool.current.set(url, buffer)
      
      const player = new Tone.Player(buffer).toDestination()
      const id = crypto.randomUUID()
      samplesRef.current.set(id, { player, type })
      
      return id
    } catch (error) {
      console.error('Failed to load sample:', error)
      return null
    }
  }, [])

  // Play note or sample
  const playSound = useCallback((id, note = 'C4', time = Tone.now(), velocity = 1) => {
    if (synthsRef.current.has(id)) {
      const { synth } = synthsRef.current.get(id)
      synth.triggerAttackRelease(note, '8n', time, velocity)
    } else if (samplesRef.current.has(id)) {
      const { player } = samplesRef.current.get(id)
      player.start(time)
    }
  }, [])

  // Update effect parameters
  const updateEffect = useCallback((synthId, effectType, params) => {
    if (!synthsRef.current.has(synthId)) return
    
    const { effects } = synthsRef.current.get(synthId)
    const effect = effects[effectType]
    
    if (effect) {
      Object.entries(params).forEach(([param, value]) => {
        if (param in effect) {
          effect[param] = value
        }
      })
    }
  }, [])

  // Clean up resources
  const cleanup = useCallback(() => {
    synthsRef.current.forEach(({ synth, effects }) => {
      Object.values(effects).forEach(effect => effect.dispose())
      synth.dispose()
    })
    
    samplesRef.current.forEach(({ player }) => player.dispose())
    
    synthsRef.current.clear()
    samplesRef.current.clear()
    bufferPool.current.clear()
    
    if (workerRef.current) {
      workerRef.current.terminate()
    }
  }, [])

  // Set up sequencer
  const setupSequencer = useCallback((patterns, subdivision = '16n') => {
    if (sequencerRef.current) {
      sequencerRef.current.dispose()
    }

    sequencerRef.current = new Tone.Sequence((time, step) => {
      patterns.forEach(({ id, pattern, velocity }) => {
        if (pattern[step]) {
          playSound(id, 'C4', time, velocity?.[step] ?? 1)
        }
      })
    }, [...Array(16).keys()], subdivision)

    sequencerRef.current.start(0)
  }, [playSound])

  // Transport controls
  const startTransport = useCallback(() => Tone.Transport.start(), [])
  const stopTransport = useCallback(() => Tone.Transport.stop(), [])
  const setTempo = useCallback((newBpm) => {
    setBpm(newBpm)
    Tone.Transport.bpm.value = newBpm
  }, [])

  useEffect(() => {
    if (!isInitialized) {
      initialize().then(() => setIsReady(true))
    }

    return () => {
      cleanup()
    }
  }, [initialize, cleanup, isInitialized])

  return {
    isReady,
    createSynth,
    loadSample,
    playSound,
    updateEffect,
    setupSequencer,
    startTransport,
    stopTransport,
    setTempo,
    SYNTH_TYPES,
    SAMPLE_TYPES,
  }
} 