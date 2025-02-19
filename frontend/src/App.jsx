import { 
  ChakraProvider, 
  Container, 
  VStack, 
  Heading, 
  Box, 
  Button, 
  useToast, 
  Text,
  Spinner,
  Center
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useState, useEffect } from 'react'
import * as Tone from 'tone'
import BeatMaker from './components/BeatMaker'
import theme from './theme'

// Define animations
const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(0, 255, 255, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 255, 0); }
`

function App() {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)
  const [isAudioSupported, setIsAudioSupported] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  // Check audio support on mount
  useEffect(() => {
    const checkAudioSupport = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) {
        setIsAudioSupported(false)
        toast({
          title: 'Audio Not Supported',
          description: 'Your browser does not support the Web Audio API. Please try a different browser.',
          status: 'error',
          duration: null,
          isClosable: true,
        })
      }
    }

    checkAudioSupport()
  }, [toast])

  const initializeAudio = async () => {
    setIsLoading(true)
    try {
      // Ensure we're in a secure context
      if (!window.isSecureContext) {
        throw new Error('Audio requires a secure context (HTTPS)')
      }

      // Start audio context
      await Tone.start()
      
      // Test audio by playing a silent note
      const testOsc = new Tone.Oscillator().toDestination()
      testOsc.volume.value = -Infinity // Silent
      testOsc.start().stop('+0.1')
      
      // Clean up test oscillator
      setTimeout(() => testOsc.dispose(), 200)

      // Wait for Tone.js to be fully initialized
      await Tone.loaded()
      
      setIsAudioInitialized(true)
      
      toast({
        title: 'Audio Initialized',
        description: 'You can now start making beats!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      toast({
        title: 'Audio Error',
        description: `Failed to initialize audio: ${error.message}. Please try again.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      // Reset state on error
      setIsAudioInitialized(false)
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => {
    if (!isAudioSupported) {
      return (
        <VStack spacing={6}>
          <Heading
            size="2xl"
            bgGradient="linear(to-r, #00ffff, #ff00ff)"
            bgClip="text"
            textShadow="0 0 20px rgba(0, 255, 255, 0.5)"
            fontWeight="extrabold"
            letterSpacing="wider"
            textAlign="center"
          >
            Browser Not Supported
          </Heading>
          <Text color="white" fontSize="lg" textAlign="center">
            Your browser does not support the Web Audio API. Please try using a modern browser like Chrome, Firefox, or Safari.
          </Text>
        </VStack>
      )
    }

    if (isLoading) {
      return (
        <Center>
          <VStack spacing={6}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="cyan.500"
              size="xl"
            />
            <Text color="white" fontSize="lg">
              Initializing Audio...
            </Text>
          </VStack>
        </Center>
      )
    }

    if (!isAudioInitialized) {
      return (
        <Button
          onClick={initializeAudio}
          size="lg"
          colorScheme="cyan"
          variant="outline"
          isLoading={isLoading}
          animation={`${pulseAnimation} 2s infinite`}
          _hover={{
            transform: 'scale(1.05)',
            boxShadow: '0 0 20px cyan',
          }}
        >
          Click to Start Audio
        </Button>
      )
    }

    return <BeatMaker />
  }

  return (
    <ChakraProvider theme={theme}>
      <Box
        minH="100vh"
        bg="black"
        bgGradient="radial-gradient(circle at center, rgba(0,255,255,0.1) 0%, rgba(0,0,0,1) 70%)"
        py={8}
      >
        <Container maxW="container.lg">
          <VStack spacing={12}>
            <Heading
              size="2xl"
              bgGradient="linear(to-r, #00ffff, #ff00ff)"
              bgClip="text"
              textShadow="0 0 20px rgba(0, 255, 255, 0.5)"
              fontWeight="extrabold"
              letterSpacing="wider"
              textAlign="center"
              _hover={{
                transform: 'scale(1.05)',
                transition: 'transform 0.3s ease-in-out',
              }}
            >
              BeatFlow
            </Heading>

            {renderContent()}
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App
