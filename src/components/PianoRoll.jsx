import {
  Box,
  HStack,
  VStack,
  IconButton,
  Text,
  useColorModeValue,
  Tooltip,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaMinus, FaArrowsAlt, FaMagnet } from 'react-icons/fa'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useTouchInteraction } from '../hooks/useTouchInteraction'

const MotionBox = motion(Box)

// Constants
const NOTES = ['B', 'A#', 'A', 'G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C']
const OCTAVES = [5, 4, 3, 2]
const GRID_SUBDIVISIONS = 16
const DEFAULT_NOTE_DURATION = 1 // In grid units

const PianoRoll = ({
  notes = [],
  onNoteChange,
  scale = [],
  rootNote = 'C',
  gridSize = GRID_SUBDIVISIONS,
  measures = 1,
}) => {
  const [zoom, setZoom] = useState(1)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [selectedNotes, setSelectedNotes] = useState(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  
  const gridRef = useRef(null)
  const pianoRef = useRef(null)
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const noteColor = useColorModeValue('brand.500', 'brand.400')
  const scaleNoteColor = useColorModeValue('green.100', 'green.900')
  const whiteKeyColor = useColorModeValue('white', 'gray.700')
  const blackKeyColor = useColorModeValue('black', 'gray.900')
  
  // Touch interaction setup
  const {
    gesture,
    handlers: touchHandlers,
  } = useTouchInteraction({
    onTap: ({ x, y }) => handleNoteAdd(x, y),
    onPan: ({ deltaX, deltaY }) => handleNoteDrag(deltaX, deltaY),
    onPinch: ({ scale }) => setZoom(prev => Math.max(0.5, Math.min(2, prev * scale))),
  })

  // Convert screen coordinates to note data
  const coordsToNote = useCallback((x, y) => {
    if (!gridRef.current) return null
    
    const rect = gridRef.current.getBoundingClientRect()
    const gridX = x - rect.left
    const gridY = y - rect.top
    
    const step = Math.floor((gridX / rect.width) * gridSize)
    const noteIndex = Math.floor((gridY / rect.height) * (NOTES.length * OCTAVES.length))
    
    if (step < 0 || step >= gridSize || noteIndex < 0 || noteIndex >= NOTES.length * OCTAVES.length) {
      return null
    }
    
    const octave = OCTAVES[Math.floor(noteIndex / NOTES.length)]
    const note = NOTES[noteIndex % NOTES.length]
    
    return {
      note: `${note}${octave}`,
      step,
      duration: DEFAULT_NOTE_DURATION,
      velocity: 100,
    }
  }, [gridSize])

  // Add new note
  const handleNoteAdd = useCallback((x, y) => {
    const newNote = coordsToNote(x, y)
    if (!newNote) return
    
    onNoteChange([...notes, newNote])
  }, [notes, onNoteChange, coordsToNote])

  // Handle note selection
  const handleNoteSelect = useCallback((noteId, multiSelect = false) => {
    setSelectedNotes(prev => {
      const newSelection = new Set(multiSelect ? prev : [])
      if (prev.has(noteId)) {
        newSelection.delete(noteId)
      } else {
        newSelection.add(noteId)
      }
      return newSelection
    })
  }, [])

  // Handle note dragging
  const handleNoteDrag = useCallback((deltaX, deltaY) => {
    if (!isDragging || selectedNotes.size === 0) return
    
    const gridWidth = gridRef.current?.getBoundingClientRect().width ?? 0
    const gridHeight = gridRef.current?.getBoundingClientRect().height ?? 0
    
    const stepDelta = Math.round((deltaX / gridWidth) * gridSize)
    const noteDelta = Math.round((deltaY / gridHeight) * (NOTES.length * OCTAVES.length))
    
    onNoteChange(notes.map(note => {
      if (!selectedNotes.has(note.id)) return note
      
      const currentNoteIndex = NOTES.indexOf(note.note[0]) + (parseInt(note.note[1]) * NOTES.length)
      const newNoteIndex = Math.max(0, Math.min(NOTES.length * OCTAVES.length - 1, currentNoteIndex + noteDelta))
      const newOctave = OCTAVES[Math.floor(newNoteIndex / NOTES.length)]
      const newNote = NOTES[newNoteIndex % NOTES.length]
      
      return {
        ...note,
        note: `${newNote}${newOctave}`,
        step: Math.max(0, Math.min(gridSize - note.duration, note.step + stepDelta)),
      }
    }))
  }, [isDragging, selectedNotes, notes, onNoteChange, gridSize])

  // Render piano keys
  const renderPianoKeys = useCallback(() => {
    return OCTAVES.map(octave => (
      NOTES.map(note => {
        const isBlackKey = note.includes('#')
        const isInScale = scale.includes(note)
        
        return (
          <Box
            key={`${note}${octave}`}
            height="30px"
            bg={isBlackKey ? blackKeyColor : whiteKeyColor}
            borderBottomWidth={1}
            borderRightWidth={1}
            borderColor={borderColor}
            position="relative"
            cursor="pointer"
            _hover={{
              bg: isBlackKey ? 'gray.800' : 'gray.100',
            }}
            onClick={() => {
              // Play note preview
            }}
          >
            {!isBlackKey && (
              <Text
                position="absolute"
                left={2}
                top="50%"
                transform="translateY(-50%)"
                fontSize="xs"
                color={isBlackKey ? 'white' : 'black'}
              >
                {`${note}${octave}`}
              </Text>
            )}
            {isInScale && (
              <Box
                position="absolute"
                right={0}
                top={0}
                bottom={0}
                width={2}
                bg={scaleNoteColor}
              />
            )}
          </Box>
        )
      })
    ))
  }, [scale, borderColor, blackKeyColor, whiteKeyColor, scaleNoteColor])

  // Render grid
  const renderGrid = useCallback(() => {
    const totalSteps = gridSize * measures
    
    return (
      <Box
        ref={gridRef}
        position="relative"
        width="full"
        height="full"
        bg={bgColor}
        {...touchHandlers}
      >
        {/* Vertical grid lines */}
        {Array.from({ length: totalSteps + 1 }).map((_, i) => (
          <Box
            key={`v-${i}`}
            position="absolute"
            left={`${(i / totalSteps) * 100}%`}
            top={0}
            bottom={0}
            width="1px"
            bg={i % 4 === 0 ? borderColor : 'gray.100'}
            opacity={i % 4 === 0 ? 0.5 : 0.2}
          />
        ))}

        {/* Horizontal grid lines */}
        {Array.from({ length: NOTES.length * OCTAVES.length + 1 }).map((_, i) => (
          <Box
            key={`h-${i}`}
            position="absolute"
            top={`${(i / (NOTES.length * OCTAVES.length)) * 100}%`}
            left={0}
            right={0}
            height="1px"
            bg={borderColor}
            opacity={0.2}
          />
        ))}

        {/* Notes */}
        <AnimatePresence>
          {notes.map((note, index) => {
            const noteIndex = NOTES.indexOf(note.note[0]) + (parseInt(note.note[1]) * NOTES.length)
            const isSelected = selectedNotes.has(note.id)
            
            return (
              <MotionBox
                key={note.id || index}
                position="absolute"
                top={`${(noteIndex / (NOTES.length * OCTAVES.length)) * 100}%`}
                left={`${(note.step / totalSteps) * 100}%`}
                width={`${(note.duration / totalSteps) * 100}%`}
                height={`${100 / (NOTES.length * OCTAVES.length)}%`}
                bg={noteColor}
                opacity={note.velocity / 100}
                borderRadius="sm"
                cursor="pointer"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ 
                  scale: isSelected ? 1.05 : 1,
                  opacity: note.velocity / 100,
                }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleNoteSelect(note.id, e.shiftKey)
                }}
                _hover={{
                  filter: 'brightness(1.1)',
                }}
              >
                {/* Velocity handle */}
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  height="4px"
                  cursor="ns-resize"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    // Handle velocity adjustment
                  }}
                />
              </MotionBox>
            )
          })}
        </AnimatePresence>
      </Box>
    )
  }, [notes, selectedNotes, measures, gridSize, bgColor, borderColor, noteColor, handleNoteSelect, touchHandlers])

  return (
    <Box
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
    >
      {/* Toolbar */}
      <HStack p={2} borderBottomWidth={1} borderColor={borderColor}>
        <Tooltip label="Zoom In">
          <IconButton
            icon={<FaPlus />}
            size="sm"
            variant="ghost"
            onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
          />
        </Tooltip>
        <Tooltip label="Zoom Out">
          <IconButton
            icon={<FaMinus />}
            size="sm"
            variant="ghost"
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
          />
        </Tooltip>
        <Tooltip label="Snap to Grid">
          <IconButton
            icon={<FaMagnet />}
            size="sm"
            variant="ghost"
            isActive={snapToGrid}
            onClick={() => setSnapToGrid(prev => !prev)}
          />
        </Tooltip>
      </HStack>

      {/* Main Editor */}
      <HStack spacing={0} height="400px">
        {/* Piano Keys */}
        <Box
          ref={pianoRef}
          width="100px"
          height="full"
          borderRightWidth={1}
          borderColor={borderColor}
          overflowY="hidden"
        >
          <VStack spacing={0} align="stretch">
            {renderPianoKeys()}
          </VStack>
        </Box>

        {/* Note Grid */}
        <Box
          flex={1}
          height="full"
          overflowX="auto"
          overflowY="hidden"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {renderGrid()}
        </Box>
      </HStack>
    </Box>
  )
}

export default PianoRoll 