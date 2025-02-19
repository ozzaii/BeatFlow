import {
  Box,
  Heading,
  Container,
  Text,
  Button,
  Stack,
  Icon,
  useColorModeValue,
  VStack,
  HStack,
  SimpleGrid,
  Flex,
  useBreakpointValue,
  ScaleFade,
  SlideFade,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FaPlay, FaMusic, FaRobot, FaShare, FaHeadphones } from 'react-icons/fa'

const MotionBox = motion(Box)

const Feature = ({ title, text, icon }) => {
  return (
    <VStack
      align="center"
      p={8}
      bg="dark.200"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      _hover={{
        transform: 'translateY(-8px)',
        borderColor: 'brand.500',
        boxShadow: '0 0 30px var(--chakra-colors-brand-500)',
      }}
      transition="all 0.3s"
    >
      <Icon as={icon} w={10} h={10} color="brand.500" mb={4} />
      <Text
        fontWeight="bold"
        fontSize="xl"
        color="whiteAlpha.900"
        mb={2}
      >
        {title}
      </Text>
      <Text
        color="whiteAlpha.700"
        textAlign="center"
        fontSize="md"
      >
        {text}
      </Text>
    </VStack>
  )
}

const Home = () => {
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, md: false })

  const features = [
    {
      title: 'AI-Powered Creation',
      text: 'Let artificial intelligence inspire your next hit with smart pattern generation and melody suggestions.',
      icon: FaRobot,
    },
    {
      title: 'Professional Sound',
      text: 'Access high-quality samples and professional-grade effects to craft the perfect sound.',
      icon: FaHeadphones,
    },
    {
      title: 'Real-Time Collaboration',
      text: 'Share and collaborate on beats with other producers in real-time.',
      icon: FaShare,
    },
    {
      title: 'Intuitive Interface',
      text: 'Easy-to-use tools that let you focus on creativity without technical barriers.',
      icon: FaMusic,
    },
  ]

  return (
    <Box
      minH="100vh"
      bg="black"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgGradient: 'radial-gradient(circle at center, rgba(0,255,255,0.1) 0%, rgba(0,0,0,1) 70%)',
        backgroundImage: 'linear-gradient(180deg, rgba(0,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        pointerEvents: 'none',
      }}
    >
      <Container maxW="container.xl" py={{ base: 20, md: 36 }}>
        <Stack spacing={{ base: 16, md: 24 }}>
          {/* Hero Section */}
          <Stack
            align="center"
            spacing={{ base: 8, md: 10 }}
            textAlign="center"
          >
            <ScaleFade initialScale={0.9} in={true}>
              <Heading
                fontSize={{ base: '4xl', sm: '5xl', md: '6xl', lg: '7xl' }}
                fontWeight="extrabold"
                bgGradient="linear(to-r, brand.500, accent.500)"
                bgClip="text"
                textShadow="0 0 20px rgba(0, 255, 255, 0.5)"
                lineHeight="shorter"
              >
                Create Music with{' '}
                <Text
                  as="span"
                  position="relative"
                  _after={{
                    content: "''",
                    width: 'full',
                    height: '30%',
                    position: 'absolute',
                    bottom: 1,
                    left: 0,
                    bg: 'brand.500',
                    opacity: 0.3,
                    zIndex: -1,
                  }}
                >
                  Artificial Intelligence
                </Text>
              </Heading>
            </ScaleFade>

            <SlideFade in={true} offsetY={30}>
              <Text
                color="whiteAlpha.900"
                fontSize={{ base: 'lg', md: 'xl', lg: '2xl' }}
                maxW="3xl"
              >
                BeatFlow is your AI-powered music creation studio. Generate beats,
                compose melodies, and produce professional-quality tracks with the help
                of cutting-edge artificial intelligence.
              </Text>
            </SlideFade>

            <Stack
              direction={{ base: 'column', sm: 'row' }}
              spacing={{ base: 4, sm: 6 }}
              justify="center"
            >
              <Button
                size="lg"
                fontSize="xl"
                px={10}
                py={8}
                variant="neon"
                leftIcon={<FaPlay />}
                onClick={() => navigate('/studio')}
                _hover={{
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 30px var(--chakra-colors-brand-500)',
                }}
              >
                Start Creating
              </Button>
              <Button
                size="lg"
                fontSize="xl"
                px={10}
                py={8}
                variant="outline"
                onClick={() => navigate('/profile')}
                _hover={{
                  transform: 'scale(1.05)',
                }}
              >
                Learn More
              </Button>
            </Stack>
          </Stack>

          {/* Features Section */}
          <Box>
            <Heading
              fontSize={{ base: '3xl', md: '4xl' }}
              textAlign="center"
              mb={16}
              bgGradient="linear(to-r, brand.500, accent.500)"
              bgClip="text"
              textShadow="0 0 20px rgba(0, 255, 255, 0.5)"
            >
              Unleash Your Creativity
            </Heading>
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 4 }}
              spacing={{ base: 8, lg: 12 }}
              px={{ base: 4, md: 10 }}
            >
              {features.map((feature, index) => (
                <MotionBox
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Feature {...feature} />
                </MotionBox>
              ))}
            </SimpleGrid>
          </Box>

          {/* CTA Section */}
          <Box
            bg="dark.200"
            borderRadius="2xl"
            p={{ base: 8, md: 16 }}
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bg: 'brand.500',
              opacity: 0.1,
              filter: 'blur(100px)',
            }}
          >
            <Stack
              direction={{ base: 'column', md: 'row' }}
              spacing={{ base: 8, md: 10 }}
              align="center"
              justify="space-between"
            >
              <VStack align="start" spacing={4} maxW="2xl">
                <Heading
                  fontSize={{ base: '3xl', md: '4xl' }}
                  bgGradient="linear(to-r, brand.500, accent.500)"
                  bgClip="text"
                  textShadow="0 0 20px rgba(0, 255, 255, 0.5)"
                >
                  Ready to Make Your Next Hit?
                </Heading>
                <Text
                  color="whiteAlpha.900"
                  fontSize={{ base: 'md', md: 'lg' }}
                >
                  Join thousands of producers using BeatFlow to create
                  chart-topping tracks with the power of AI.
                </Text>
              </VStack>
              <Button
                size="lg"
                fontSize="xl"
                px={10}
                py={8}
                variant="neon"
                leftIcon={<FaPlay />}
                onClick={() => navigate('/studio')}
                _hover={{
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 30px var(--chakra-colors-brand-500)',
                }}
              >
                Get Started Now
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

export default Home 