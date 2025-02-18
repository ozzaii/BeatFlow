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
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaVolumeMute,
  FaVolumeUp,
  FaCompressAlt,
  FaWaveSquare,
  FaSliders,
  FaCog,
  FaSyncAlt,
} from 'react-icons/fa'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useSoundEngine } from '../hooks/useSoundEngine'

const MotionBox = motion(Box)

const ChannelStrip = ({
  name,
  volume = 0.75,
  pan = 0,
  solo = false,
  muted = false,
  effects = [],
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  onEffectChange,
  meter = { left: 0, right: 0 },
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const meterBg = useColorModeValue('gray.100', 'gray.700')
  const meterColor = useColorModeValue('green.500', 'green.400')
  const meterWarningColor = useColorModeValue('yellow.500', 'yellow.400')
  const meterDangerColor = useColorModeValue('red.500', 'red.400')

  const getMeterColor = (value) => {
    if (value > 0.8) return meterDangerColor
    if (value > 0.6) return meterWarningColor
    return meterColor
  }

  return (
    <VStack
      spacing={2}
      p={2}
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="md"
      width="100px"
      height="full"
    >
      {/* Channel Name */}
      <Text fontSize="sm" fontWeight="bold" isTruncated>
        {name}
      </Text>

      {/* Meters */}
      <HStack spacing={1} width="full" height="150px">
        <VStack width="8px" height="full" bg={meterBg} borderRadius="full" overflow="hidden">
          <Box
            width="full"
            height={`${meter.left * 100}%`}
            bg={getMeterColor(meter.left)}
            transition="height 0.1s"
            marginTop="auto"
          />
        </VStack>
        <VStack width="8px" height="full" bg={meterBg} borderRadius="full" overflow="hidden">
          <Box
            width="full"
            height={`${meter.right * 100}%`}
            bg={getMeterColor(meter.right)}
            transition="height 0.1s"
            marginTop="auto"
          />
        </VStack>
      </HStack>

      {/* Pan Control */}
      <Slider
        value={pan * 50 + 50}
        onChange={(v) => onPanChange((v - 50) / 50)}
        min={0}
        max={100}
        width="full"
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>

      {/* Volume Fader */}
      <Slider
        value={volume * 100}
        onChange={(v) => onVolumeChange(v / 100)}
        min={0}
        max={100}
        orientation="vertical"
        height="200px"
        marginY={4}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>

      {/* Controls */}
      <HStack>
        <IconButton
          icon={muted ? <FaVolumeMute /> : <FaVolumeUp />}
          size="sm"
          isActive={muted}
          onClick={onMuteToggle}
        />
        <IconButton
          icon={<FaSyncAlt />}
          size="sm"
          isActive={solo}
          onClick={onSoloToggle}
        />
      </HStack>
    </VStack>
  )
}

const EffectRack = ({
  effects,
  onEffectChange,
  onEffectAdd,
  onEffectRemove,
}) => {
  return (
    <VStack spacing={4} p={4}>
      {effects.map((effect, index) => (
        <Box
          key={effect.id}
          width="full"
          p={4}
          borderWidth={1}
          borderColor="gray.200"
          borderRadius="md"
        >
          <VStack spacing={3}>
            <HStack justify="space-between" width="full">
              <Text fontWeight="bold">{effect.name}</Text>
              <IconButton
                icon={<FaCog />}
                size="sm"
                variant="ghost"
              />
            </HStack>
            {effect.parameters.map((param) => (
              <Box key={param.name} width="full">
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm">{param.name}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {Math.round(param.value * 100)}%
                  </Text>
                </HStack>
                <Slider
                  value={param.value * 100}
                  onChange={(v) => onEffectChange(effect.id, param.name, v / 100)}
                  min={0}
                  max={100}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </Box>
            ))}
          </VStack>
        </Box>
      ))}
    </VStack>
  )
}

const MixerPanel = ({
  tracks = [],
  masterEffects = [],
  onTrackChange,
  onMasterEffectChange,
}) => {
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [meterData, setMeterData] = useState({})
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Update meters
  useEffect(() => {
    const updateMeters = () => {
      // In a real implementation, this would get actual meter data from the audio engine
      setMeterData(
        Object.fromEntries(
          tracks.map(track => [
            track.id,
            {
              left: Math.random() * track.volume,
              right: Math.random() * track.volume,
            }
          ])
        )
      )
    }

    const interval = setInterval(updateMeters, 100)
    return () => clearInterval(interval)
  }, [tracks])

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      borderWidth={1}
      borderColor={borderColor}
      p={4}
    >
      <VStack spacing={4}>
        <HStack spacing={4} width="full" overflowX="auto" pb={4}>
          {/* Channel Strips */}
          {tracks.map((track) => (
            <ChannelStrip
              key={track.id}
              name={track.name}
              volume={track.volume}
              pan={track.pan}
              solo={track.solo}
              muted={track.muted}
              effects={track.effects}
              meter={meterData[track.id] || { left: 0, right: 0 }}
              onVolumeChange={(volume) => onTrackChange(track.id, { volume })}
              onPanChange={(pan) => onTrackChange(track.id, { pan })}
              onMuteToggle={() => onTrackChange(track.id, { muted: !track.muted })}
              onSoloToggle={() => onTrackChange(track.id, { solo: !track.solo })}
              onEffectChange={(effectId, param, value) =>
                onTrackChange(track.id, {
                  effects: track.effects.map(effect =>
                    effect.id === effectId
                      ? {
                          ...effect,
                          parameters: effect.parameters.map(p =>
                            p.name === param ? { ...p, value } : p
                          ),
                        }
                      : effect
                  ),
                })
              }
            />
          ))}

          {/* Master Channel */}
          <ChannelStrip
            name="Master"
            volume={1}
            pan={0}
            effects={masterEffects}
            meter={{ left: 0.5, right: 0.5 }}
            onVolumeChange={(volume) => {/* Handle master volume */}}
            onPanChange={(pan) => {/* Handle master pan */}}
            onEffectChange={(effectId, param, value) =>
              onMasterEffectChange(effectId, param, value)
            }
          />
        </HStack>

        {/* Effect Racks */}
        {selectedTrack && (
          <Box width="full">
            <Tabs>
              <TabList>
                <Tab>Channel Effects</Tab>
                <Tab>Master Effects</Tab>
                <Tab>Send Effects</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <EffectRack
                    effects={selectedTrack.effects}
                    onEffectChange={(effectId, param, value) =>
                      onTrackChange(selectedTrack.id, {
                        effects: selectedTrack.effects.map(effect =>
                          effect.id === effectId
                            ? {
                                ...effect,
                                parameters: effect.parameters.map(p =>
                                  p.name === param ? { ...p, value } : p
                                ),
                              }
                            : effect
                        ),
                      })
                    }
                  />
                </TabPanel>
                <TabPanel>
                  <EffectRack
                    effects={masterEffects}
                    onEffectChange={onMasterEffectChange}
                  />
                </TabPanel>
                <TabPanel>
                  {/* Implement send effects */}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export default MixerPanel 