import {
  Box,
  HStack,
  IconButton,
  Text,
  useColorModeValue,
  VStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  SimpleGrid,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import { FaVolumeMute, FaVolumeUp, FaCopy, FaPaste, FaTrash, FaRandom } from 'react-icons/fa'
import { motion } from 'framer-motion'
import { useState, useCallback, useRef } from 'react'

const MotionBox = motion(Box)

const Track = ({
  name,
  pattern,
  currentStep,
  isMuted,
  onToggleStep,
  onVolumeChange,
  onToggleMute,
  onCopyPattern,
  onPastePattern,
  onClearPattern,
  onRandomizePattern,
  presets = [],
  onSelectPreset,
}) => {
  const [velocities, setVelocities] = useState(pattern.map(() => 100))
  const [isDragging, setIsDragging] = useState(false)
  const lastToggledStep = useRef(null)

  const bgColor = useColorModeValue('white', 'gray.800')
  const stepBgColor = useColorModeValue('gray.100', 'gray.700')
  const activeStepBgColor = useColorModeValue('brand.500', 'brand.400')
  const currentStepBgColor = useColorModeValue('orange.200', 'orange.500')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const handleStepClick = useCallback((stepIndex) => {
    onToggleStep(stepIndex)
    lastToggledStep.current = stepIndex
  }, [onToggleStep])

  const handleStepMouseEnter = useCallback((stepIndex) => {
    if (isDragging && lastToggledStep.current !== stepIndex) {
      onToggleStep(stepIndex)
      lastToggledStep.current = stepIndex
    }
  }, [isDragging, onToggleStep])

  const handleVelocityChange = useCallback((stepIndex, value) => {
    setVelocities(prev => {
      const newVelocities = [...prev]
      newVelocities[stepIndex] = value
      return newVelocities
    })
  }, [])

  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="lg"
      borderWidth={1}
      borderColor={borderColor}
      position="relative"
    >
      <HStack spacing={4} mb={4}>
        <Text fontWeight="bold" fontSize="md" w="100px" isTruncated>
          {name}
        </Text>
        
        <Menu>
          <MenuButton as={Button} size="sm" colorScheme="gray">
            Presets
          </MenuButton>
          <MenuList>
            {presets.map((preset, index) => (
              <MenuItem key={index} onClick={() => onSelectPreset(preset)}>
                {preset.name}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        <IconButton
          icon={isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
          onClick={onToggleMute}
          size="sm"
          colorScheme={isMuted ? 'red' : 'green'}
        />
        
        <Slider
          aria-label="volume-slider"
          defaultValue={100}
          min={0}
          max={100}
          onChange={onVolumeChange}
          width="150px"
        >
          <SliderTrack>
            <SliderFilledTrack bg="brand.500" />
          </SliderTrack>
          <SliderThumb />
        </Slider>

        <HStack>
          <Tooltip label="Copy Pattern">
            <IconButton
              icon={<FaCopy />}
              onClick={onCopyPattern}
              size="sm"
              variant="ghost"
            />
          </Tooltip>
          <Tooltip label="Paste Pattern">
            <IconButton
              icon={<FaPaste />}
              onClick={onPastePattern}
              size="sm"
              variant="ghost"
            />
          </Tooltip>
          <Tooltip label="Clear Pattern">
            <IconButton
              icon={<FaTrash />}
              onClick={onClearPattern}
              size="sm"
              variant="ghost"
            />
          </Tooltip>
          <Tooltip label="Randomize Pattern">
            <IconButton
              icon={<FaRandom />}
              onClick={onRandomizePattern}
              size="sm"
              variant="ghost"
            />
          </Tooltip>
        </HStack>
      </HStack>

      <SimpleGrid columns={16} spacing={1}>
        {pattern.map((isActive, index) => (
          <Popover key={index} trigger="hover">
            <PopoverTrigger>
              <MotionBox
                bg={
                  currentStep === index
                    ? currentStepBgColor
                    : isActive
                    ? activeStepBgColor
                    : stepBgColor
                }
                h="40px"
                borderRadius="md"
                cursor="pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => {
                  setIsDragging(true)
                  handleStepClick(index)
                }}
                onMouseEnter={() => handleStepMouseEnter(index)}
                onMouseUp={() => setIsDragging(false)}
                opacity={isActive ? velocities[index] / 100 : 1}
              />
            </PopoverTrigger>
            {isActive && (
              <PopoverContent width="200px">
                <PopoverBody>
                  <VStack spacing={2}>
                    <Text fontSize="sm">Velocity</Text>
                    <Slider
                      value={velocities[index]}
                      onChange={(value) => handleVelocityChange(index, value)}
                      min={0}
                      max={100}
                    >
                      <SliderTrack>
                        <SliderFilledTrack bg="brand.500" />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            )}
          </Popover>
        ))}
      </SimpleGrid>
    </Box>
  )
}

export default Track 