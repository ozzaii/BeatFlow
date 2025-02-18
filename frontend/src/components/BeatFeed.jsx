import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  IconButton,
  Button,
  Select,
  useColorModeValue,
  Skeleton,
  SkeletonCircle,
  useToast,
  Avatar,
  Flex,
  Badge,
  Divider,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { FaHeart, FaComment, FaPlay, FaStop, FaUser } from 'react-icons/fa'
import { beatApi, userApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { Link as RouterLink } from 'react-router-dom'

const BeatFeed = () => {
  const [beats, setBeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [genre, setGenre] = useState('')
  const [playingBeatId, setPlayingBeatId] = useState(null)
  const { user } = useAuth()
  const toast = useToast()

  const bgColor = useColorModeValue('rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.95)')
  const textColor = '#00ffff'
  const borderGlow = `0 0 10px ${textColor}, 0 0 20px ${textColor}, 0 0 30px ${textColor}`

  useEffect(() => {
    loadBeats()
  }, [page, genre])

  const loadBeats = async () => {
    try {
      const response = await beatApi.getBeats(page, 10, genre)
      const { beats: newBeats, totalPages } = response.data
      
      setBeats(prev => page === 1 ? newBeats : [...prev, ...newBeats])
      setHasMore(page < totalPages)
      setLoading(false)
    } catch (error) {
      toast({
        title: 'Error loading beats',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      setLoading(false)
    }
  }

  const handleLike = async (beatId) => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to be logged in to like beats',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await beatApi.likeBeat(beatId)
      loadBeats()
    } catch (error) {
      toast({
        title: 'Error liking beat',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleFollow = async (userId) => {
    if (!user) {
      toast({
        title: 'Please login',
        description: 'You need to be logged in to follow users',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await userApi.followUser(userId)
      loadBeats()
    } catch (error) {
      toast({
        title: 'Error following user',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handlePlay = (beatId) => {
    setPlayingBeatId(playingBeatId === beatId ? null : beatId)
  }

  return (
    <VStack spacing={8} width="full" align="stretch">
      {/* Filters */}
      <HStack spacing={4}>
        <Select
          value={genre}
          onChange={(e) => {
            setGenre(e.target.value)
            setPage(1)
          }}
          color={textColor}
          borderColor={textColor}
          _hover={{ borderColor: textColor }}
          _focus={{ borderColor: textColor, boxShadow: borderGlow }}
          placeholder="All Genres"
          width="200px"
        >
          <option value="House">House</option>
          <option value="Techno">Techno</option>
          <option value="Trance">Trance</option>
          <option value="Dubstep">Dubstep</option>
          <option value="Other">Other</option>
        </Select>
      </HStack>

      {/* Beat List */}
      <VStack spacing={6}>
        {loading ? (
          // Loading skeletons
          Array(3).fill(0).map((_, i) => (
            <Box
              key={i}
              p={6}
              borderRadius="xl"
              bg={bgColor}
              width="full"
              border="1px solid rgba(0, 255, 255, 0.2)"
            >
              <HStack spacing={4}>
                <SkeletonCircle size="12" />
                <VStack align="start" flex={1}>
                  <Skeleton height="20px" width="200px" />
                  <Skeleton height="16px" width="150px" />
                </VStack>
              </HStack>
              <Skeleton height="100px" mt={4} />
            </Box>
          ))
        ) : (
          beats.map(beat => (
            <Box
              key={beat._id}
              p={6}
              borderRadius="xl"
              bg={bgColor}
              width="full"
              border="1px solid rgba(0, 255, 255, 0.2)"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 'xl',
                padding: '2px',
                background: 'linear-gradient(45deg, rgba(0,255,255,0.5), rgba(255,0,255,0.5))',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }}
            >
              {/* Creator Info */}
              <HStack spacing={4} mb={4}>
                <Avatar
                  src={beat.creator.profilePicture}
                  name={beat.creator.username}
                  size="md"
                  border="2px solid"
                  borderColor={textColor}
                />
                <VStack align="start" flex={1}>
                  <HStack>
                    <Text
                      color={textColor}
                      fontSize="lg"
                      fontWeight="bold"
                      as={RouterLink}
                      to={`/profile/${beat.creator._id}`}
                      _hover={{ textDecoration: 'underline' }}
                    >
                      {beat.creator.username}
                    </Text>
                    {user && user.id !== beat.creator._id && (
                      <Button
                        size="sm"
                        variant="outline"
                        color={textColor}
                        borderColor={textColor}
                        _hover={{
                          bg: 'rgba(0, 255, 255, 0.1)',
                          transform: 'scale(1.05)',
                        }}
                        onClick={() => handleFollow(beat.creator._id)}
                      >
                        Follow
                      </Button>
                    )}
                  </HStack>
                  <HStack>
                    <Badge
                      colorScheme="cyan"
                      bg="rgba(0, 255, 255, 0.2)"
                      color={textColor}
                    >
                      {beat.genre}
                    </Badge>
                    <Text color={textColor} fontSize="sm">
                      {new Date(beat.createdAt).toLocaleDateString()}
                    </Text>
                  </HStack>
                </VStack>
              </HStack>

              {/* Beat Title and Controls */}
              <HStack mb={4}>
                <Text
                  color={textColor}
                  fontSize="xl"
                  fontWeight="bold"
                  flex={1}
                  as={RouterLink}
                  to={`/beat/${beat._id}`}
                  _hover={{ textDecoration: 'underline' }}
                >
                  {beat.title}
                </Text>
                <IconButton
                  icon={playingBeatId === beat._id ? <FaStop /> : <FaPlay />}
                  onClick={() => handlePlay(beat._id)}
                  color={textColor}
                  bg="transparent"
                  border="2px solid"
                  borderColor={textColor}
                  boxShadow={borderGlow}
                  _hover={{
                    transform: 'scale(1.1)',
                    boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
                  }}
                />
              </HStack>

              {/* Beat Visualization */}
              <Box
                height="100px"
                bg="rgba(0, 0, 0, 0.3)"
                borderRadius="lg"
                mb={4}
                overflow="hidden"
                position="relative"
              >
                {/* TODO: Add beat visualization */}
              </Box>

              {/* Interactions */}
              <HStack spacing={4}>
                <HStack>
                  <IconButton
                    icon={<FaHeart />}
                    onClick={() => handleLike(beat._id)}
                    color={beat.likes.includes(user?.id) ? '#ff0000' : textColor}
                    bg="transparent"
                    border="2px solid"
                    borderColor={textColor}
                    boxShadow={borderGlow}
                    _hover={{
                      transform: 'scale(1.1)',
                      boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
                    }}
                  />
                  <Text color={textColor}>{beat.likes.length}</Text>
                </HStack>
                <HStack>
                  <IconButton
                    icon={<FaComment />}
                    as={RouterLink}
                    to={`/beat/${beat._id}`}
                    color={textColor}
                    bg="transparent"
                    border="2px solid"
                    borderColor={textColor}
                    boxShadow={borderGlow}
                    _hover={{
                      transform: 'scale(1.1)',
                      boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
                    }}
                  />
                  <Text color={textColor}>{beat.comments.length}</Text>
                </HStack>
              </HStack>

              {/* Preview Comments */}
              {beat.comments.length > 0 && (
                <VStack mt={4} align="stretch">
                  <Divider borderColor="rgba(0, 255, 255, 0.2)" />
                  {beat.comments.slice(0, 2).map((comment, index) => (
                    <HStack key={index} spacing={3} mt={2}>
                      <Avatar
                        src={comment.user.profilePicture}
                        name={comment.user.username}
                        size="sm"
                      />
                      <Box flex={1}>
                        <Text color={textColor} fontSize="sm" fontWeight="bold">
                          {comment.user.username}
                        </Text>
                        <Text color={textColor} fontSize="sm">
                          {comment.text}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                  {beat.comments.length > 2 && (
                    <Button
                      variant="link"
                      color={textColor}
                      size="sm"
                      as={RouterLink}
                      to={`/beat/${beat._id}`}
                    >
                      View all {beat.comments.length} comments
                    </Button>
                  )}
                </VStack>
              )}
            </Box>
          ))
        )}
      </VStack>

      {/* Load More */}
      {!loading && hasMore && (
        <Button
          onClick={() => setPage(prev => prev + 1)}
          color={textColor}
          bg="transparent"
          border="2px solid"
          borderColor={textColor}
          boxShadow={borderGlow}
          _hover={{
            transform: 'scale(1.05)',
            boxShadow: `0 0 20px ${textColor}, 0 0 40px ${textColor}`,
          }}
        >
          Load More
        </Button>
      )}
    </VStack>
  )
}

export default BeatFeed 