import {
  Box,
  VStack,
  HStack,
  IconButton,
  Button,
  Text,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  SimpleGrid,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaFolder, FaCog, FaRandom } from 'react-icons/fa'
import { useState, useCallback, useRef } from 'react'
import { useTouchInteraction } from '../hooks/useTouchInteraction'
import { useSampleManager } from '../hooks/useSampleManager'
import { usePatternManager } from '../hooks/usePatternManager'
import Track from './Track'

const MotionBox = motion(Box)

const DrumRack = ({ onPatternChange }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [tracks, setTracks] = useState([])
  const [selectedTrack, setSelectedTrack] = useState(null)
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  const {
    loadSample,
    loadSamples,
    SAMPLE_CATEGORIES,
  } = useSampleManager()
  
  const {
    createPattern,
    updatePattern,
    generatePattern,
    createVariation,
    applyGroove,
    PATTERN_TYPES,
    GROOVE_TEMPLATES,
  } = usePatternManager()

  // Touch interaction setup
  const {
    gesture,
    handlers: touchHandlers,
  } = useTouchInteraction({
    onLongPress: ({ x, y }) => {
      // Handle long press for context menu
    },
    onSwipe: ({ direction }) => {
      // Handle swipe for track actions
    },
  })

  // Add new drum track
  const addTrack = useCallback(async (type) => {
    const patternId = createPattern(type)
    const sampleId = await loadSample(`/samples/drums/${type}.wav`, 'DRUMS', type)
    
    setTracks(prev => [...prev, {
      id: crypto.randomUUID(),
      name: type.toUpperCase(),
      patternId,
      sampleId,
      type,
    }])
  }, [createPattern, loadSample])

  // Generate random pattern
  const generateRandomPattern = useCallback((trackId) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    generatePattern(track.type, {
      style: 'BASIC',
      complexity: 0.5,
      density: 0.5,
    })
  }, [tracks, generatePattern])

  // Create pattern variation
  const createPatternVariation = useCallback((trackId, variationType) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    createVariation(track.patternId, variationType)
  }, [tracks, createVariation])

  // Apply groove template
  const applyGrooveTemplate = useCallback((trackId, grooveType) => {
    const track = tracks.find(t => t.id === trackId)
    if (!track) return

    applyGroove(track.patternId, grooveType)
  }, [tracks, applyGroove])

  // Handle track selection
  const handleTrackSelect = useCallback((trackId) => {
    setSelectedTrack(trackId)
    onOpen()
  }, [onOpen])

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      borderWidth={1}
      borderColor={borderColor}
      p={4}
      {...touchHandlers}
    >
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="bold">Drum Rack</Text>
          <HStack spacing={2}>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaPlus />}
                variant="ghost"
                size="sm"
              />
              <MenuList>
                {Object.entries(SAMPLE_CATEGORIES.DRUMS).map(([key, value]) => (
                  <MenuItem
                    key={key}
                    onClick={() => addTrack(value)}
                  >
                    {key}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
            <Tooltip label="Browse Samples">
              <IconButton
                icon={<FaFolder />}
                variant="ghost"
                size="sm"
                onClick={onOpen}
              />
            </Tooltip>
          </HStack>
        </HStack>

        <AnimatePresence>
          {tracks.map((track, index) => (
            <MotionBox
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Track
                name={track.name}
                pattern={track.patternId}
                isMuted={track.isMuted}
                onToggleStep={(step) => {
                  updatePattern(track.patternId, {
                    steps: track.pattern.steps.map((s, i) => 
                      i === step ? !s : s
                    ),
                  })
                }}
                onVolumeChange={(value) => {
                  // Handle volume change
                }}
                onToggleMute={() => {
                  // Handle mute toggle
                }}
                onCopyPattern={() => {
                  // Handle pattern copy
                }}
                onPastePattern={() => {
                  // Handle pattern paste
                }}
                onClearPattern={() => {
                  updatePattern(track.patternId, {
                    steps: new Array(16).fill(false),
                  })
                }}
                onRandomizePattern={() => generateRandomPattern(track.id)}
                presets={[
                  { name: 'Basic', id: 'basic' },
                  { name: 'Complex', id: 'complex' },
                  { name: 'Minimal', id: 'minimal' },
                ]}
                onSelectPreset={(preset) => {
                  generatePattern(track.type, {
                    style: preset.id.toUpperCase(),
                    complexity: 0.5,
                    density: 0.5,
                  })
                }}
              />
            </MotionBox>
          ))}
        </AnimatePresence>
      </VStack>

      {/* Sample Browser Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Sample Browser</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              {Object.entries(SAMPLE_CATEGORIES.DRUMS).map(([category, samples]) => (
                <Box key={category}>
                  <Text fontWeight="bold" mb={2}>{category}</Text>
                  <SimpleGrid columns={2} spacing={2}>
                    {Array.isArray(samples) ? samples.map((sample) => (
                      <Button
                        key={sample.id}
                        onClick={() => {
                          loadSample(sample.url, 'DRUMS', sample.name)
                          onClose()
                        }}
                        size="sm"
                        variant="outline"
                      >
                        {sample.name}
                      </Button>
                    )) : (
                      <Text>No samples available</Text>
                    )}
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

export default DrumRack 