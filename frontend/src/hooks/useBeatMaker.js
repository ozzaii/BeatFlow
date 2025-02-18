import { useState, useEffect, useCallback, useRef } from 'react'
import BeatMaker from '../lib/BeatMaker'

const DEFAULT_CONFIG = {
  bpm: 128,
  bars: 4,
  beatsPerBar: 4,
  resolution: 16,
  enableCollaboration: false,
}

export const useBeatMaker = (config = {}) => {
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const beatMakerRef = useRef(null)
  const audioContextRef = useRef(null)

  // Initialize BeatMaker
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        
        beatMakerRef.current = new BeatMaker({
          ...DEFAULT_CONFIG,
          ...config,
          audioContext: audioContextRef.current,
        })

        // Set up default tracks
        await setupDefaultTracks()
        
        setIsReady(true)
      } catch (error) {
        console.error('Failed to initialize BeatMaker:', error)
      }
    }

    initAudio()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Setup default tracks with sample loading
  const setupDefaultTracks = async () => {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const kickBuffer = await loadSample(`${baseUrl}samples/kick.wav`)
    const snareBuffer = await loadSample(`${baseUrl}samples/snare.wav`)
    const hihatBuffer = await loadSample(`${baseUrl}samples/hihat.wav`)

    beatMakerRef.current.addTrack('Kick', [kickBuffer])
    beatMakerRef.current.addTrack('Snare', [snareBuffer])
    beatMakerRef.current.addTrack('Hi-Hat', [hihatBuffer])
  }

  // Load audio sample
  const loadSample = async (url) => {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load sample: ${url}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      return await audioContextRef.current.decodeAudioData(arrayBuffer)
    } catch (error) {
      console.error('Error loading sample:', error)
      throw error
    }
  }

  // Transport controls
  const togglePlay = useCallback(() => {
    if (!beatMakerRef.current) return

    if (isPlaying) {
      beatMakerRef.current.stop()
    } else {
      beatMakerRef.current.start()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const stop = useCallback(() => {
    if (!beatMakerRef.current) return
    beatMakerRef.current.stop()
    setIsPlaying(false)
    setCurrentStep(0)
  }, [])

  // Track controls
  const toggleStep = useCallback((trackName, step) => {
    if (!beatMakerRef.current) return
    const track = beatMakerRef.current.tracks.get(trackName)
    if (track) {
      track.pattern[step] = !track.pattern[step]
      beatMakerRef.current.emit('patternChange', { track: trackName, pattern: track.pattern })
    }
  }, [])

  const setVolume = useCallback((trackName, value) => {
    if (!beatMakerRef.current) return
    beatMakerRef.current.setVolume(trackName, value)
  }, [])

  const toggleMute = useCallback((trackName) => {
    if (!beatMakerRef.current) return
    return beatMakerRef.current.toggleMute(trackName)
  }, [])

  // Effect controls
  const setEffectParam = useCallback((effectName, param, value) => {
    if (!beatMakerRef.current) return
    beatMakerRef.current.setEffectParam(effectName, param, value)
  }, [])

  return {
    isReady,
    isPlaying,
    currentStep,
    togglePlay,
    stop,
    toggleStep,
    setVolume,
    toggleMute,
    setEffectParam,
    beatMaker: beatMakerRef.current,
  }
} 