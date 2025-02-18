import { useState, useEffect } from 'react'
import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useColorModeValue,
  Badge,
  Avatar,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import { PlayIcon, LikeIcon, ShareIcon, MoreVerticalIcon } from '../components/icons'
import { supabase } from '../lib/supabaseClient'

function BeatCard({ beat }) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box
      bg={cardBg}
      p={4}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      shadow="sm"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between">
          <HStack>
            <Avatar size="sm" src={beat.author.avatar_url} name={beat.author.username} />
            <Text fontWeight="bold">{beat.author.username}</Text>
          </HStack>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<MoreVerticalIcon />}
              variant="ghost"
              size="sm"
            />
            <MenuList>
              <MenuItem>Edit</MenuItem>
              <MenuItem>Delete</MenuItem>
              <MenuItem>Share</MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        <Box
          h="120px"
          bg="gray.900"
          borderRadius="md"
          position="relative"
          overflow="hidden"
        >
          {/* Waveform visualization would go here */}
          <IconButton
            icon={<PlayIcon />}
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            colorScheme="brand"
            size="lg"
            isRound
          />
        </Box>

        <VStack align="stretch" spacing={2}>
          <Heading size="md">{beat.title}</Heading>
          <Text noOfLines={2} color="gray.500">
            {beat.description}
          </Text>
        </VStack>

        <HStack justify="space-between">
          <HStack>
            <Badge colorScheme="brand">{beat.bpm} BPM</Badge>
            <Badge>{beat.key}</Badge>
          </HStack>
          <HStack>
            <IconButton
              icon={<LikeIcon />}
              variant="ghost"
              size="sm"
              aria-label="Like"
            />
            <IconButton
              icon={<ShareIcon />}
              variant="ghost"
              size="sm"
              aria-label="Share"
            />
          </HStack>
        </HStack>
      </VStack>
    </Box>
  )
}

function Beats() {
  const [beats, setBeats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBeats()
  }, [])

  async function fetchBeats() {
    try {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          *,
          author:profiles(username, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBeats(data)
    } catch (error) {
      console.error('Error fetching beats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="xl">Your Beats</Heading>
          <Button colorScheme="brand">New Beat</Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {beats.map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  )
}

export default Beats 