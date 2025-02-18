import {
  Box,
  Heading,
  Container,
  Text,
  Button,
  Stack,
  Icon,
  useColorModeValue,
  createIcon,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()

  return (
    <Container maxW="3xl">
      <Stack
        as={Box}
        textAlign="center"
        spacing={{ base: 8, md: 14 }}
        py={{ base: 20, md: 36 }}
      >
        <Heading
          fontWeight={600}
          fontSize={{ base: '2xl', sm: '4xl', md: '6xl' }}
          lineHeight="110%"
        >
          Create music with <br />
          <Text as="span" color="brand.400">
            artificial intelligence
          </Text>
        </Heading>
        <Text color={useColorModeValue('gray.500', 'gray.300')} fontSize="xl">
          BeatFlow is your AI-powered music creation studio. Generate beats,
          compose melodies, and produce professional-quality tracks with the help
          of cutting-edge artificial intelligence.
        </Text>
        <Stack
          direction={{ base: 'column', sm: 'row' }}
          spacing={3}
          align="center"
          alignSelf="center"
          position="relative"
        >
          <Button
            colorScheme="brand"
            bg="brand.400"
            rounded="full"
            px={6}
            _hover={{
              bg: 'brand.500',
            }}
            onClick={() => navigate('/studio')}
          >
            Get Started
          </Button>
          <Button
            variant="link"
            colorScheme="blue"
            size="sm"
            onClick={() => navigate('/profile')}
          >
            Learn more
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}

export default Home 