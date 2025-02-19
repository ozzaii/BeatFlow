import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Box,
  VStack,
  HStack,
  Grid,
  GridItem,
  Text,
  IconButton,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Select,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  FaPlay,
  FaStop,
  FaSave,
  FaFolder,
  FaRandom,
  FaDrum,
  FaCog,
  FaPlus,
  FaMinus,
  FaStepForward,
  FaUndo,
  FaRedo,
} from 'react-icons/fa'
import * as Tone from 'tone'
import { useSoundEngine } from '../hooks/useSoundEngine'

const MotionBox = motion(Box)

// Drum Kits
const DRUM_KITS = {
  '909': {
    kick: '/samples/909/kick.wav',
    snare: '/samples/909/snare.wav',
    hihat: '/samples/909/hihat.wav',
    openhat: '/samples/909/openhat.wav',
    clap: '/samples/909/clap.wav',
    rim: '/samples/909/rim.wav',
    tom: '/samples/909/tom.wav',
    crash: '/samples/909/crash.wav',
  },
  '808': {
    kick: '/samples/808/kick.wav',
    snare: '/samples/808/snare.wav',
    hihat: '/samples/808/hihat.wav',
    openhat: '/samples/808/openhat.wav',
    clap: '/samples/808/clap.wav',
    cowbell: '/samples/808/cowbell.wav',
    conga: '/samples/808/conga.wav',
    cymbal: '/samples/808/cymbal.wav',
  },
  'Acoustic': {
    kick: '/samples/acoustic/kick.wav',
    snare: '/samples/acoustic/snare.wav',
    hihat: '/samples/acoustic/hihat.wav',
    ride: '/samples/acoustic/ride.wav',
    crash: '/samples/acoustic/crash.wav',
    tom1: '/samples/acoustic/tom1.wav',
    tom2: '/samples/acoustic/tom2.wav',
    tom3: '/samples/acoustic/tom3.wav',
  },
}

const INITIAL_PATTERNS = {
  '909': {
    kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    openhat: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    clap:    [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    rim:     [1,0,0,1, 0,1,0,0, 1,0,0,1, 0,1,0,0],
    tom:     [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],
    crash:   [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  },
  '808': {
    kick:    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    hihat:   [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    openhat: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    clap:    [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    cowbell: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
    conga:   [0,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0],
    cymbal:  [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
  },
  'Acoustic': {
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    ride:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    crash: [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    tom1:  [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    tom2:  [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
    tom3:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
  },
}

const DrumPad = ({ active, triggered, onClick, color = 'brand.500' }) => (
  <MotionBox
    w="full"
    h="full"
    bg={active ? color : 'dark.200'}
    borderRadius="md"
    cursor="pointer"
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    animate={{
      backgroundColor: triggered
        ? color
        : active
        ? color
        : 'var(--chakra-colors-dark-200)',
      scale: triggered ? 1.1 : 1,
    }}
    transition={{
      duration: 0.1,
      backgroundColor: {
        duration: triggered ? 0.1 : 0.2,
      },
    }}
  />
)

const DrumMachine = () => {
  const [selectedKit, setSelectedKit] = useState('909')
  const [pattern, setPattern] = useState(INITIAL_PATTERNS[selectedKit])
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [swing, setSwing] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [triggeredPads, setTriggeredPads] = useState({})

  const samplers = useRef({})
  const sequencer = useRef(null)

  const { createChannel, isInitialized } = useSoundEngine()
  const channels = useRef({})

  // Initialize Samplers and Channels
  useEffect(() => {
    if (!isInitialized) return

    // Cleanup old samplers and channels
    Object.values(samplers.current).forEach(sampler => sampler.dispose())
    Object.values(channels.current).forEach(channel => channel.dispose())

    // Create new samplers and channels for each drum
    Object.entries(DRUM_KITS[selectedKit]).forEach(([drum, url]) => {
      const sampler = new Tone.Sampler({
        urls: { C4: url },
        onload: () => {
          console.log(`Loaded ${drum} sample`)
        },
      })

      const { channel, effects } = createChannel({
        volume: 0,
        pan: 0,
        effects: {
          distortion: { distortion: 0 },
          reverb: { decay: 1.5, wet: 0 },
        },
      })

      sampler.connect(channel)
      samplers.current[drum] = sampler
      channels.current[drum] = { channel, effects }
    })

    return () => {
      Object.values(samplers.current).forEach(sampler => sampler.dispose())
      Object.values(channels.current).forEach(channel => channel.dispose())
    }
  }, [selectedKit, isInitialized, createChannel])

  // Sequencer Setup
  useEffect(() => {
    if (!isInitialized) return

    Tone.Transport.bpm.value = bpm
    Tone.Transport.swing = swing

    sequencer.current = new Tone.Sequence(
      (time, step) => {
        setCurrentStep(step)
        const triggered = {}

        Object.entries(pattern).forEach(([drum, sequence]) => {
          if (sequence[step]) {
            samplers.current[drum]?.triggerAttack('C4', time)
            triggered[`${drum}-${step}`] = true
          }
        })

        Tone.Draw.schedule(() => {
          setTriggeredPads(triggered)
          setTimeout(() => setTriggeredPads({}), 100)
        }, time)
      },
      Array.from({ length: 16 }, (_, i) => i),
      '16n'
    )

    return () => {
      sequencer.current?.dispose()
    }
  }, [pattern, bpm, swing, isInitialized])

  // Transport Control
  const togglePlay = useCallback(async () => {
    if (!isInitialized) return

    if (Tone.Transport.state === 'started') {
      Tone.Transport.stop()
      sequencer.current?.stop()
      setIsPlaying(false)
      setCurrentStep(0)
    } else {
      await Tone.start()
      Tone.Transport.start()
      sequencer.current?.start(0)
      setIsPlaying(true)
    }
  }, [isInitialized])

  // Pattern Management
  const toggleStep = useCallback((drum, step) => {
    setPattern(prev => ({
      ...prev,
      [drum]: prev[drum].map((value, i) => (i === step ? !value : value)),
    }))
  }, [])

  const clearPattern = useCallback(() => {
    setPattern(
      Object.fromEntries(
        Object.keys(pattern).map(drum => [
          drum,
          Array(16).fill(0),
        ])
      )
    )
  }, [pattern])

  const randomizePattern = useCallback(() => {
    setPattern(
      Object.fromEntries(
        Object.entries(pattern).map(([drum]) => [
          drum,
          Array.from({ length: 16 }, () => Math.random() > 0.8 ? 1 : 0),
        ])
      )
    )
  }, [pattern])

  return (
    <VStack spacing={6} w="full" p={6}>
      {/* Transport Controls */}
      <HStack spacing={4}>
        <IconButton
          icon={isPlaying ? <FaStop /> : <FaPlay />}
          onClick={togglePlay}
          colorScheme="brand"
          size="lg"
          isRound
        />
        <VStack spacing={1}>
          <Text fontSize="sm" color="whiteAlpha.700">BPM</Text>
          <HStack spacing={2}>
            <IconButton
              icon={<FaMinus />}
              onClick={() => setBpm(prev => Math.max(60, prev - 1))}
              size="sm"
              variant="ghost"
            />
            <Text fontSize="xl" fontWeight="bold" minW="60px" textAlign="center">
              {bpm}
            </Text>
            <IconButton
              icon={<FaPlus />}
              onClick={() => setBpm(prev => Math.min(200, prev + 1))}
              size="sm"
              variant="ghost"
            />
          </HStack>
        </VStack>
        <VStack spacing={1}>
          <Text fontSize="sm" color="whiteAlpha.700">Swing</Text>
          <Slider
            value={swing}
            min={0}
            max={1}
            step={0.01}
            w="100px"
            onChange={setSwing}
          >
            <SliderTrack bg="dark.300">
              <SliderFilledTrack bg="brand.500" />
            </SliderTrack>
            <SliderThumb boxSize={3} bg="brand.500" />
          </Slider>
        </VStack>
        <Menu>
          <MenuButton as={Button} leftIcon={<FaDrum />} variant="ghost">
            {selectedKit}
          </MenuButton>
          <MenuList bg="dark.200" borderColor="whiteAlpha.200">
            {Object.keys(DRUM_KITS).map(kit => (
              <MenuItem
                key={kit}
                onClick={() => {
                  setSelectedKit(kit)
                  setPattern(INITIAL_PATTERNS[kit])
                }}
              >
                {kit}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
        <IconButton
          icon={<FaRandom />}
          onClick={randomizePattern}
          variant="ghost"
          aria-label="Randomize Pattern"
        />
        <IconButton
          icon={<FaUndo />}
          onClick={clearPattern}
          variant="ghost"
          aria-label="Clear Pattern"
        />
      </HStack>

      {/* Pattern Grid */}
      <Grid
        templateColumns="auto repeat(16, 1fr)"
        gap={1}
        w="full"
        bg="dark.300"
        p={4}
        borderRadius="lg"
      >
        {/* Step Numbers */}
        <GridItem />
        {Array.from({ length: 16 }, (_, i) => (
          <GridItem key={i}>
            <Text
              fontSize="xs"
              color="whiteAlpha.500"
              textAlign="center"
              fontFamily="mono"
            >
              {i + 1}
            </Text>
          </GridItem>
        ))}

        {/* Drum Rows */}
        {Object.entries(pattern).map(([drum, sequence]) => (
          <React.Fragment key={drum}>
            <GridItem>
              <HStack spacing={2} pr={4}>
                <Text
                  fontSize="sm"
                  color="whiteAlpha.900"
                  fontWeight="bold"
                  textTransform="capitalize"
                >
                  {drum}
                </Text>
                <Popover placement="right">
                  <PopoverTrigger>
                    <IconButton
                      icon={<FaCog />}
                      size="xs"
                      variant="ghost"
                      aria-label={`${drum} settings`}
                    />
                  </PopoverTrigger>
                  <PopoverContent bg="dark.300" borderColor="whiteAlpha.200">
                    <PopoverHeader border="0">{drum} Settings</PopoverHeader>
                    <PopoverCloseButton />
                    <PopoverBody>
                      <VStack spacing={4}>
                        <VStack spacing={1} align="stretch">
                          <Text fontSize="xs" color="whiteAlpha.700">
                            Volume
                          </Text>
                          <Slider
                            defaultValue={0}
                            min={-60}
                            max={6}
                            onChange={(v) =>
                              channels.current[drum]?.channel.volume.value = v
                            }
                          >
                            <SliderTrack bg="dark.400">
                              <SliderFilledTrack bg="brand.500" />
                            </SliderTrack>
                            <SliderThumb boxSize={2} bg="brand.500" />
                          </Slider>
                        </VStack>
                        <VStack spacing={1} align="stretch">
                          <Text fontSize="xs" color="whiteAlpha.700">
                            Pan
                          </Text>
                          <Slider
                            defaultValue={0}
                            min={-1}
                            max={1}
                            step={0.01}
                            onChange={(v) =>
                              channels.current[drum]?.channel.pan.value = v
                            }
                          >
                            <SliderTrack bg="dark.400">
                              <SliderFilledTrack bg="brand.500" />
                            </SliderTrack>
                            <SliderThumb boxSize={2} bg="brand.500" />
                          </Slider>
                        </VStack>
                        <VStack spacing={1} align="stretch">
                          <Text fontSize="xs" color="whiteAlpha.700">
                            Distortion
                          </Text>
                          <Slider
                            defaultValue={0}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(v) =>
                              channels.current[drum]?.effects.distortion.distortion = v
                            }
                          >
                            <SliderTrack bg="dark.400">
                              <SliderFilledTrack bg="brand.500" />
                            </SliderTrack>
                            <SliderThumb boxSize={2} bg="brand.500" />
                          </Slider>
                        </VStack>
                        <VStack spacing={1} align="stretch">
                          <Text fontSize="xs" color="whiteAlpha.700">
                            Reverb
                          </Text>
                          <Slider
                            defaultValue={0}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(v) =>
                              channels.current[drum]?.effects.reverb.wet.value = v
                            }
                          >
                            <SliderTrack bg="dark.400">
                              <SliderFilledTrack bg="brand.500" />
                            </SliderTrack>
                            <SliderThumb boxSize={2} bg="brand.500" />
                          </Slider>
                        </VStack>
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              </HStack>
            </GridItem>
            {sequence.map((active, step) => (
              <GridItem key={step} p={1}>
                <DrumPad
                  active={active}
                  triggered={triggeredPads[`${drum}-${step}`]}
                  onClick={() => toggleStep(drum, step)}
                  color={
                    step === currentStep
                      ? 'yellow.500'
                      : step % 4 === 0
                      ? 'brand.400'
                      : 'brand.500'
                  }
                />
              </GridItem>
            ))}
          </React.Fragment>
        ))}
      </Grid>
    </VStack>
  )
}

export default DrumMachine 