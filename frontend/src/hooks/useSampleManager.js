import { useState, useEffect, useCallback, useRef } from 'react'
import * as Tone from 'tone'
import { openDB } from 'idb'

const DB_NAME = 'beatflow-samples'
const DB_VERSION = 1
const STORE_NAME = 'samples'

const SAMPLE_CATEGORIES = {
  DRUMS: {
    KICK: 'kick',
    SNARE: 'snare',
    HIHAT: 'hihat',
    CLAP: 'clap',
    PERCUSSION: 'percussion',
  },
  SYNTH: {
    BASS: 'bass',
    LEAD: 'lead',
    PAD: 'pad',
    FX: 'fx',
  },
}

export const useSampleManager = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  const dbRef = useRef(null)
  const bufferPool = useRef(new Map())
  const loadQueue = useRef([])
  const activeLoads = useRef(new Set())

  // Initialize IndexedDB
  const initializeDB = useCallback(async () => {
    try {
      dbRef.current = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          }
        },
      })
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
    }
  }, [])

  // Load sample from URL or cache
  const loadSample = useCallback(async (url, category, name) => {
    const id = `${category}-${name}`

    // Check memory cache first
    if (bufferPool.current.has(id)) {
      return bufferPool.current.get(id)
    }

    // Check IndexedDB cache
    try {
      const cached = await dbRef.current?.get(STORE_NAME, id)
      if (cached) {
        const buffer = await Tone.Buffer.fromArray(cached.audioData)
        bufferPool.current.set(id, buffer)
        return buffer
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error)
    }

    // Load from URL
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioContext = Tone.getContext().rawContext
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      // Cache in IndexedDB
      await dbRef.current?.put(STORE_NAME, {
        id,
        category,
        name,
        audioData: Array.from(audioBuffer.getChannelData(0)),
        timestamp: Date.now(),
      })

      // Cache in memory
      bufferPool.current.set(id, audioBuffer)
      
      return audioBuffer
    } catch (error) {
      console.error('Failed to load sample:', error)
      return null
    }
  }, [])

  // Load multiple samples with progress tracking
  const loadSamples = useCallback(async (samples) => {
    setIsLoading(true)
    setLoadingProgress(0)
    
    const total = samples.length
    let loaded = 0
    
    try {
      // Process in batches to avoid overwhelming the browser
      const batchSize = 4
      for (let i = 0; i < samples.length; i += batchSize) {
        const batch = samples.slice(i, i + batchSize)
        await Promise.all(
          batch.map(async ({ url, category, name }) => {
            await loadSample(url, category, name)
            loaded++
            setLoadingProgress((loaded / total) * 100)
          })
        )
      }
    } catch (error) {
      console.error('Failed to load samples:', error)
    } finally {
      setIsLoading(false)
    }
  }, [loadSample])

  // Load preset (collection of samples)
  const loadPreset = useCallback(async (preset) => {
    const samples = preset.samples.map(sample => ({
      url: sample.url,
      category: sample.category,
      name: sample.name,
    }))
    
    await loadSamples(samples)
  }, [loadSamples])

  // Clean up old samples from IndexedDB
  const cleanupCache = useCallback(async (maxAge = 7 * 24 * 60 * 60 * 1000) => {
    try {
      const now = Date.now()
      const all = await dbRef.current?.getAll(STORE_NAME)
      
      for (const sample of all) {
        if (now - sample.timestamp > maxAge) {
          await dbRef.current?.delete(STORE_NAME, sample.id)
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup cache:', error)
    }
  }, [])

  // Memory management
  const manageMemory = useCallback(() => {
    // If memory usage is high, clear some buffers from memory (but keep in IndexedDB)
    if (performance.memory && performance.memory.usedJSHeapSize > 0.8 * performance.memory.jsHeapSizeLimit) {
      const oldestEntries = Array.from(bufferPool.current.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
        .slice(0, Math.floor(bufferPool.current.size / 2))
      
      oldestEntries.forEach(([key]) => {
        bufferPool.current.delete(key)
      })
    }
  }, [])

  // Initialize
  useEffect(() => {
    initializeDB()
    
    // Clean up old samples periodically
    const cleanup = setInterval(() => {
      cleanupCache()
      manageMemory()
    }, 24 * 60 * 60 * 1000) // Daily cleanup
    
    return () => {
      clearInterval(cleanup)
      dbRef.current?.close()
    }
  }, [initializeDB, cleanupCache, manageMemory])

  return {
    isInitialized,
    isLoading,
    loadingProgress,
    loadSample,
    loadSamples,
    loadPreset,
    SAMPLE_CATEGORIES,
  }
} 