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
  Center,
  SlideFade,
  ScaleFade,
  Flex,
  Icon,
  useBreakpointValue
} from '@chakra-ui/react'
import { keyframes, css } from '@emotion/react'
import { useState, useEffect, useCallback } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import * as Tone from 'tone'
import { motion, AnimatePresence } from 'framer-motion'
import { FaMusic, FaHeadphones, FaWaveSquare } from 'react-icons/fa'
import BeatMaker from './components/BeatMaker'
import BattleMode from './components/BattleMode'
import Home from './pages/Home'
import theme from './theme'

// Get base URL for GitHub Pages
const basename = process.env.PUBLIC_URL || '/'

// Enhanced animations
const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(0, 255, 255, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 255, 255, 0); }
`

const glowAnimation = keyframes`
  0% { text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff; }
  50% { text-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff, 0 0 40px #00ffff; }
  100% { text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff; }
`

const waveAnimation = keyframes`
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
`

const MotionBox = motion(Box)

function App() {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)
  const [isAudioSupported, setIsAudioSupported] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const isMobile = useBreakpointValue({ base: true, md: false })

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
          position: 'top',
          variant: 'solid',
        })
      }
    }

    checkAudioSupport()
  }, [toast])

  const initializeAudio = useCallback(async () => {
    setIsLoading(true)
    try {
      await Tone.start()
      const audioContext = Tone.getContext()
      await audioContext.resume()

      const osc = new Tone.Oscillator().toDestination()
      osc.volume.value = -Infinity
      osc.start()
      osc.stop('+0.1')

      await Promise.all([
        Tone.loaded(),
        new Promise(resolve => setTimeout(resolve, 100))
      ])

      setIsAudioInitialized(true)
      toast({
        title: 'Ready to Make Beats! 🎵',
        description: 'Audio system initialized successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
        variant: 'solid',
      })
    } catch (error) {
      console.error('Audio initialization error:', error)
      toast({
        title: 'Audio Error',
        description: `Could not initialize audio: ${error.message}. Please try again.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
        variant: 'solid',
      })
      setIsAudioInitialized(false)
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const renderContent = () => {
    if (!isAudioSupported) {
      return (
        <ScaleFade initialScale={0.9} in={true}>
          <VStack spacing={8} p={8}>
            <Icon
              as={FaHeadphones}
              w={24}
              h={24}
              color="red.500"
              css={css`animation: ${waveAnimation} 3s ease-in-out infinite;`}
            />
            <Heading
              size="2xl"
              bgGradient="linear(to-r, red.500, pink.500)"
              bgClip="text"
              textShadow="0 0 20px rgba(255, 0, 0, 0.5)"
              fontWeight="extrabold"
              letterSpacing="wider"
              textAlign="center"
            >
              Browser Not Supported
            </Heading>
            <Text
              color="whiteAlpha.900"
              fontSize="xl"
              textAlign="center"
              maxW="600px"
            >
              Your browser does not support the Web Audio API. Please try using a modern browser like Chrome, Firefox, or Safari for the best experience.
            </Text>
          </VStack>
        </ScaleFade>
      )
    }

    if (isLoading) {
      return (
        <Center minH="50vh">
          <VStack spacing={8}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="whiteAlpha.200"
              color="brand.500"
              size="xl"
              css={css`
                animation: ${pulseAnimation} 2s infinite;
              `}
            />
            <Text
              color="whiteAlpha.900"
              fontSize="xl"
              css={css`
                animation: ${glowAnimation} 2s infinite;
              `}
            >
              Initializing Audio System...
            </Text>
          </VStack>
        </Center>
      )
    }

    if (!isAudioInitialized) {
      return (
        <Center minH="50vh">
          <VStack spacing={8}>
            <Icon
              as={FaMusic}
              w={16}
              h={16}
              color="brand.500"
              css={css`animation: ${waveAnimation} 3s ease-in-out infinite;`}
            />
            <Button
              onClick={initializeAudio}
              size="lg"
              variant="neon"
              leftIcon={<FaWaveSquare />}
              isLoading={isLoading}
              loadingText="Initializing..."
              fontSize="xl"
              py={8}
              px={12}
              _hover={{
                transform: 'scale(1.1)',
                boxShadow: '0 0 30px var(--chakra-colors-brand-500)',
              }}
            >
              Start Making Beats
            </Button>
            <Text
              color="whiteAlpha.700"
              fontSize="md"
              textAlign="center"
              maxW="400px"
            >
              Click to initialize the audio system and start creating your next hit!
            </Text>
          </VStack>
        </Center>
      )
    }

    return (
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<BeatMaker />} />
          <Route path="/battle" element={<BattleMode />} />
        </Routes>
      </Router>
    )
  }

  return (
    <ChakraProvider theme={theme}>
      <Box
        minH="100vh"
        bg="black"
        bgGradient="radial-gradient(circle at center, rgba(0,255,255,0.1) 0%, rgba(0,0,0,1) 70%)"
        py={8}
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(180deg, rgba(0,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          pointerEvents: 'none',
        }}
      >
        <Container maxW={isMobile ? "container.sm" : "container.lg"}>
          <VStack spacing={12}>
            <Heading
              size="2xl"
              bgGradient="linear(to-r, brand.500, accent.500)"
              bgClip="text"
              textShadow="0 0 20px rgba(0, 255, 255, 0.5)"
              fontWeight="extrabold"
              letterSpacing="wider"
              textAlign="center"
              css={css`
                animation: ${glowAnimation} 3s infinite;
                &:hover {
                  animation: ${pulseAnimation} 2s infinite;
                }
              `}
            >
              BeatFlow
            </Heading>

            <AnimatePresence mode="wait">
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                width="100%"
              >
                {renderContent()}
              </MotionBox>
            </AnimatePresence>
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App 