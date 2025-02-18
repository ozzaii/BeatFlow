import {
  Box,
  Container,
  Stack,
  Heading,
  Text,
  Button,
  Image,
  VStack,
  HStack,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react'
import { FaEdit, FaCog } from 'react-icons/fa'

const Profile = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Container maxW="container.lg" py={8}>
      {/* Profile Header */}
      <Stack
        direction={{ base: 'column', md: 'row' }}
        spacing={8}
        align="center"
        bg={bgColor}
        p={6}
        borderRadius="lg"
        borderWidth={1}
        borderColor={borderColor}
        mb={8}
      >
        <Box position="relative">
          <Image
            borderRadius="full"
            boxSize="150px"
            src="https://via.placeholder.com/150"
            alt="Profile"
          />
          <Button
            size="sm"
            position="absolute"
            bottom={0}
            right={0}
            colorScheme="brand"
            leftIcon={<FaEdit />}
          >
            Edit
          </Button>
        </Box>
        <VStack align="start" flex={1} spacing={4}>
          <Heading size="lg">John Doe</Heading>
          <Text color={useColorModeValue('gray.600', 'gray.300')}>
            Music Producer | Beat Maker
          </Text>
          <HStack>
            <Badge colorScheme="brand">Pro Member</Badge>
            <Badge colorScheme="gray">100 Projects</Badge>
          </HStack>
          <Button leftIcon={<FaCog />} variant="outline">
            Settings
          </Button>
        </VStack>
      </Stack>

      {/* Tabs Section */}
      <Tabs colorScheme="brand" isLazy>
        <TabList>
          <Tab>Projects</Tab>
          <Tab>Stats</Tab>
          <Tab>Following</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {[1, 2, 3, 4].map((project) => (
                <Box
                  key={project}
                  p={5}
                  bg={bgColor}
                  borderRadius="lg"
                  borderWidth={1}
                  borderColor={borderColor}
                >
                  <VStack align="start" spacing={3}>
                    <Heading size="md">Project {project}</Heading>
                    <Text color={useColorModeValue('gray.600', 'gray.300')}>
                      Last modified: 2 days ago
                    </Text>
                    <HStack>
                      <Badge>4 Tracks</Badge>
                      <Badge>2 Effects</Badge>
                    </HStack>
                    <Button size="sm" colorScheme="brand">
                      Open in Studio
                    </Button>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </TabPanel>

          <TabPanel>
            <VStack
              spacing={4}
              p={5}
              bg={bgColor}
              borderRadius="lg"
              borderWidth={1}
              borderColor={borderColor}
            >
              <Heading size="md">Your Activity</Heading>
              <Text>Stats content coming soon...</Text>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack
              spacing={4}
              p={5}
              bg={bgColor}
              borderRadius="lg"
              borderWidth={1}
              borderColor={borderColor}
            >
              <Heading size="md">Following</Heading>
              <Text>Following content coming soon...</Text>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  )
}

export default Profile 