import {
  Box,
  Container,
  Stack,
  Text,
  useColorModeValue,
  IconButton,
  Link,
} from '@chakra-ui/react'
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa'

const Footer = () => {
  return (
    <Box
      bg={useColorModeValue('white', 'gray.800')}
      borderTopWidth={1}
      borderStyle="solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Container
        as={Stack}
        maxW="container.xl"
        py={4}
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        justify={{ base: 'center', md: 'space-between' }}
        align={{ base: 'center', md: 'center' }}
      >
        <Text>© 2024 BeatFlow. All rights reserved</Text>
        <Stack direction="row" spacing={6}>
          <IconButton
            as={Link}
            href="https://github.com/yourusername/BeatFlow"
            aria-label="GitHub"
            icon={<FaGithub />}
            size="md"
            variant="ghost"
            isExternal
          />
          <IconButton
            as={Link}
            href="https://twitter.com"
            aria-label="Twitter"
            icon={<FaTwitter />}
            size="md"
            variant="ghost"
            isExternal
          />
          <IconButton
            as={Link}
            href="https://linkedin.com"
            aria-label="LinkedIn"
            icon={<FaLinkedin />}
            size="md"
            variant="ghost"
            isExternal
          />
        </Stack>
      </Container>
    </Box>
  )
}

export default Footer 