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
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { FaPlay, FaStop, FaRandom, FaTrash, FaShare, FaSave, FaDownload, FaHeart, FaComment } from 'react-icons/fa'
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
  { id: 'kick', name: 'Kick', color: '#00ffff' },
  { id: 'snare', name: 'Snare', color: '#ff00ff' },
  { id: 'hihat', name: 'Hi-Hat', color: '#ffff00' },
  { id: 'synth', name: 'Synth', color: '#00ff00' },
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
      }
    },
    clap: {
      type: 'noise',
      options: {
        noise: { type: 'pink' },
        envelope: {
          attack: 0.001,
          decay: 0.3,
          sustain: 0,
          release: 0.1
        }
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
      preDelay: 0.01
    }
  },
  delay: {
    type: 'delay',
    options: {
      delayTime: '8n',
      feedback: 0.5,
      wet: 0.3
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
    // Create audio context and analyser
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser

    // Create effects chain
    const effects = {
      reverb: new Tone.Reverb(EFFECTS.reverb.options),
      delay: new Tone.FeedbackDelay(EFFECTS.delay.options),
      chorus: new Tone.Chorus(EFFECTS.chorus.options),
      phaser: new Tone.Phaser(EFFECTS.phaser.options),
      distortion: new Tone.Distortion(EFFECTS.distortion.options),
      bitcrusher: new Tone.BitCrusher(EFFECTS.bitcrusher.options),
      limiter: new Tone.Limiter(-3)
    }

    // Initialize instruments with enhanced options
    const instruments = {
      kick: new Tone.MembraneSynth(INSTRUMENTS.DRUMS.kick.options),
      snare: new Tone.NoiseSynth(INSTRUMENTS.DRUMS.snare.options),
      hihat: new Tone.MetalSynth(INSTRUMENTS.DRUMS.hihat.options),
      clap: new Tone.NoiseSynth(INSTRUMENTS.DRUMS.clap.options),
      lead: new Tone.FMSynth(INSTRUMENTS.SYNTHS.lead.options),
      pad: new Tone.AMSynth(INSTRUMENTS.SYNTHS.pad.options),
      bass: new Tone.MonoSynth(INSTRUMENTS.SYNTHS.bass.options),
      pluck: new Tone.PluckSynth(INSTRUMENTS.SYNTHS.pluck.options)
    }

    // Connect instruments to effects chain based on active effects
    Object.values(instruments).forEach(inst => {
      let chain = [inst]
      
      Object.entries(activeEffects).forEach(([effect, isActive]) => {
        if (isActive && effects[effect]) {
          chain.push(effects[effect])
        }
      })
      
      chain.push(effects.limiter, Tone.Destination)
      Tone.connect(chain)
    })

    instrumentsRef.current = instruments
    effectsRef.current = effects
    
    Tone.Transport.bpm.value = bpm
    
    const loop = new Tone.Sequence(
      (time, step) => {
        Object.entries(patterns).forEach(([trackId, pattern]) => {
          if (pattern[step % 16]) {
            if (trackId === 'synth') {
              const notes = ['C4', 'E4', 'G4', 'A4']
              instruments[trackId].triggerAttackRelease(notes[Math.floor(step/4) % notes.length], '8n', time)
            } else {
              instruments[trackId].triggerAttackRelease(trackId === 'kick' ? 'C1' : 'C4', '8n', time)
            }
          }
        })
        setCurrentStep(step % 16)
      },
      [...Array(64).keys()],
      '16n'
    )

    if (isPlaying) {
      Tone.start()
      Tone.Transport.start()
      loop.start(0)
      startVisualization()
    } else {
      Tone.Transport.stop()
      loop.stop()
      setCurrentStep(0)
      stopVisualization()
    }

    return () => {
      loop.dispose()
      Object.values(instruments).forEach(inst => inst.dispose())
      Object.values(effects).forEach(effect => effect.dispose())
      stopVisualization()
    }
  }, [isPlaying, patterns, bpm, activeEffects])

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
      p={6}
      borderRadius="2xl"
      bg={bgColor}
      boxShadow="dark-lg"
      border="1px solid rgba(0, 255, 255, 0.2)"
      backdropFilter="blur(10px)"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '2xl',
        padding: '2px',
        background: 'linear-gradient(45deg, rgba(0,255,255,0.5), rgba(255,0,255,0.5))',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        pointerEvents: 'none',
      }}
    >
      <VStack spacing={8}>
        {/* Title and Genre */}
        <HStack width="full" spacing={4}>
          <Input
            placeholder="Beat Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            color={textColor}
            borderColor={textColor}
            _hover={{ borderColor: textColor }}
            _focus={{ borderColor: textColor, boxShadow: borderGlow }}
          />
          <Select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            color={textColor}
            borderColor={textColor}
            _hover={{ borderColor: textColor }}
            _focus={{ borderColor: textColor, boxShadow: borderGlow }}
          >
            <option value="House">House</option>
            <option value="Techno">Techno</option>
            <option value="Trance">Trance</option>
            <option value="Dubstep">Dubstep</option>
            <option value="Other">Other</option>
          </Select>
          <Menu>
            <MenuButton
              as={Button}
              color={textColor}
              bg="transparent"
              border="2px solid"
              borderColor={textColor}
              boxShadow={borderGlow}
              _hover={{
                transform: 'scale(1.05)',
                boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
              }}
            >
              {selectedPreset || 'Load Preset'}
            </MenuButton>
            <MenuList bg="rgba(0, 0, 0, 0.9)" borderColor={textColor}>
              {Object.keys(EDM_PRESETS).map(presetName => (
                <MenuItem
                  key={presetName}
                  onClick={() => loadPreset(presetName)}
                  _hover={{ bg: 'rgba(0, 255, 255, 0.1)' }}
                  color={textColor}
                >
                  {presetName}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </HStack>

        {/* Controls */}
        <HStack spacing={6} width="full" justify="center">
          <IconButton
            icon={isPlaying ? <FaStop /> : <FaPlay />}
            onClick={() => setIsPlaying(!isPlaying)}
            size="lg"
            isRound
            color={textColor}
            bg="transparent"
            border="2px solid"
            borderColor={textColor}
            boxShadow={borderGlow}
            _hover={{
              transform: 'scale(1.1)',
              boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
            }}
            _active={{
              transform: 'scale(0.95)',
            }}
            animation={isPlaying ? `${pulseAnimation} 2s infinite` : 'none'}
          />
          <IconButton
            icon={<FaRandom />}
            onClick={randomize}
            color={textColor}
            bg="transparent"
            border="2px solid"
            borderColor={textColor}
            boxShadow={borderGlow}
            _hover={{
              transform: 'scale(1.1)',
              boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
            }}
          />
          <IconButton
            icon={<FaTrash />}
            onClick={clear}
            color={textColor}
            bg="transparent"
            border="2px solid"
            borderColor={textColor}
            boxShadow={borderGlow}
            _hover={{
              transform: 'scale(1.1)',
              boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
            }}
          />
          <VStack spacing={1} minW="200px">
            <Text fontSize="md" color={textColor} textShadow={`0 0 10px ${textColor}`}>
              BPM: {bpm}
            </Text>
            <Slider
              value={bpm}
              onChange={setBpm}
              min={60}
              max={180}
              step={1}
            >
              <SliderTrack bg="rgba(0, 255, 255, 0.2)">
                <SliderFilledTrack bg={textColor} />
              </SliderTrack>
              <SliderThumb
                boxSize={4}
                bg={textColor}
                boxShadow={borderGlow}
                _focus={{ boxShadow: borderGlow }}
              />
            </Slider>
          </VStack>
          
          <HStack spacing={2}>
            <IconButton
              icon={<FaShare />}
              onClick={() => {
                // TODO: Implement sharing functionality
              }}
              color={textColor}
              bg="transparent"
              border="2px solid"
              borderColor={textColor}
              boxShadow={borderGlow}
              _hover={{
                transform: 'scale(1.1)',
                boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
              }}
            />
            <IconButton
              icon={<FaSave />}
              onClick={handleSave}
              color={textColor}
              bg="transparent"
              border="2px solid"
              borderColor={textColor}
              boxShadow={borderGlow}
              _hover={{
                transform: 'scale(1.1)',
                boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
              }}
            />
            {beatId && (
              <>
                <IconButton
                  icon={<FaHeart />}
                  onClick={handleLike}
                  color={beat?.likes?.includes(user?.id) ? '#ff0000' : textColor}
                  bg="transparent"
                  border="2px solid"
                  borderColor={textColor}
                  boxShadow={borderGlow}
                  _hover={{
                    transform: 'scale(1.1)',
                    boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
                  }}
                />
                <IconButton
                  icon={<FaComment />}
                  onClick={onOpen}
                  color={textColor}
                  bg="transparent"
                  border="2px solid"
                  borderColor={textColor}
                  boxShadow={borderGlow}
                  _hover={{
                    transform: 'scale(1.1)',
                    boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
                  }}
                />
              </>
            )}
          </HStack>
        </HStack>

        {/* Beat Grid */}
        <VStack spacing={4} width="full">
          {TRACKS.map(track => (
            <Box key={track.id} width="full">
              <Text
                color={track.color}
                fontSize="lg"
                fontWeight="bold"
                mb={2}
                textShadow={`0 0 10px ${track.color}`}
              >
                {track.name}
              </Text>
              <Grid
                templateColumns="repeat(16, 1fr)"
                gap={2}
                width="full"
                p={4}
                bg="rgba(0, 0, 0, 0.5)"
                borderRadius="xl"
                border={`1px solid ${track.color}40`}
              >
                {patterns[track.id].map((isActive, i) => (
                  <Box
                    key={i}
                    bg={
                      i === currentStep
                        ? currentStepColor
                        : isActive
                        ? track.color
                        : stepColor
                    }
                    h="35px"
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => toggleStep(track.id, i)}
                    transition="all 0.2s"
                    boxShadow={isActive ? `0 0 10px ${track.color}` : 'none'}
                    _hover={{
                      transform: 'scale(1.1)',
                      boxShadow: `0 0 20px ${isActive ? track.color : textColor}`,
                    }}
                    animation={i === currentStep ? `${glowAnimation} 0.5s infinite` : 'none'}
                  />
                ))}
              </Grid>
            </Box>
          ))}
        </VStack>

        {/* Visualization Style Selector */}
        <HStack spacing={4}>
          <Text color={textColor}>Visualization:</Text>
          <Select
            value={visualStyle}
            onChange={(e) => setVisualStyle(e.target.value)}
            color={textColor}
            borderColor={textColor}
            width="200px"
          >
            {Object.entries(VISUALIZATION_STYLES).map(([key, value]) => (
              <option key={key} value={value}>
                {key.charAt(0) + key.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </HStack>

        {/* Effects Controls */}
        <SimpleGrid columns={3} spacing={4} width="full">
          {Object.entries(EFFECTS).map(([effect, config]) => (
            <Box
              key={effect}
              p={4}
              borderRadius="lg"
              borderWidth={1}
              borderColor={activeEffects[effect] ? textColor : 'gray.600'}
            >
              <VStack>
                <HStack justify="space-between" width="full">
                  <Text color={textColor}>
                    {effect.charAt(0).toUpperCase() + effect.slice(1)}
                  </Text>
                  <Switch
                    isChecked={activeEffects[effect]}
                    onChange={() => setActiveEffects(prev => ({
                      ...prev,
                      [effect]: !prev[effect]
                    }))}
                    colorScheme="cyan"
                  />
                </HStack>
                {activeEffects[effect] && (
                  <VStack spacing={2} width="full">
                    {Object.entries(config.options).map(([param, value]) => (
                      <Box key={param} width="full">
                        <Text color={textColor} fontSize="xs">
                          {param}
                        </Text>
                        <Slider
                          value={value * 100}
                          onChange={(v) => {
                            if (effectsRef.current?.[effect]) {
                              effectsRef.current[effect][param] = v / 100
                            }
                          }}
                          min={0}
                          max={100}
                        >
                          <SliderTrack bg="rgba(0, 255, 255, 0.2)">
                            <SliderFilledTrack bg={textColor} />
                          </SliderTrack>
                          <SliderThumb
                            boxSize={3}
                            bg={textColor}
                            boxShadow={borderGlow}
                          />
                        </Slider>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Box>
          ))}
        </SimpleGrid>

        {/* Visualization */}
        <Box
          width="full"
          height="100px"
          bg="rgba(0, 0, 0, 0.3)"
          borderRadius="xl"
          overflow="hidden"
          position="relative"
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={100}
            style={{
              width: '100%',
              height: '100%'
            }}
          />
        </Box>

        {/* Comments Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay backdropFilter="blur(10px)" />
          <ModalContent
            bg={bgColor}
            border="1px solid rgba(0, 255, 255, 0.2)"
            boxShadow={borderGlow}
          >
            <ModalHeader color={textColor}>Comments</ModalHeader>
            <ModalCloseButton color={textColor} />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                {beat?.comments?.map((comment, index) => (
                  <Box
                    key={index}
                    p={3}
                    bg="rgba(0, 0, 0, 0.3)"
                    borderRadius="md"
                    width="full"
                  >
                    <Text color={textColor} fontWeight="bold">
                      {comment.user.username}
                    </Text>
                    <Text color={textColor}>{comment.text}</Text>
                  </Box>
                ))}
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  color={textColor}
                  borderColor={textColor}
                  _hover={{ borderColor: textColor }}
                  _focus={{ borderColor: textColor, boxShadow: borderGlow }}
                />
                <Button
                  onClick={handleComment}
                  color={textColor}
                  bg="transparent"
                  border="2px solid"
                  borderColor={textColor}
                  boxShadow={borderGlow}
                  _hover={{
                    transform: 'scale(1.05)',
                    boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
                  }}
                >
                  Post Comment
                </Button>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  )
}

export default BeatMaker 