import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Grid,
  Button,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Tooltip,
  useBreakpointValue,
  Badge,
} from '@chakra-ui/react'
import { PlayIcon, StopIcon, SaveIcon, MetronomeIcon, ChevronDownIcon } from '../components/icons'
import * as Tone from 'tone'

// Predefined beat patterns
const PREDEFINED_BEATS = {
  'Trap Beat': {
    kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    clap: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
  },
  'House Beat': {
    kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    clap: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
  },
  'Hip Hop Beat': {
    kick: [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    clap: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
  },
  'R&B Beat': {
    kick: [1,0,0,0, 0,1,0,0, 1,0,0,0, 0,1,0,0],
    snare: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1],
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    clap: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
  },
}

const INSTRUMENTS = {
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
  clap: new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: {
      attack: 0.001,
      decay: 0.2,
      sustain: 0
    }
  }).toDestination(),
}

function Studio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [currentStep, setCurrentStep] = useState(0)
  const [sequence, setSequence] = useState({
    kick: Array(16).fill(false),
    snare: Array(16).fill(false),
    hihat: Array(16).fill(false),
    clap: Array(16).fill(false),
  })

  const bgColor = useColorModeValue('gray.100', 'gray.800')
  const activeCellColor = useColorModeValue('brand.500', 'brand.400')
  const inactiveCellColor = useColorModeValue('gray.300', 'gray.600')
  const cellSize = useBreakpointValue({ base: '24px', sm: '32px', md: '40px' })
  const gridColumns = useBreakpointValue({ base: 8, sm: 16 })

  const playStep = useCallback((time) => {
    Object.entries(sequence).forEach(([instrument, steps]) => {
      if (steps[currentStep]) {
        INSTRUMENTS[instrument].triggerAttackRelease('C4', '8n', time)
      }
    })
    setCurrentStep((prev) => (prev + 1) % 16)
  }, [sequence, currentStep])

  useEffect(() => {
    const loop = new Tone.Loop(playStep, '16n')
    Tone.Transport.bpm.value = bpm
    loop.start(0)

    return () => {
      loop.dispose()
      Object.values(INSTRUMENTS).forEach(instrument => instrument.dispose())
    }
  }, [playStep, bpm])

  const toggleStep = (instrument, step) => {
    setSequence(prev => ({
      ...prev,
      [instrument]: prev[instrument].map((value, index) => 
        index === step ? !value : value
      )
    }))
  }

  const togglePlay = async () => {
    await Tone.start()
    if (!isPlaying) {
      Tone.Transport.start()
      setIsPlaying(true)
    } else {
      Tone.Transport.stop()
      setIsPlaying(false)
      setCurrentStep(0)
    }
  }

  const handleBpmChange = (value) => {
    setBpm(value)
    Tone.Transport.bpm.value = value
  }

  const loadPresetBeat = (beatName) => {
    const beat = PREDEFINED_BEATS[beatName]
    setSequence({
      kick: beat.kick.map(v => Boolean(v)),
      snare: beat.snare.map(v => Boolean(v)),
      hihat: beat.hihat.map(v => Boolean(v)),
      clap: beat.clap.map(v => Boolean(v)),
    })
  }

  const clearSequence = () => {
    setSequence({
      kick: Array(16).fill(false),
      snare: Array(16).fill(false),
      hihat: Array(16).fill(false),
      clap: Array(16).fill(false),
    })
  }

  return (
    <Box p={{ base: 4, md: 8 }} bg={bgColor} borderRadius="xl" shadow="xl">
      <VStack spacing={{ base: 4, md: 8 }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} width="100%">
          <HStack spacing={4} justify="center">
            <Tooltip label={isPlaying ? 'Stop' : 'Play'}>
              <IconButton
                icon={isPlaying ? <StopIcon /> : <PlayIcon />}
                onClick={togglePlay}
                size="lg"
                colorScheme="brand"
                aria-label={isPlaying ? 'Stop' : 'Play'}
              />
            </Tooltip>
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} colorScheme="brand" variant="outline">
                Presets
              </MenuButton>
              <MenuList>
                {Object.keys(PREDEFINED_BEATS).map((beatName) => (
                  <MenuItem key={beatName} onClick={() => loadPresetBeat(beatName)}>
                    {beatName}
                  </MenuItem>
                ))}
                <MenuItem onClick={clearSequence}>Clear</MenuItem>
              </MenuList>
            </Menu>
          </HStack>

          <HStack spacing={4} justify="center">
            <HStack>
              <MetronomeIcon />
              <Text>BPM:</Text>
              <Slider
                value={bpm}
                min={60}
                max={180}
                onChange={handleBpmChange}
                width={{ base: "120px", sm: "200px" }}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Badge colorScheme="brand" fontSize="md">{bpm}</Badge>
            </HStack>
            <Button leftIcon={<SaveIcon />} colorScheme="brand">
              Save
            </Button>
          </HStack>
        </SimpleGrid>

        <Box overflowX="auto" width="100%">
          <Grid 
            templateColumns={`repeat(${gridColumns}, 1fr)`} 
            gap={1}
            minWidth={{ base: "unset", md: "800px" }}
            p={4}
          >
            {Object.entries(sequence).map(([instrument, steps]) => (
              <>
                <Text 
                  key={`${instrument}-label`} 
                  gridColumn="span 1"
                  fontWeight="bold"
                  textTransform="capitalize"
                >
                  {instrument}
                </Text>
                {steps.slice(0, gridColumns).map((isActive, index) => (
                  <Box
                    key={`${instrument}-${index}`}
                    w={cellSize}
                    h={cellSize}
                    bg={isActive ? activeCellColor : inactiveCellColor}
                    borderRadius="md"
                    cursor="pointer"
                    onClick={() => toggleStep(instrument, index)}
                    transition="all 0.2s"
                    _hover={{ transform: 'scale(1.1)' }}
                    opacity={currentStep === index && isPlaying ? 0.7 : 1}
                  />
                ))}
              </>
            ))}
          </Grid>
        </Box>
      </VStack>
    </Box>
  )
}

export default Studio 