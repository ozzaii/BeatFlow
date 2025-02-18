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
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useState, useCallback, useEffect } from 'react'
import { FaPlay, FaStop, FaRandom, FaTrash, FaShare, FaSave, FaDownload, FaHeart, FaComment } from 'react-icons/fa'
import * as Tone from 'tone'
import { beatApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'

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
  
  const bgColor = useColorModeValue('rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.95)')
  const stepColor = useColorModeValue('rgba(20, 20, 20, 0.8)', 'rgba(30, 30, 30, 0.8)')
  const currentStepColor = useColorModeValue('#ff00ff', '#ff00ff')
  const textColor = '#00ffff'
  const borderGlow = `0 0 10px ${textColor}, 0 0 20px ${textColor}, 0 0 30px ${textColor}`

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

  // Initialize audio
  useEffect(() => {
    const instruments = {
      kick: new Tone.MembraneSynth({
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
      }).toDestination(),
      snare: new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.001,
          decay: 0.2,
          sustain: 0
        }
      }).toDestination(),
      hihat: new Tone.MetalSynth({
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
      }).toDestination(),
      synth: new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.3,
          release: 0.1
        }
      }).toDestination()
    }
    
    Tone.Transport.bpm.value = bpm
    
    const loop = new Tone.Sequence(
      (time, step) => {
        Object.entries(patterns).forEach(([trackId, pattern]) => {
          if (pattern[step]) {
            if (trackId === 'synth') {
              instruments[trackId].triggerAttackRelease('C4', '8n', time)
            } else {
              instruments[trackId].triggerAttackRelease('C2', '8n', time)
            }
          }
        })
        setCurrentStep(step)
      },
      [...Array(TOTAL_STEPS).keys()],
      '16n'
    )

    if (isPlaying) {
      Tone.start()
      Tone.Transport.start()
      loop.start(0)
    } else {
      Tone.Transport.stop()
      loop.stop()
      setCurrentStep(0)
    }

    return () => {
      loop.dispose()
      Object.values(instruments).forEach(inst => inst.dispose())
    }
  }, [isPlaying, patterns, bpm])

  const toggleStep = useCallback((trackId, index) => {
    setPatterns(prev => ({
      ...prev,
      [trackId]: prev[trackId].map((step, i) => i === index ? !step : step)
    }))
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