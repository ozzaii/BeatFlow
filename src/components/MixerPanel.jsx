import {
  Box,
  VStack,
  HStack,
  IconButton,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorModeValue,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Progress,
  Grid,
  GridItem,
  Collapse,
  Button,
  Select,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverCloseButton,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaVolumeMute,
  FaVolumeUp,
  FaHeadphones,
  FaCompressAlt,
  FaWaveSquare,
  FaSliders,
  FaCog,
  FaSyncAlt,
  FaEyeDropper,
  FaRandom,
} from 'react-icons/fa'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useSoundEngine } from '../hooks/useSoundEngine'

const MotionBox = motion(Box)

const MeterDisplay = ({ value, min = -60, max = 6, warning = 0, danger = 3 }) => {
  const height = ((value - min) / (max - min)) * 100
  const color = value >= danger ? 'red.500' : 
                value >= warning ? 'yellow.500' : 
                'brand.500'

  return (
    <Box h="150px" w="4px" bg="dark.300" borderRadius="full" position="relative">
      <Box
        position="absolute"
        bottom="0"
        left="0"
        right="0"
        h={`${Math.min(100, Math.max(0, height))}%`}
        bg={color}
        borderRadius="full"
        transition="height 0.1s, background-color 0.2s"
      />
    </Box>
  )
}

const ChannelStrip = ({
  name,
  color,
  volume,
  pan,
  solo,
  mute,
  meter,
  sends = [],
  onVolumeChange,
  onPanChange,
  onSoloToggle,
  onMuteToggle,
  onSendChange,
  onEffectChange,
  effects = {},
}) => {
  const [showSends, setShowSends] = useState(false)
  const [showEffects, setShowEffects] = useState(false)

  return (
    <VStack
      spacing={2}
      p={4}
      bg="dark.200"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      _hover={{
        borderColor: color,
        boxShadow: `0 0 20px ${color}`,
      }}
      transition="all 0.2s"
      minW="120px"
    >
      {/* Channel Label */}
      <Text
        color="whiteAlpha.900"
        fontSize="sm"
        fontWeight="bold"
        textAlign="center"
      >
        {name}
      </Text>

      {/* Meter */}
      <HStack spacing={1}>
        <MeterDisplay value={meter.left} />
        <MeterDisplay value={meter.right} />
      </HStack>

      {/* Pan */}
      <Slider
        value={pan}
        min={-1}
        max={1}
        step={0.01}
        onChange={onPanChange}
        w="80px"
        transform="rotate(-90deg)"
      >
        <SliderTrack bg="dark.300">
          <SliderFilledTrack bg={color} />
        </SliderTrack>
        <SliderThumb boxSize={2} bg={color} />
      </Slider>

      {/* Volume */}
      <Slider
        value={volume}
        min={-60}
        max={6}
        step={0.1}
        onChange={onVolumeChange}
        orientation="vertical"
        h="150px"
      >
        <SliderTrack bg="dark.300">
          <SliderFilledTrack bg={color} />
        </SliderTrack>
        <SliderThumb boxSize={3} bg={color}>
          <Text fontSize="xs" position="absolute" left="16px" whiteSpace="nowrap">
            {volume.toFixed(1)} dB
          </Text>
        </SliderThumb>
      </Slider>

      {/* Controls */}
      <HStack spacing={1}>
        <IconButton
          icon={<FaHeadphones />}
          size="xs"
          variant={solo ? "solid" : "ghost"}
          colorScheme="yellow"
          onClick={onSoloToggle}
          aria-label="Solo"
        />
        <IconButton
          icon={mute ? <FaVolumeMute /> : <FaVolumeUp />}
          size="xs"
          variant={mute ? "solid" : "ghost"}
          colorScheme="red"
          onClick={onMuteToggle}
          aria-label="Mute"
        />
      </HStack>

      {/* Effects */}
      <Popover placement="right">
        <PopoverTrigger>
          <IconButton
            icon={<FaSliders />}
            size="xs"
            variant="ghost"
            aria-label="Effects"
          />
        </PopoverTrigger>
        <PopoverContent bg="dark.300" borderColor="whiteAlpha.200">
          <PopoverHeader border="0">Effects</PopoverHeader>
          <PopoverCloseButton />
          <PopoverBody>
            <VStack spacing={4} align="stretch">
              {Object.entries(effects).map(([effect, params]) => (
                <Box key={effect}>
                  <Text
                    color="whiteAlpha.700"
                    fontSize="xs"
                    textTransform="capitalize"
                    mb={2}
                  >
                    {effect}
                  </Text>
                  {Object.entries(params).map(([param, value]) => (
                    <VStack key={param} spacing={1} align="stretch">
                      <Text color="whiteAlpha.600" fontSize="xs">
                        {param}
                      </Text>
                      <Slider
                        value={value * 100}
                        min={0}
                        max={100}
                        onChange={(v) => onEffectChange(effect, param, v / 100)}
                        size="sm"
                      >
                        <SliderTrack bg="dark.400">
                          <SliderFilledTrack bg={color} />
                        </SliderTrack>
                        <SliderThumb boxSize={2} bg={color} />
                      </Slider>
                    </VStack>
                  ))}
                </Box>
              ))}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>

      {/* Sends */}
      <Popover placement="right">
        <PopoverTrigger>
          <IconButton
            icon={<FaRandom />}
            size="xs"
            variant="ghost"
            aria-label="Sends"
          />
        </PopoverTrigger>
        <PopoverContent bg="dark.300" borderColor="whiteAlpha.200">
          <PopoverHeader border="0">Sends</PopoverHeader>
          <PopoverCloseButton />
          <PopoverBody>
            <VStack spacing={4} align="stretch">
              {sends.map((send, index) => (
                <VStack key={index} spacing={1} align="stretch">
                  <Text color="whiteAlpha.700" fontSize="xs">
                    Send {index + 1}
                  </Text>
                  <Slider
                    value={send.level}
                    min={-60}
                    max={6}
                    onChange={(v) => onSendChange(index, v)}
                    size="sm"
                  >
                    <SliderTrack bg="dark.400">
                      <SliderFilledTrack bg={color} />
                    </SliderTrack>
                    <SliderThumb boxSize={2} bg={color} />
                  </Slider>
                </VStack>
              ))}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </VStack>
  )
}

const MasterSection = ({
  volume,
  meter,
  onVolumeChange,
  eq = { low: 0, mid: 0, high: 0 },
  onEQChange,
  compressor = {
    threshold: -24,
    ratio: 12,
    attack: 0.003,
    release: 0.25,
  },
  onCompressorChange,
}) => {
  return (
    <VStack
      spacing={4}
      p={4}
      bg="dark.200"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      _hover={{
        borderColor: 'brand.500',
        boxShadow: '0 0 20px var(--chakra-colors-brand-500)',
      }}
      transition="all 0.2s"
      minW="200px"
    >
      <Text
        color="whiteAlpha.900"
        fontSize="lg"
        fontWeight="bold"
        textAlign="center"
      >
        Master
      </Text>

      {/* Meters */}
      <HStack spacing={2}>
        <MeterDisplay value={meter.left} />
        <MeterDisplay value={meter.right} />
      </HStack>

      {/* Volume */}
      <Slider
        value={volume}
        min={-60}
        max={6}
        step={0.1}
        onChange={onVolumeChange}
        orientation="vertical"
        h="200px"
      >
        <SliderTrack bg="dark.300">
          <SliderFilledTrack bg="brand.500" />
        </SliderTrack>
        <SliderThumb boxSize={4} bg="brand.500">
          <Text fontSize="xs" position="absolute" left="20px" whiteSpace="nowrap">
            {volume.toFixed(1)} dB
          </Text>
        </SliderThumb>
      </Slider>

      {/* EQ */}
      <Popover placement="right">
        <PopoverTrigger>
          <IconButton
            icon={<FaSliders />}
            size="sm"
            variant="ghost"
            aria-label="EQ"
          />
        </PopoverTrigger>
        <PopoverContent bg="dark.300" borderColor="whiteAlpha.200">
          <PopoverHeader border="0">Master EQ</PopoverHeader>
          <PopoverCloseButton />
          <PopoverBody>
            <VStack spacing={4}>
              {Object.entries(eq).map(([band, value]) => (
                <VStack key={band} spacing={1}>
                  <Text color="whiteAlpha.700" fontSize="xs" textTransform="uppercase">
                    {band}
                  </Text>
                  <Slider
                    value={value}
                    min={-12}
                    max={12}
                    step={0.1}
                    onChange={(v) => onEQChange(band, v)}
                  >
                    <SliderTrack bg="dark.400">
                      <SliderFilledTrack bg="brand.500" />
                    </SliderTrack>
                    <SliderThumb boxSize={3} bg="brand.500" />
                  </Slider>
                </VStack>
              ))}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>

      {/* Compressor */}
      <Popover placement="right">
        <PopoverTrigger>
          <IconButton
            icon={<FaCompressAlt />}
            size="sm"
            variant="ghost"
            aria-label="Compressor"
          />
        </PopoverTrigger>
        <PopoverContent bg="dark.300" borderColor="whiteAlpha.200">
          <PopoverHeader border="0">Master Compressor</PopoverHeader>
          <PopoverCloseButton />
          <PopoverBody>
            <VStack spacing={4}>
              {Object.entries(compressor).map(([param, value]) => (
                <VStack key={param} spacing={1}>
                  <Text color="whiteAlpha.700" fontSize="xs" textTransform="uppercase">
                    {param}
                  </Text>
                  <Slider
                    value={value}
                    min={param === 'threshold' ? -60 : 0}
                    max={param === 'threshold' ? 0 : 
                         param === 'ratio' ? 20 :
                         param === 'attack' ? 1 :
                         param === 'release' ? 1 : 1}
                    step={0.1}
                    onChange={(v) => onCompressorChange(param, v)}
                  >
                    <SliderTrack bg="dark.400">
                      <SliderFilledTrack bg="brand.500" />
                    </SliderTrack>
                    <SliderThumb boxSize={3} bg="brand.500" />
                  </Slider>
                </VStack>
              ))}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </VStack>
  )
}

const MixerPanel = ({ channels = [], auxSends = [] }) => {
  const {
    masterVolume,
    setMasterVolume,
    masterMeter,
    setMasterEQ,
    setMasterCompressor,
    setMasterLimiter,
  } = useSoundEngine()

  const [eq, setEQ] = useState({ low: 0, mid: 0, high: 0 })
  const [compressor, setCompressor] = useState({
    threshold: -24,
    ratio: 12,
    attack: 0.003,
    release: 0.25,
  })

  const handleEQChange = useCallback((band, value) => {
    setEQ(prev => ({ ...prev, [band]: value }))
    setMasterEQ(band, value)
  }, [setMasterEQ])

  const handleCompressorChange = useCallback((param, value) => {
    setCompressor(prev => ({ ...prev, [param]: value }))
    setMasterCompressor(param, value)
  }, [setMasterCompressor])

  return (
    <Box
      w="full"
      overflowX="auto"
      css={{
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'var(--chakra-colors-dark-300)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'var(--chakra-colors-brand-500)',
          borderRadius: '4px',
        },
      }}
    >
      <HStack spacing={4} p={4} minW="fit-content">
        {channels.map((channel, index) => (
          <ChannelStrip
            key={index}
            {...channel}
            sends={auxSends.map(send => ({
              name: send.name,
              level: channel.sends?.[send.id] ?? -60,
            }))}
          />
        ))}
        <MasterSection
          volume={masterVolume}
          meter={masterMeter}
          onVolumeChange={setMasterVolume}
          eq={eq}
          onEQChange={handleEQChange}
          compressor={compressor}
          onCompressorChange={handleCompressorChange}
        />
      </HStack>
    </Box>
  )
}

export default MixerPanel 