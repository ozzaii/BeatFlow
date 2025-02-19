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

const MASTER_EFFECTS = {
  compressor: {
    threshold: -24,
    ratio: 12,
    attack: 0.003,
    release: 0.25,
    knee: 30
  },
  limiter: {
    threshold: -1,
    release: 0.1
  },
  eq: {
    low: 0,
    mid: 0,
    high: 0,
    lowFrequency: 200,
    highFrequency: 2600
  }
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

  const masterBusRef = useRef(null)
  const masterCompressorRef = useRef(null)
  const masterLimiterRef = useRef(null)
  const masterEQRef = useRef(null)
  const analyserRef = useRef(null)
  const [masterVolume, setMasterVolume] = useState(0)
  const [masterMeter, setMasterMeter] = useState({ left: -60, right: -60 })
  const [cpuLoad, setCpuLoad] = useState(0)
  const rafRef = useRef(null)

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

  // Initialize master bus and effects
  useEffect(() => {
    const setupMasterBus = async () => {
      // Create master EQ
      const eq = new Tone.EQ3({
        low: MASTER_EFFECTS.eq.low,
        mid: MASTER_EFFECTS.eq.mid,
        high: MASTER_EFFECTS.eq.high,
        lowFrequency: MASTER_EFFECTS.eq.lowFrequency,
        highFrequency: MASTER_EFFECTS.eq.highFrequency
      })

      // Create master compressor
      const compressor = new Tone.Compressor({
        threshold: MASTER_EFFECTS.compressor.threshold,
        ratio: MASTER_EFFECTS.compressor.ratio,
        attack: MASTER_EFFECTS.compressor.attack,
        release: MASTER_EFFECTS.compressor.release,
        knee: MASTER_EFFECTS.compressor.knee
      })

      // Create master limiter
      const limiter = new Tone.Limiter({
        threshold: MASTER_EFFECTS.limiter.threshold,
        release: MASTER_EFFECTS.limiter.release
      })

      // Create master channel
      const masterBus = new Tone.Channel({
        volume: masterVolume,
        mute: false,
        pan: 0
      }).toDestination()

      // Create analyzer
      const analyser = new Tone.Analyser({
        type: 'waveform',
        size: 1024
      })

      // Connect everything in series
      eq.connect(compressor)
      compressor.connect(limiter)
      limiter.connect(masterBus)
      masterBus.connect(analyser)

      // Store references
      masterEQRef.current = eq
      masterCompressorRef.current = compressor
      masterLimiterRef.current = limiter
      masterBusRef.current = masterBus
      analyserRef.current = analyser

      setIsReady(true)

      // Start metering
      startMetering()

      return () => {
        stopMetering()
        eq.dispose()
        compressor.dispose()
        limiter.dispose()
        masterBus.dispose()
        analyser.dispose()
      }
    }

    setupMasterBus()
  }, [masterVolume])

  // Metering
  const startMetering = useCallback(() => {
    const updateMeters = () => {
      if (masterBusRef.current && analyserRef.current) {
        const values = analyserRef.current.getValue()
        const rms = calculateRMS(values)
        setMasterMeter({
          left: Math.max(-60, 20 * Math.log10(rms)),
          right: Math.max(-60, 20 * Math.log10(rms))
        })
        setCpuLoad(Tone.context.currentTime / Tone.context.sampleTime * 100)
      }
      rafRef.current = requestAnimationFrame(updateMeters)
    }
    updateMeters()
  }, [])

  const stopMetering = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Utility functions
  const calculateRMS = (values) => {
    const squares = values.map(v => v * v)
    const mean = squares.reduce((a, b) => a + b) / squares.length
    return Math.sqrt(mean)
  }

  // Master bus controls
  const setMasterEQ = useCallback((band, value) => {
    if (masterEQRef.current) {
      masterEQRef.current[band].value = value
    }
  }, [])

  const setMasterCompressor = useCallback((param, value) => {
    if (masterCompressorRef.current) {
      masterCompressorRef.current[param] = value
    }
  }, [])

  const setMasterLimiter = useCallback((param, value) => {
    if (masterLimiterRef.current) {
      masterLimiterRef.current[param] = value
    }
  }, [])

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
    masterVolume,
    setMasterVolume,
    masterMeter,
    cpuLoad,
    setMasterEQ,
    setMasterCompressor,
    setMasterLimiter,
    getAnalyser: () => analyserRef.current,
    getMasterBus: () => masterBusRef.current
  }
}

export default useSoundEngine 