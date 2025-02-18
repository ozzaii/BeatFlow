import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  IconButton,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  useColorModeValue,
  Button,
} from '@chakra-ui/react'
import { FaPlay, FaStop, FaPause, FaSave, FaPlus, FaTrash } from 'react-icons/fa'
import { useState } from 'react'

const Studio = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

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
              onClick={() => setIsPlaying(!isPlaying)}
              colorScheme="brand"
              size="lg"
              isRound
            />
            <IconButton
              icon={<FaStop />}
              onClick={() => setIsPlaying(false)}
              size="lg"
              isRound
            />
            <Slider
              aria-label="timeline-slider"
              defaultValue={0}
              min={0}
              max={100}
              mx={8}
              width="50%"
            >
              <SliderTrack>
                <SliderFilledTrack bg="brand.500" />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
            <Text>00:00:00</Text>
          </HStack>
        </Box>
      </GridItem>

      {/* Tracks Section */}
      <GridItem area="tracks">
        <VStack
          spacing={4}
          align="stretch"
          bg={bgColor}
          p={4}
          borderRadius="lg"
          borderWidth={1}
          borderColor={borderColor}
          h="full"
        >
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">
              Tracks
            </Text>
            <Button leftIcon={<FaPlus />} colorScheme="brand" size="sm">
              Add Track
            </Button>
          </HStack>
          {/* Track List will go here */}
          <Box
            flex={1}
            borderWidth={1}
            borderColor={borderColor}
            borderRadius="md"
            p={4}
          >
            <Text color="gray.500">No tracks added yet</Text>
          </Box>
        </VStack>
      </GridItem>

      {/* Effects Section */}
      <GridItem area="effects">
        <VStack
          spacing={4}
          align="stretch"
          bg={bgColor}
          p={4}
          borderRadius="lg"
          borderWidth={1}
          borderColor={borderColor}
          h="full"
        >
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="bold">
              Effects
            </Text>
            <Button leftIcon={<FaPlus />} colorScheme="brand" size="sm">
              Add Effect
            </Button>
          </HStack>
          {/* Effects List will go here */}
          <Box
            flex={1}
            borderWidth={1}
            borderColor={borderColor}
            borderRadius="md"
            p={4}
          >
            <Text color="gray.500">No effects added yet</Text>
          </Box>
        </VStack>
      </GridItem>
    </Grid>
  )
}

export default Studio 