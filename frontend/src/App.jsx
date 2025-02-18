import { ChakraProvider, Container, VStack, Heading, Box } from '@chakra-ui/react'
import BeatMaker from './components/BeatMaker'
import theme from './theme'

function App() {
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
            <BeatMaker />
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  )
}

export default App
