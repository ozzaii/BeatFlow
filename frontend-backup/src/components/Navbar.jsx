import {
  Box,
  Flex,
  Button,
  useColorMode,
  useColorModeValue,
  Stack,
  IconButton,
  Container,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FaMoon, FaSun, FaMusic, FaUser } from 'react-icons/fa'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'

const Navbar = () => {
  const { colorMode, toggleColorMode } = useColorMode()
  const { isOpen, onToggle } = useDisclosure()
  
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  const NavLink = ({ to, children }) => (
    <Link
      as={RouterLink}
      to={to}
      px={2}
      py={1}
      rounded="md"
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
    >
      {children}
    </Link>
  )

  return (
    <Box
      bg={bg}
      px={4}
      borderBottom={1}
      borderStyle="solid"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <IconButton
            size="md"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label="Open Menu"
            display={{ md: 'none' }}
            onClick={onToggle}
          />

          <Flex alignItems="center">
            <Link
              as={RouterLink}
              to="/"
              fontSize="2xl"
              fontWeight="bold"
              display="flex"
              alignItems="center"
              _hover={{ textDecoration: 'none' }}
            >
              <FaMusic />
              <Box ml={2}>BeatFlow</Box>
            </Link>
          </Flex>

          <Stack
            direction={{ base: 'column', md: 'row' }}
            display={{ base: isOpen ? 'flex' : 'none', md: 'flex' }}
            width={{ base: 'full', md: 'auto' }}
            alignItems="center"
            flexGrow={1}
            mt={{ base: 4, md: 0 }}
            spacing={4}
            position={{ base: 'absolute', md: 'static' }}
            top="60px"
            left={0}
            bg={{ base: bg, md: 'transparent' }}
            p={{ base: 4, md: 0 }}
          >
            <NavLink to="/">Home</NavLink>
            <NavLink to="/studio">Studio</NavLink>
          </Stack>

          <Flex alignItems="center">
            <Stack direction="row" spacing={3}>
              <IconButton
                icon={colorMode === 'light' ? <FaMoon /> : <FaSun />}
                onClick={toggleColorMode}
                variant="ghost"
                aria-label="Toggle color mode"
              />
              
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FaUser />}
                  variant="ghost"
                  aria-label="User menu"
                />
                <MenuList>
                  <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                  <MenuItem>Settings</MenuItem>
                  <MenuItem>Logout</MenuItem>
                </MenuList>
              </Menu>
            </Stack>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}

export default Navbar 