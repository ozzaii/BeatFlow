import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { FaHome, FaMusic } from 'react-icons/fa'

const NotFound = () => {
  const navigate = useNavigate()
  const bgColor = useColorModeValue('white', 'gray.800')

  return (
    <Box textAlign="center" py={20}>
      <VStack spacing={8}>
        {/* 404 Icon */}
        <Box
          fontSize="9xl"
          fontWeight="bold"
          bgGradient="linear(to-r, brand.400, brand.600)"
          bgClip="text"
        >
          404
        </Box>

        <Heading size="xl">Page Not Found</Heading>
        
        <Text fontSize="lg" color={useColorModeValue('gray.600', 'gray.300')}>
          Looks like this beat dropped too hard and broke the page!
        </Text>

        {/* Navigation Buttons */}
        <Box py={6}>
          <VStack spacing={4}>
            <Button
              leftIcon={<FaHome />}
              colorScheme="brand"
              size="lg"
              onClick={() => navigate('/')}
            >
              Return Home
            </Button>
            <Button
              leftIcon={<FaMusic />}
              variant="outline"
              size="lg"
              onClick={() => navigate('/studio')}
            >
              Go to Studio
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  )
}

export default NotFound
