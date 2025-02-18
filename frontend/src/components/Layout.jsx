import { Box, Container, Flex, useColorMode } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

const Layout = () => {
  const { colorMode } = useColorMode()

  return (
    <Flex direction="column" minH="100vh" bg={colorMode === 'dark' ? 'gray.900' : 'gray.50'}>
      <Navbar />
      <Container maxW="container.xl" flex="1" py={8}>
        <Box
          borderRadius="xl"
          bg={colorMode === 'dark' ? 'gray.800' : 'white'}
          p={6}
          shadow="xl"
          minH="calc(100vh - 200px)"
        >
          <Outlet />
        </Box>
      </Container>
      <Footer />
    </Flex>
  )
}

export default Layout 