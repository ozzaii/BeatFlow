import {
  Box,
  Grid,
  HStack,
  VStack,
  IconButton,
  useColorModeValue,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  Select,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  SimpleGrid,
  Switch,
  Collapse,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { FaPlay, FaStop, FaRandom, FaTrash, FaShare, FaSave, FaDownload, FaHeart, FaComment, FaMinus, FaPlus, FaVolumeUp, FaVolumeMute, FaChevronUp, FaChevronDown } from 'react-icons/fa'
import * as Tone from 'tone'
import { beatApi } from '../services/api'
import { useAuth } from '../hooks/useAuth.jsx'

const TOTAL_STEPS = 64
const DEFAULT_BPM = 128

const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(0, 255, 255, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 255, 0); }
`

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff; }
  50% { box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff; }
  100% { box-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff; }
`

const TRACKS = [
  { id: 'kick', name: 'Kick', color: 'neon.blue', icon: '🥁' },
  { id: 'snare', name: 'Snare', color: 'neon.pink', icon: '🔥' },
  { id: 'hihat', name: 'Hi-Hat', color: 'neon.yellow', icon: '⚡' },
  { id: 'synth', name: 'Synth', color: 'neon.green', icon: '🎹' },
]

const EDM_PRESETS = {
  'House Basic': {
    kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    synth: [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0]
  },
  'Techno Groove': {
    kick: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,0,0],
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    synth: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
  },
  'Trance Build': {
    kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,1,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0],
    hihat: [0,1,0,1, 0,1,0,1, 1,1,1,1, 1,1,1,1],
    synth: [1,1,1,1, 0,0,0,0, 1,1,1,1, 0,0,0,0]
  },
  'Dubstep Drop': {
    kick: [1,0,0,0, 1,0,1,0, 1,0,0,0, 1,1,0,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,0],
    hihat: [1,1,1,1, 0,1,1,1, 1,1,1,1, 0,1,1,1],
    synth: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,1,1,1]
  }
}

const VISUALIZATION_STYLES = {
  BARS: 'bars',
  WAVE: 'wave',
  CIRCLE: 'circle',
  PARTICLES: 'particles',
  MATRIX: 'matrix'
}

const INSTRUMENTS = {
  DRUMS: {
    kick: {
      type: 'membrane',
      options: {
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.4,
          sustain: 0.01,
          release: 1.4,
          attackCurve: 'exponential'
        }
      },
      presets: {
        '909': { pitchDecay: 0.03, octaves: 8, envelope: { decay: 0.3, release: 1.2 } },
        '808': { pitchDecay: 0.08, octaves: 12, envelope: { decay: 0.6, release: 1.8 } },
        'Acoustic': { pitchDecay: 0.02, octaves: 6, envelope: { decay: 0.2, release: 0.8 } }
      }
    },
    snare: {
      type: 'noise',
      options: {
        noise: { type: 'white' },
        envelope: {
          attack: 0.001,
          decay: 0.2,
          sustain: 0,
          release: 0.2
        }
      },
      presets: {
        '909': { noise: { type: 'white' }, envelope: { decay: 0.25 } },
        '808': { noise: { type: 'pink' }, envelope: { decay: 0.3 } },
        'Acoustic': { noise: { type: 'brown' }, envelope: { decay: 0.15 } }
      }
    },
    hihat: {
      type: 'metal',
      options: {
        frequency: 200,
        envelope: {
          attack: 0.001,
          decay: 0.1,
          release: 0.01
        },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      },
      presets: {
        '909': { frequency: 280, harmonicity: 4.8, modulationIndex: 28 },
        '808': { frequency: 220, harmonicity: 5.5, modulationIndex: 35 },
        'Acoustic': { frequency: 180, harmonicity: 4.2, modulationIndex: 25 }
      }
    }
  },
  SYNTHS: {
    lead: {
      type: 'fm',
      options: {
        harmonicity: 2,
        modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.1
        },
        modulation: { type: 'square' },
        modulationEnvelope: {
          attack: 0.5,
          decay: 0,
          sustain: 1,
          release: 0.5
        }
      }
    },
    pad: {
      type: 'am',
      options: {
        harmonicity: 3,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.5,
          decay: 0.5,
          sustain: 1,
          release: 1
        },
        modulation: { type: 'sine' },
        modulationEnvelope: {
          attack: 0.5,
          decay: 0,
          sustain: 1,
          release: 0.5
        }
      }
    },
    bass: {
      type: 'mono',
      options: {
        oscillator: { type: 'square4' },
        envelope: {
          attack: 0.05,
          decay: 0.2,
          sustain: 0.4,
          release: 0.4
        },
        filter: {
          Q: 6,
          type: 'lowpass',
          rolloff: -24
        },
        filterEnvelope: {
          attack: 0.02,
          decay: 0.2,
          sustain: 0.5,
          release: 0.2,
          baseFrequency: 200,
          octaves: 3,
          exponent: 2
        }
      }
    },
    pluck: {
      type: 'pluck',
      options: {
        attackNoise: 1,
        dampening: 4000,
        resonance: 0.98
      }
    }
  }
}

const EFFECTS = {
  reverb: {
    type: 'reverb',
    options: {
      decay: 1.5,
      preDelay: 0.01,
      wet: 0.3
    },
    presets: {
      'Small Room': { decay: 1.0, preDelay: 0.01, wet: 0.2 },
      'Large Hall': { decay: 3.0, preDelay: 0.03, wet: 0.4 },
      'Cosmic': { decay: 5.0, preDelay: 0.05, wet: 0.5 }
    }
  },
  delay: {
    type: 'delay',
    options: {
      delayTime: '8n',
      feedback: 0.5,
      wet: 0.3
    },
    presets: {
      'Slap': { delayTime: '16n', feedback: 0.3, wet: 0.25 },
      'Echo': { delayTime: '4n', feedback: 0.6, wet: 0.35 },
      'Dub': { delayTime: '8n.', feedback: 0.7, wet: 0.4 }
    }
  },
  chorus: {
    type: 'chorus',
    options: {
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.7,
      wet: 0.3
    }
  },
  phaser: {
    type: 'phaser',
    options: {
      frequency: 0.5,
      octaves: 3,
      stages: 10,
      wet: 0.3
    }
  },
  distortion: {
    type: 'distortion',
    options: {
      distortion: 0.4,
      wet: 0.3
    }
  },
  bitcrusher: {
    type: 'bitCrusher',
    options: {
      bits: 8,
      wet: 0.3
    }
  }
}

const MIXER_CHANNELS = {
  kick: { volume: 0, pan: 0, solo: false, mute: false },
  snare: { volume: 0, pan: 0, solo: false, mute: false },
  hihat: { volume: 0, pan: 0, solo: false, mute: false },
  synth: { volume: 0, pan: 0, solo: false, mute: false }
}

const BeatMaker = ({ beatId }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const { user } = useAuth()
  
  const [patterns, setPatterns] = useState(
    TRACKS.reduce((acc, track) => ({
      ...acc,
      [track.id]: Array(TOTAL_STEPS).fill(false)
    }), {})
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [bpm, setBpm] = useState(DEFAULT_BPM)
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('House')
  const [comment, setComment] = useState('')
  const [beat, setBeat] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [visualStyle, setVisualStyle] = useState(VISUALIZATION_STYLES.BARS)
  const [activeEffects, setActiveEffects] = useState({
    reverb: true,
    delay: true,
    chorus: false,
    phaser: false,
    distortion: false,
    bitcrusher: false
  })
  const [mixerSettings, setMixerSettings] = useState(MIXER_CHANNELS)
  const [drumKit, setDrumKit] = useState('909')
  const [effectPresets, setEffectPresets] = useState({
    reverb: 'Small Room',
    delay: 'Slap'
  })
  const [showMixer, setShowMixer] = useState(false)
  const [showEffects, setShowEffects] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedNotes, setRecordedNotes] = useState([])
  const [quantize, setQuantize] = useState(true)
  const [swing, setSwing] = useState(0)
  
  const bgColor = useColorModeValue('rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.95)')
  const stepColor = useColorModeValue('rgba(20, 20, 20, 0.8)', 'rgba(30, 30, 30, 0.8)')
  const currentStepColor = useColorModeValue('#ff00ff', '#ff00ff')
  const textColor = '#00ffff'
  const borderGlow = `0 0 10px ${textColor}, 0 0 20px ${textColor}, 0 0 30px ${textColor}`

  const instrumentsRef = useRef(null)
  const analyserRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const effectsRef = useRef(null)

  // Load beat if beatId is provided
  useEffect(() => {
    if (beatId) {
      loadBeat()
    }
  }, [beatId])

  const loadBeat = async () => {
    try {
      const response = await beatApi.getBeat(beatId)
      const loadedBeat = response.data
      setBeat(loadedBeat)
      setPatterns(loadedBeat.patterns)
      setBpm(loadedBeat.bpm)
      setTitle(loadedBeat.title)
      setGenre(loadedBeat.genre)
    } catch (error) {
      toast({
        title: 'Error loading beat',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // Initialize audio with enhanced effects
  useEffect(() => {
    const setupAudio = async () => {
      // Create master bus with limiter and analyzer
      const masterBus = new Tone.Channel({
        volume: 0,
        pan: 0,
        limiter: new Tone.Limiter(-3),
        analyzer: new Tone.Analyser('waveform', 128)
      }).toDestination()

      // Create mixer channels with effects
      const channels = {}
      Object.keys(MIXER_CHANNELS).forEach(channel => {
        channels[channel] = new Tone.Channel({
          volume: mixerSettings[channel].volume,
          pan: mixerSettings[channel].pan,
          mute: mixerSettings[channel].mute,
          solo: mixerSettings[channel].solo
        }).connect(masterBus)
      })

      // Initialize instruments with selected drum kit
      const instruments = {}
      Object.entries(INSTRUMENTS.DRUMS).forEach(([name, config]) => {
        const preset = config.presets[drumKit]
        instruments[name] = new Tone[config.type === 'membrane' ? 'MembraneSynth' : 
                                   config.type === 'noise' ? 'NoiseSynth' : 
                                   'MetalSynth']({
          ...config.options,
          ...preset
        }).connect(channels[name])
      })

      // Initialize effects with presets
      const effects = {}
      Object.entries(EFFECTS).forEach(([name, config]) => {
        const preset = config.presets[effectPresets[name]]
        effects[name] = new Tone[config.type === 'reverb' ? 'Reverb' :
                                config.type === 'delay' ? 'FeedbackDelay' :
                                config.type]({
          ...config.options,
          ...preset
        })
      })

      // Connect effects to master bus
      Object.values(effects).reduce((chain, effect) => chain.connect(effect), masterBus)

      instrumentsRef.current = instruments
      effectsRef.current = effects
      
      // Set up transport
      Tone.Transport.bpm.value = bpm
      Tone.Transport.swing = swing
      Tone.Transport.swingSubdivision = '16n'

      // Create sequencer with quantization
      const loop = new Tone.Sequence(
        (time, step) => {
          Object.entries(patterns).forEach(([trackId, pattern]) => {
            if (pattern[step] && !mixerSettings[trackId].mute && 
               (!Object.values(mixerSettings).some(ch => ch.solo) || mixerSettings[trackId].solo)) {
              const instrument = instruments[trackId]
              if (trackId === 'synth') {
                const notes = ['C4', 'E4', 'G4', 'A4']
                instrument.triggerAttackRelease(
                  notes[Math.floor(step/4) % notes.length],
                  quantize ? '16n' : '32n',
                  time,
                  velocities[trackId][step] / 127
                )
              } else {
                instrument.triggerAttackRelease(
                  trackId === 'kick' ? 'C1' : 'C4',
                  quantize ? '16n' : '32n',
                  time,
                  velocities[trackId][step] / 127
                )
              }
            }
          })
          setCurrentStep(step)
          updateVisualization()
        },
        [...Array(TOTAL_STEPS).keys()],
        '16n'
      )

      return () => {
        loop.dispose()
        Object.values(instruments).forEach(inst => inst.dispose())
        Object.values(effects).forEach(effect => effect.dispose())
        Object.values(channels).forEach(channel => channel.dispose())
        masterBus.dispose()
      }
    }

    setupAudio()
  }, [bpm, patterns, mixerSettings, drumKit, effectPresets, quantize, swing])

  // Enhanced visualization
  const drawVisualization = (ctx, dataArray, bufferLength, canvas) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    switch (visualStyle) {
      case VISUALIZATION_STYLES.BARS:
        drawBars(ctx, dataArray, bufferLength, canvas)
        break
      case VISUALIZATION_STYLES.WAVE:
        drawWave(ctx, dataArray, bufferLength, canvas)
        break
      case VISUALIZATION_STYLES.CIRCLE:
        drawCircle(ctx, dataArray, bufferLength, canvas)
        break
      case VISUALIZATION_STYLES.PARTICLES:
        drawParticles(ctx, dataArray, bufferLength, canvas)
        break
      case VISUALIZATION_STYLES.MATRIX:
        drawMatrix(ctx, dataArray, bufferLength, canvas)
        break
    }
  }

  const drawBars = (ctx, dataArray, bufferLength, canvas) => {
    const barWidth = (canvas.width / bufferLength) * 2.5
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#00ffff')
      gradient.addColorStop(1, '#ff00ff')
      
      ctx.fillStyle = gradient
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }
  }

  const drawWave = (ctx, dataArray, bufferLength, canvas) => {
    ctx.beginPath()
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 2

    const sliceWidth = canvas.width / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * canvas.height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()
  }

  const drawCircle = (ctx, dataArray, bufferLength, canvas) => {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    ctx.beginPath()
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 2

    for (let i = 0; i < bufferLength; i++) {
      const angle = (i * 2 * Math.PI) / bufferLength
      const value = dataArray[i] / 128.0
      const x = centerX + radius * Math.cos(angle) * value
      const y = centerY + radius * Math.sin(angle) * value

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.closePath()
    ctx.stroke()
  }

  const drawParticles = (ctx, dataArray, bufferLength, canvas) => {
    const particles = []
    const particleCount = 50

    for (let i = 0; i < particleCount; i++) {
      const value = dataArray[i % bufferLength] / 255.0
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: value * 20,
        speed: value * 5
      })
    }

    particles.forEach(particle => {
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      )
      gradient.addColorStop(0, '#00ffff')
      gradient.addColorStop(1, 'transparent')

      ctx.beginPath()
      ctx.fillStyle = gradient
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()

      particle.y = (particle.y + particle.speed) % canvas.height
    })
  }

  const drawMatrix = (ctx, dataArray, bufferLength, canvas) => {
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'
    ctx.font = '10px monospace'

    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i]
      const char = String.fromCharCode(33 + Math.floor(Math.random() * 93))
      const x = (i * 10) % canvas.width
      const y = Math.floor((i * 10) / canvas.width) * 10

      if (value > 128) {
        ctx.fillText(char, x, y)
      }
    }
  }

  const startVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      drawVisualization(ctx, dataArray, bufferLength, canvas)
    }

    draw()
  }

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  // Load preset patterns
  const loadPreset = (presetName) => {
    const preset = EDM_PRESETS[presetName]
    if (!preset) return

    setPatterns(prev => {
      const newPatterns = { ...prev }
      Object.entries(preset).forEach(([trackId, pattern]) => {
        newPatterns[trackId] = Array(64).fill(false).map((_, i) => !!pattern[i % 16])
      })
      return newPatterns
    })
    setSelectedPreset(presetName)
  }

  const toggleStep = useCallback((trackId, index) => {
    setPatterns(prev => {
      const newPatterns = { ...prev }
      const newValue = !prev[trackId][index]
      newPatterns[trackId] = prev[trackId].map((step, i) => i === index ? newValue : step)
      
      // Play sound immediately if turning on
      if (newValue && instrumentsRef.current) {
        if (trackId === 'synth') {
          const notes = ['C4', 'E4', 'G4', 'A4']
          instrumentsRef.current[trackId].triggerAttackRelease(notes[Math.floor(index/4) % notes.length], '8n')
        } else {
          instrumentsRef.current[trackId].triggerAttackRelease(trackId === 'kick' ? 'C1' : 'C4', '8n')
        }
      }
      
      return newPatterns
    })
  }, [])

  const randomize = useCallback(() => {
    setPatterns(prev => 
      Object.keys(prev).reduce((acc, trackId) => ({
        ...acc,
        [trackId]: Array(TOTAL_STEPS).fill(false).map(() => Math.random() > 0.8)
      }), {})
    )
  }, [])

  const clear = useCallback(() => {
    setPatterns(prev =>
      Object.keys(prev).reduce((acc, trackId) => ({
        ...acc,
        [trackId]: Array(TOTAL_STEPS).fill(false)
      }), {})
    )
  }, [])

  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to be logged in to save beats',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const beatData = {
        title,
        patterns,
        bpm,
        genre,
      }

      if (beatId) {
        await beatApi.updateBeat(beatId, beatData)
      } else {
        await beatApi.createBeat(beatData)
      }

      toast({
        title: 'Success',
        description: `Beat ${beatId ? 'updated' : 'saved'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Error saving beat',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to be logged in to like beats',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await beatApi.likeBeat(beatId)
      loadBeat() // Reload beat to get updated likes
    } catch (error) {
      toast({
        title: 'Error liking beat',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleComment = async () => {
    if (!comment.trim()) return

    try {
      await beatApi.commentOnBeat(beatId, comment)
      setComment('')
      loadBeat() // Reload beat to get updated comments
      onClose()
    } catch (error) {
      toast({
        title: 'Error posting comment',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box
      position="relative"
      borderRadius="xl"
      bg="dark.100"
      p={6}
      boxShadow="0 0 30px rgba(0, 255, 255, 0.1)"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 'xl',
        border: '1px solid',
        borderColor: 'brand.500',
        opacity: 0.3,
        pointerEvents: 'none',
      }}
    >
      <VStack spacing={8}>
        {/* Transport Controls with Recording */}
        <HStack spacing={4} justify="center" w="full">
          <IconButton
            icon={isPlaying ? <FaStop /> : <FaPlay />}
            onClick={isPlaying ? stop : togglePlay}
            size="lg"
            variant="neon"
            aria-label={isPlaying ? 'Stop' : 'Play'}
            _hover={{
              transform: 'scale(1.1)',
              boxShadow: '0 0 20px var(--chakra-colors-brand-500)',
            }}
          />
          <IconButton
            icon={<FaRandom />}
            onClick={() => randomizePattern()}
            size="lg"
            variant="neon"
            aria-label="Randomize"
            _hover={{
              transform: 'scale(1.1)',
              boxShadow: '0 0 20px var(--chakra-colors-brand-500)',
            }}
          />
          <IconButton
            icon={isRecording ? <FaStop /> : <FaCircle />}
            onClick={() => setIsRecording(!isRecording)}
            size="lg"
            variant="neon"
            color={isRecording ? 'red.500' : 'whiteAlpha.900'}
            aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
            _hover={{
              transform: 'scale(1.1)',
              boxShadow: '0 0 20px var(--chakra-colors-red-500)',
            }}
          />
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FaShare />}
              size="lg"
              variant="neon"
              aria-label="Share"
              _hover={{
                transform: 'scale(1.1)',
                boxShadow: '0 0 20px var(--chakra-colors-brand-500)',
              }}
            />
            <MenuList bg="dark.200" borderColor="brand.500">
              <MenuItem onClick={onOpen} icon={<FaSave />}>
                Save Beat
              </MenuItem>
              <MenuItem onClick={exportBeat} icon={<FaDownload />}>
                Export
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        {/* Enhanced Controls */}
        <HStack spacing={8} w="full" justify="center">
          {/* BPM Control */}
          <VStack spacing={2}>
            <Text color="whiteAlpha.900" fontSize="sm" fontWeight="bold">
              BPM
            </Text>
            <HStack spacing={2}>
              <IconButton
                icon={<FaMinus />}
                size="sm"
                variant="ghost"
                onClick={() => setBpm(Math.max(60, bpm - 1))}
              />
              <Text color="brand.500" fontSize="xl" fontWeight="bold" w="60px" textAlign="center">
                {bpm}
              </Text>
              <IconButton
                icon={<FaPlus />}
                size="sm"
                variant="ghost"
                onClick={() => setBpm(Math.min(200, bpm + 1))}
              />
            </HStack>
          </VStack>

          {/* Swing Control */}
          <VStack spacing={2}>
            <Text color="whiteAlpha.900" fontSize="sm" fontWeight="bold">
              Swing
            </Text>
            <Slider
              value={swing}
              min={0}
              max={1}
              step={0.1}
              onChange={setSwing}
              w="100px"
            >
              <SliderTrack bg="dark.300">
                <SliderFilledTrack bg="brand.500" />
              </SliderTrack>
              <SliderThumb boxSize={4} bg="brand.500" />
            </Slider>
          </VStack>

          {/* Quantize Toggle */}
          <VStack spacing={2}>
            <Text color="whiteAlpha.900" fontSize="sm" fontWeight="bold">
              Quantize
            </Text>
            <Switch
              isChecked={quantize}
              onChange={(e) => setQuantize(e.target.checked)}
              colorScheme="brand"
            />
          </VStack>

          {/* Drum Kit Selector */}
          <VStack spacing={2}>
            <Text color="whiteAlpha.900" fontSize="sm" fontWeight="bold">
              Drum Kit
            </Text>
            <Select
              value={drumKit}
              onChange={(e) => setDrumKit(e.target.value)}
              variant="filled"
              size="sm"
              w="120px"
            >
              <option value="909">TR-909</option>
              <option value="808">TR-808</option>
              <option value="Acoustic">Acoustic</option>
            </Select>
          </VStack>
        </HStack>

        {/* Track Grid with Enhanced Features */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
          {TRACKS.map((track) => (
            <Box
              key={track.id}
              bg="dark.200"
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="whiteAlpha.100"
              _hover={{
                borderColor: track.color,
                boxShadow: `0 0 20px ${track.color}`,
                transform: 'translateY(-2px)',
              }}
              transition="all 0.2s"
            >
              <VStack spacing={4}>
                <HStack justify="space-between" w="full">
                  <HStack>
                    <Text fontSize="2xl">{track.icon}</Text>
                    <Text
                      color="whiteAlpha.900"
                      fontSize="lg"
                      fontWeight="bold"
                    >
                      {track.name}
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <IconButton
                      icon={<FaSolo />}
                      size="sm"
                      variant={mixerSettings[track.id].solo ? "solid" : "ghost"}
                      colorScheme="yellow"
                      onClick={() => toggleSolo(track.id)}
                      aria-label="Solo"
                    />
                    <IconButton
                      icon={<FaMute />}
                      size="sm"
                      variant={mixerSettings[track.id].mute ? "solid" : "ghost"}
                      colorScheme="red"
                      onClick={() => toggleMute(track.id)}
                      aria-label="Mute"
                    />
                    <IconButton
                      icon={<FaTrash />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => clearPattern(track.id)}
                      aria-label="Clear Pattern"
                    />
                  </HStack>
                </HStack>

                {/* Pattern Grid with Velocity */}
                <Grid
                  templateColumns={`repeat(${TOTAL_STEPS / 4}, 1fr)`}
                  gap={1}
                  w="full"
                >
                  {patterns[track.id].map((isActive, index) => (
                    <Box
                      key={index}
                      position="relative"
                      h="50px"
                    >
                      <Box
                        bg={isActive ? track.color : 'dark.300'}
                        w="full"
                        h={isActive ? `${(velocities[track.id][index] / 127) * 100}%` : "full"}
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => toggleStep(track.id, index)}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          openVelocityModal(track.id, index)
                        }}
                        opacity={currentStep === index ? 1 : 0.7}
                        transform={currentStep === index ? 'scale(1.1)' : 'scale(1)'}
                        transition="all 0.1s"
                        position="absolute"
                        bottom={0}
                        _hover={{
                          opacity: 1,
                          transform: 'scale(1.1)',
                        }}
                      />
                    </Box>
                  ))}
                </Grid>

                {/* Channel Strip */}
                <HStack w="full" spacing={4}>
                  <Slider
                    value={mixerSettings[track.id].volume}
                    min={-60}
                    max={6}
                    onChange={(v) => updateMixerSetting(track.id, 'volume', v)}
                    orientation="vertical"
                    h="100px"
                  >
                    <SliderTrack bg="dark.300">
                      <SliderFilledTrack bg={track.color} />
                    </SliderTrack>
                    <SliderThumb boxSize={3} bg={track.color} />
                  </Slider>
                  <Slider
                    value={mixerSettings[track.id].pan}
                    min={-1}
                    max={1}
                    onChange={(v) => updateMixerSetting(track.id, 'pan', v)}
                    w="100px"
                  >
                    <SliderTrack bg="dark.300">
                      <SliderFilledTrack bg={track.color} />
                    </SliderTrack>
                    <SliderThumb boxSize={3} bg={track.color} />
                  </Slider>
                </HStack>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>

        {/* Effects Rack */}
        <Box w="full">
          <HStack justify="space-between" mb={4}>
            <Text
              color="whiteAlpha.900"
              fontSize="xl"
              fontWeight="bold"
            >
              Effects
            </Text>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowEffects(!showEffects)}
              rightIcon={showEffects ? <FaChevronUp /> : <FaChevronDown />}
            >
              {showEffects ? 'Hide' : 'Show'} Effects
            </Button>
          </HStack>
          <Collapse in={showEffects}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {Object.entries(EFFECTS).map(([effect, config]) => (
                <Box
                  key={effect}
                  bg="dark.200"
                  p={4}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={activeEffects[effect] ? 'brand.500' : 'whiteAlpha.100'}
                >
                  <VStack spacing={4}>
                    <HStack justify="space-between" w="full">
                      <Text
                        color={activeEffects[effect] ? 'brand.500' : 'whiteAlpha.700'}
                        fontSize="lg"
                        fontWeight="bold"
                        textTransform="capitalize"
                      >
                        {effect}
                      </Text>
                      <Switch
                        isChecked={activeEffects[effect]}
                        onChange={() => toggleEffect(effect)}
                        colorScheme="brand"
                      />
                    </HStack>
                    <Select
                      value={effectPresets[effect]}
                      onChange={(e) => updateEffectPreset(effect, e.target.value)}
                      variant="filled"
                      size="sm"
                      isDisabled={!activeEffects[effect]}
                    >
                      {Object.keys(config.presets).map(preset => (
                        <option key={preset} value={preset}>{preset}</option>
                      ))}
                    </Select>
                    {activeEffects[effect] && (
                      <SimpleGrid columns={2} spacing={4} w="full">
                        {Object.entries(config.options).map(([param, value]) => (
                          <VStack key={param} spacing={1} align="start">
                            <Text
                              color="whiteAlpha.700"
                              fontSize="xs"
                              textTransform="capitalize"
                            >
                              {param}
                            </Text>
                            <Slider
                              value={value * 100}
                              min={0}
                              max={100}
                              onChange={(v) => updateEffectParam(effect, param, v / 100)}
                              size="sm"
                            >
                              <SliderTrack bg="dark.300">
                                <SliderFilledTrack bg="brand.500" />
                              </SliderTrack>
                              <SliderThumb boxSize={2} bg="brand.500" />
                            </Slider>
                          </VStack>
                        ))}
                      </SimpleGrid>
                    )}
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </Collapse>
        </Box>

        {/* Visualization */}
        <Box
          w="full"
          h="200px"
          bg="dark.200"
          borderRadius="lg"
          overflow="hidden"
          position="relative"
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              filter: 'blur(1px)',
            }}
          />
        </Box>
      </VStack>

      {/* Save Beat Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay
          bg="blackAlpha.900"
          backdropFilter="blur(10px)"
        />
        <ModalContent
          bg="dark.200"
          borderColor="brand.500"
          borderWidth="1px"
          boxShadow="0 0 30px var(--chakra-colors-brand-500)"
        >
          <ModalHeader color="whiteAlpha.900">Save Your Beat</ModalHeader>
          <ModalCloseButton color="whiteAlpha.900" />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Input
                placeholder="Beat Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                variant="filled"
                bg="dark.300"
                borderColor="brand.500"
                _hover={{ bg: 'dark.400' }}
                _focus={{ bg: 'dark.400' }}
              />
              <Select
                placeholder="Select Genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                variant="filled"
                bg="dark.300"
                borderColor="brand.500"
                _hover={{ bg: 'dark.400' }}
                _focus={{ bg: 'dark.400' }}
              >
                <option value="House">House</option>
                <option value="Hip Hop">Hip Hop</option>
                <option value="Techno">Techno</option>
                <option value="Trap">Trap</option>
                <option value="Ambient">Ambient</option>
              </Select>
              <Textarea
                placeholder="Add a comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                variant="filled"
                bg="dark.300"
                borderColor="brand.500"
                _hover={{ bg: 'dark.400' }}
                _focus={{ bg: 'dark.400' }}
              />
              <Button
                colorScheme="brand"
                onClick={saveBeat}
                isLoading={isSaving}
                loadingText="Saving..."
                w="full"
              >
                Save Beat
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default BeatMaker 