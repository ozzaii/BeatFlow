import { ChakraProvider, Container, VStack, Heading, Box, Button, useToast } from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import * as Tone from 'tone'
import BeatMaker from './components/BeatMaker'
import theme from './theme'

function App() {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)
  const [isAudioSupported, setIsAudioSupported] = useState(true)
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
  }, [])

  const initializeAudio = async () => {
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
    }
  }

  if (!isAudioSupported) {
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
              >
                Browser Not Supported
              </Heading>
              <Text color="white">
                Your browser does not support the Web Audio API. Please try using a modern browser like Chrome, Firefox, or Safari.
              </Text>
            </VStack>
          </Container>
        </Box>
      </ChakraProvider>
    )
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

            {!isAudioInitialized ? (
              <Button
                onClick={initializeAudio}
                size="lg"
                colorScheme="cyan"
                variant="outline"
                _hover={{
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 20px cyan',
                }}
              >
                Click to Start Audio
              </Button>
            ) : (
              <BeatMaker />
            )}
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App
