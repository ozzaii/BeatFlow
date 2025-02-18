import {
  Box,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  useColorModeValue,
  VStack,
  Button,
  useToast,
} from '@chakra-ui/react'
import { FaPlay, FaStop, FaPause } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import Track from '../components/Track'
import Effects from '../components/Effects'
import { useBeatMaker } from '../hooks/useBeatMaker'

const Studio = () => {
  const toast = useToast()
  const {
    isReady,
    isPlaying,
    currentStep,
    togglePlay,
    stop,
    toggleStep,
    setVolume,
    toggleMute,
    setEffectParam,
    beatMaker,
  } = useBeatMaker()

  const [tracks, setTracks] = useState([])
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  useEffect(() => {
    if (isReady && beatMaker) {
      // Get initial tracks from BeatMaker
      const initialTracks = Array.from(beatMaker.tracks.entries()).map(
        ([name, track]) => ({
          name,
          pattern: track.pattern,
          isMuted: track.muted,
        })
      )
      setTracks(initialTracks)

      // Subscribe to pattern changes
      beatMaker.on('patternChange', ({ track: trackName, pattern }) => {
        setTracks((prevTracks) =>
          prevTracks.map((t) =>
            t.name === trackName ? { ...t, pattern } : t
          )
        )
      })

      // Subscribe to mute changes
      beatMaker.on('muteChange', ({ track: trackName, muted }) => {
        setTracks((prevTracks) =>
          prevTracks.map((t) =>
            t.name === trackName ? { ...t, isMuted: muted } : t
          )
        )
      })
    }
  }, [isReady, beatMaker])

  if (!isReady) {
    return (
      <Box p={8} textAlign="center">
        <Text fontSize="xl">Loading studio...</Text>
      </Box>
    )
  }

  return (
    <Grid
      templateAreas={`
        "controls controls"
        "tracks effects"
      `}
      gridTemplateRows="auto 1fr"
      gridTemplateColumns="2fr 1fr"
      gap={4}
      h="full"
      p={4}
    >
      {/* Transport Controls */}
      <GridItem area="controls">
        <Box
          p={4}
          bg={bgColor}
          borderRadius="lg"
          borderWidth={1}
          borderColor={borderColor}
        >
          <HStack spacing={4} justify="center">
            <IconButton
              icon={isPlaying ? <FaPause /> : <FaPlay />}
              onClick={togglePlay}
              colorScheme="brand"
              size="lg"
              isRound
            />
            <IconButton
              icon={<FaStop />}
              onClick={stop}
              size="lg"
              isRound
            />
            <Slider
              aria-label="timeline-slider"
              value={(currentStep / 16) * 100}
              isReadOnly
              mx={8}
              width="50%"
            >
              <SliderTrack>
                <SliderFilledTrack bg="brand.500" />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Text>
              {Math.floor(currentStep / 4) + 1}.{(currentStep % 4) + 1}
            </Text>
          </HStack>
        </Box>
      </GridItem>

      {/* Tracks Section */}
      <GridItem area="tracks">
        <VStack spacing={4} align="stretch">
          {tracks.map((track) => (
            <Track
              key={track.name}
              name={track.name}
              pattern={track.pattern}
              currentStep={currentStep}
              isMuted={track.isMuted}
              onToggleStep={(step) => toggleStep(track.name, step)}
              onVolumeChange={(value) => setVolume(track.name, value)}
              onToggleMute={() => toggleMute(track.name)}
            />
          ))}
        </VStack>
      </GridItem>

      {/* Effects Section */}
      <GridItem area="effects">
        <Effects onEffectChange={setEffectParam} />
      </GridItem>
    </Grid>
  )
}

export default Studio 