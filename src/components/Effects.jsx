import {
  Box,
  VStack,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useColorModeValue,
  HStack,
  Select,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Grid,
  GridItem,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react'
import { FaSave, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useState, useCallback } from 'react'

const MotionBox = motion(Box)

const EffectUnit = ({ name, params, onParamChange, visualizer }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true })
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <HStack justify="space-between" mb={isOpen ? 4 : 0}>
        <Text fontSize="md" fontWeight="bold">{name}</Text>
        <IconButton
          size="sm"
          icon={isOpen ? <FaChevronUp /> : <FaChevronDown />}
          onClick={onToggle}
          variant="ghost"
        />
      </HStack>
      
      <Collapse in={isOpen}>
        <VStack spacing={4} align="stretch">
          {params.map((param) => (
            <Box key={param.name}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm">{param.name}</Text>
                <Text fontSize="xs" color="gray.500">
                  {Math.round(param.value * 100)}%
                </Text>
              </HStack>
              <Slider
                value={param.value * 100}
                onChange={(value) => onParamChange(param.name, value / 100)}
                min={0}
                max={100}
              >
                <SliderTrack>
                  <SliderFilledTrack bg="brand.500" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              {visualizer && (
                <MotionBox
                  h="40px"
                  mt={2}
                  borderRadius="md"
                  overflow="hidden"
                  bg="gray.700"
                >
                  {visualizer(param.value)}
                </MotionBox>
              )}
            </Box>
          ))}
        </VStack>
      </Collapse>
    </Box>
  )
}

const Effects = ({ onEffectChange }) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  const [currentPreset, setCurrentPreset] = useState('Default')
  const [effects, setEffects] = useState([
    {
      name: 'Reverb',
      params: [
        { name: 'Mix', value: 0.3 },
        { name: 'Size', value: 0.5 },
        { name: 'Damping', value: 0.4 },
        { name: 'Pre-Delay', value: 0.2 },
      ]
    },
    {
      name: 'Delay',
      params: [
        { name: 'Mix', value: 0.5 },
        { name: 'Time', value: 0.5 },
        { name: 'Feedback', value: 0.3 },
        { name: 'Tone', value: 0.7 },
      ]
    },
    {
      name: 'Filter',
      params: [
        { name: 'Cutoff', value: 1.0 },
        { name: 'Resonance', value: 0.3 },
        { name: 'Drive', value: 0.2 },
      ]
    },
    {
      name: 'Compressor',
      params: [
        { name: 'Threshold', value: 0.7 },
        { name: 'Ratio', value: 0.4 },
        { name: 'Attack', value: 0.2 },
        { name: 'Release', value: 0.3 },
      ]
    }
  ])

  const presets = [
    { name: 'Default', id: 'default' },
    { name: 'Deep Space', id: 'space' },
    { name: 'Tight Room', id: 'room' },
    { name: 'Fat Bass', id: 'bass' },
    { name: 'Clear Lead', id: 'lead' },
  ]

  const handleParamChange = useCallback((effectName, paramName, value) => {
    setEffects(prev => {
      const newEffects = [...prev]
      const effectIndex = newEffects.findIndex(e => e.name === effectName)
      const paramIndex = newEffects[effectIndex].params.findIndex(p => p.name === paramName)
      newEffects[effectIndex].params[paramIndex].value = value
      return newEffects
    })
    onEffectChange(effectName.toLowerCase(), paramName.toLowerCase(), value)
  }, [onEffectChange])

  const handlePresetChange = useCallback((preset) => {
    setCurrentPreset(preset.name)
    // Here you would load the actual preset values
  }, [])

  const handleSavePreset = useCallback(() => {
    // Here you would save the current settings as a new preset
  }, [])

  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="lg"
      borderWidth={1}
      borderColor={borderColor}
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between" mb={4}>
          <Text fontSize="lg" fontWeight="bold">
            Effects
          </Text>
          <HStack spacing={2}>
            <Menu>
              <MenuButton as={Button} size="sm" rightIcon={<FaChevronDown />}>
                {currentPreset}
              </MenuButton>
              <MenuList>
                {presets.map((preset) => (
                  <MenuItem
                    key={preset.id}
                    onClick={() => handlePresetChange(preset)}
                  >
                    {preset.name}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
            <Tooltip label="Save Preset">
              <IconButton
                icon={<FaSave />}
                onClick={handleSavePreset}
                size="sm"
              />
            </Tooltip>
          </HStack>
        </HStack>

        {effects.map((effect) => (
          <EffectUnit
            key={effect.name}
            name={effect.name}
            params={effect.params}
            onParamChange={(paramName, value) => 
              handleParamChange(effect.name, paramName, value)
            }
            visualizer={(value) => (
              <MotionBox
                initial={{ scaleY: 0 }}
                animate={{ scaleY: value }}
                transition={{ duration: 0.2 }}
                style={{ 
                  height: '100%',
                  backgroundColor: 'var(--chakra-colors-brand-500)',
                  transformOrigin: 'bottom'
                }}
              />
            )}
          />
        ))}
      </VStack>
    </Box>
  )
}

export default Effects 