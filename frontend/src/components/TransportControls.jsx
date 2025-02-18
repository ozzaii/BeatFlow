import {
  Box,
  HStack,
  IconButton,
  Button,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  VStack,
  Switch,
} from '@chakra-ui/react'
import {
  FaPlay,
  FaStop,
  FaPause,
  FaMetronome,
  FaRecordVinyl,
  FaCog,
  FaStepForward,
  FaStepBackward,
  FaUndo,
} from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useTouchInteraction } from '../hooks/useTouchInteraction'

const MotionBox = motion(Box)

const TransportControls = ({
  isPlaying,
  onPlay,
  onStop,
  onPause,
  bpm,
  onBpmChange,
  currentBeat,
  totalBeats = 16,
  timeSignature = '4/4',
  onTimeSignatureChange,
  isRecording = false,
  onRecordToggle,
  isMetronomeEnabled = false,
  onMetronomeToggle,
}) => {
  const [isLooping, setIsLooping] = useState(false)
  const [loopStart, setLoopStart] = useState(0)
  const [loopEnd, setLoopEnd] = useState(totalBeats)
  const [showBeatMarkers, setShowBeatMarkers] = useState(true)
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const activeColor = useColorModeValue('brand.500', 'brand.400')
  const beatColor = useColorModeValue('gray.200', 'gray.600')
  const currentBeatColor = useColorModeValue('orange.400', 'orange.500')
  
  const timelineRef = useRef(null)

  // Touch interaction for timeline
  const {
    gesture,
    handlers: touchHandlers,
  } = useTouchInteraction({
    onTap: ({ x }) => {
      if (!timelineRef.current) return
      const rect = timelineRef.current.getBoundingClientRect()
      const position = (x - rect.left) / rect.width
      const beat = Math.floor(position * totalBeats)
      // Handle beat selection
    },
    onPan: ({ deltaX }) => {
      // Handle timeline scrubbing
    },
  })

  // Handle tempo tap
  const tapTempoRef = useRef({
    times: [],
    lastTap: 0,
  })

  const handleTapTempo = useCallback(() => {
    const now = Date.now()
    const { times, lastTap } = tapTempoRef.current
    
    if (now - lastTap > 2000) {
      times.length = 0
    }
    
    times.push(now)
    if (times.length > 4) times.shift()
    
    if (times.length > 1) {
      const intervals = []
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1])
      }
      
      const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length
      const newBpm = Math.round(60000 / averageInterval)
      
      if (newBpm >= 30 && newBpm <= 300) {
        onBpmChange(newBpm)
      }
    }
    
    tapTempoRef.current.lastTap = now
  }, [onBpmChange])

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      borderWidth={1}
      borderColor={borderColor}
      p={4}
    >
      <VStack spacing={4}>
        {/* Main Controls */}
        <HStack spacing={4} width="full" justify="center">
          <Tooltip label="Record">
            <IconButton
              icon={<FaRecordVinyl />}
              isActive={isRecording}
              onClick={onRecordToggle}
              colorScheme={isRecording ? 'red' : 'gray'}
              variant="ghost"
              size="lg"
              isRound
            />
          </Tooltip>
          
          <IconButton
            icon={<FaStepBackward />}
            onClick={() => {/* Handle step backward */}}
            variant="ghost"
            size="lg"
          />
          
          <IconButton
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            onClick={isPlaying ? onPause : onPlay}
            colorScheme="brand"
            size="lg"
            isRound
          />
          
          <IconButton
            icon={<FaStop />}
            onClick={onStop}
            variant="ghost"
            size="lg"
          />
          
          <IconButton
            icon={<FaStepForward />}
            onClick={() => {/* Handle step forward */}}
            variant="ghost"
            size="lg"
          />
          
          <Tooltip label="Metronome">
            <IconButton
              icon={<FaMetronome />}
              isActive={isMetronomeEnabled}
              onClick={onMetronomeToggle}
              variant="ghost"
              size="lg"
            />
          </Tooltip>
        </HStack>

        {/* Timeline */}
        <Box
          ref={timelineRef}
          width="full"
          height="60px"
          position="relative"
          {...touchHandlers}
        >
          {/* Beat Markers */}
          {showBeatMarkers && (
            <HStack
              spacing={0}
              position="absolute"
              top={0}
              left={0}
              right={0}
              height="full"
              pointerEvents="none"
            >
              {Array.from({ length: totalBeats }).map((_, i) => (
                <Box
                  key={i}
                  flex={1}
                  height="full"
                  borderLeftWidth={i % 4 === 0 ? 2 : 1}
                  borderColor={i === currentBeat ? currentBeatColor : beatColor}
                  opacity={i % 4 === 0 ? 1 : 0.5}
                />
              ))}
            </HStack>
          )}

          {/* Playhead */}
          <AnimatePresence>
            {isPlaying && (
              <MotionBox
                position="absolute"
                top={0}
                height="full"
                width="2px"
                bg={activeColor}
                initial={{ left: `${(currentBeat / totalBeats) * 100}%` }}
                animate={{ left: `${(currentBeat / totalBeats) * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            )}
          </AnimatePresence>

          {/* Loop Region */}
          {isLooping && (
            <Box
              position="absolute"
              top={0}
              left={`${(loopStart / totalBeats) * 100}%`}
              width={`${((loopEnd - loopStart) / totalBeats) * 100}%`}
              height="full"
              bg={activeColor}
              opacity={0.1}
            />
          )}
        </Box>

        {/* Transport Settings */}
        <HStack width="full" spacing={6} justify="center">
          {/* BPM Control */}
          <HStack>
            <Text fontSize="sm" fontWeight="bold">BPM</Text>
            <NumberInput
              value={bpm}
              onChange={(value) => onBpmChange(parseInt(value))}
              min={30}
              max={300}
              width="80px"
              size="sm"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Tooltip label="Tap Tempo">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleTapTempo}
              >
                TAP
              </Button>
            </Tooltip>
          </HStack>

          {/* Time Signature */}
          <Menu>
            <MenuButton as={Button} size="sm" variant="ghost">
              {timeSignature}
            </MenuButton>
            <MenuList>
              {['4/4', '3/4', '6/8', '5/4'].map((ts) => (
                <MenuItem
                  key={ts}
                  onClick={() => onTimeSignatureChange(ts)}
                >
                  {ts}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Loop Control */}
          <HStack>
            <Text fontSize="sm">Loop</Text>
            <Switch
              isChecked={isLooping}
              onChange={(e) => setIsLooping(e.target.checked)}
              size="sm"
            />
          </HStack>

          {/* Settings */}
          <Popover>
            <PopoverTrigger>
              <IconButton
                icon={<FaCog />}
                variant="ghost"
                size="sm"
              />
            </PopoverTrigger>
            <PopoverContent>
              <PopoverBody>
                <VStack align="start" spacing={3}>
                  <HStack justify="space-between" width="full">
                    <Text fontSize="sm">Show Beat Markers</Text>
                    <Switch
                      isChecked={showBeatMarkers}
                      onChange={(e) => setShowBeatMarkers(e.target.checked)}
                      size="sm"
                    />
                  </HStack>
                  {isLooping && (
                    <>
                      <HStack width="full">
                        <Text fontSize="sm">Loop Start</Text>
                        <NumberInput
                          value={loopStart}
                          onChange={(value) => setLoopStart(parseInt(value))}
                          min={0}
                          max={loopEnd - 1}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </HStack>
                      <HStack width="full">
                        <Text fontSize="sm">Loop End</Text>
                        <NumberInput
                          value={loopEnd}
                          onChange={(value) => setLoopEnd(parseInt(value))}
                          min={loopStart + 1}
                          max={totalBeats}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </HStack>
                    </>
                  )}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>
      </VStack>
    </Box>
  )
}

export default TransportControls 