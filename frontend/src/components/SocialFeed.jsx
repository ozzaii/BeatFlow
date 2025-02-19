import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Avatar,
  Button,
  useToast,
  Flex,
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Textarea,
  Badge,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaHeart,
  FaComment,
  FaShare,
  FaEllipsisV,
  FaPlay,
  FaPause,
  FaRedo,
  FaStar,
  FaFire,
  FaTrophy,
  FaMusic,
} from 'react-icons/fa'
import * as Tone from 'tone'

const MotionBox = motion(Box)

const BeatCard = ({
  beat,
  isPlaying,
  onPlay,
  onPause,
  onLike,
  onComment,
  onShare,
  onRemix,
  isActive,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressInterval = useRef(null)

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => (prev + 1) % 100)
      }, 100)
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
      setProgress(0)
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [isPlaying])

  return (
    <MotionBox
      w="full"
      h="500px"
      bg="dark.200"
      borderRadius="2xl"
      overflow="hidden"
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Visualizer Background */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="black"
        opacity={0.7}
      >
        <canvas
          ref={beat.visualizerRef}
          style={{
            width: '100%',
            height: '100%',
            opacity: isPlaying ? 1 : 0.3,
            transition: 'opacity 0.3s',
          }}
        />
      </Box>

      {/* Content Overlay */}
      <VStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        p={6}
        justify="space-between"
        bg="linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))"
      >
        {/* Top Section */}
        <HStack w="full" justify="space-between">
          <HStack>
            <Avatar
              src={beat.creator.avatar}
              size="sm"
              ring={2}
              ringColor="brand.500"
            />
            <VStack align="start" spacing={0}>
              <Text
                color="whiteAlpha.900"
                fontWeight="bold"
                fontSize="sm"
              >
                {beat.creator.username}
              </Text>
              <HStack spacing={1}>
                <Badge colorScheme="purple">{beat.genre}</Badge>
                <Badge colorScheme="blue">{beat.bpm} BPM</Badge>
              </HStack>
            </VStack>
          </HStack>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FaEllipsisV />}
              variant="ghost"
              color="whiteAlpha.900"
              size="sm"
            />
            <MenuList bg="dark.300" borderColor="whiteAlpha.200">
              <MenuItem icon={<FaShare />}>Share</MenuItem>
              <MenuItem icon={<FaRedo />}>Remix</MenuItem>
              <MenuItem icon={<FaStar />}>Add to Favorites</MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        {/* Center Play Button */}
        <IconButton
          icon={isPlaying ? <FaPause /> : <FaPlay />}
          onClick={isPlaying ? onPause : onPlay}
          isRound
          size="lg"
          colorScheme="brand"
          opacity={isHovered || isPlaying ? 1 : 0.5}
          transform={isHovered || isPlaying ? 'scale(1.2)' : 'scale(1)'}
          transition="all 0.3s"
          _hover={{
            transform: 'scale(1.3)',
          }}
        />

        {/* Bottom Section */}
        <VStack w="full" spacing={4}>
          {/* Title and Description */}
          <VStack align="start" w="full" spacing={1}>
            <Text
              color="whiteAlpha.900"
              fontSize="xl"
              fontWeight="bold"
            >
              {beat.title}
            </Text>
            <Text
              color="whiteAlpha.700"
              fontSize="sm"
              noOfLines={2}
            >
              {beat.description}
            </Text>
          </VStack>

          {/* Stats and Actions */}
          <HStack w="full" justify="space-between">
            <HStack spacing={6}>
              <VStack spacing={1}>
                <IconButton
                  icon={<FaHeart />}
                  variant="ghost"
                  color={beat.isLiked ? "red.500" : "whiteAlpha.900"}
                  onClick={onLike}
                  size="sm"
                />
                <Text color="whiteAlpha.900" fontSize="xs">
                  {beat.likes}
                </Text>
              </VStack>
              <VStack spacing={1}>
                <IconButton
                  icon={<FaComment />}
                  variant="ghost"
                  color="whiteAlpha.900"
                  onClick={onComment}
                  size="sm"
                />
                <Text color="whiteAlpha.900" fontSize="xs">
                  {beat.comments}
                </Text>
              </VStack>
              <VStack spacing={1}>
                <IconButton
                  icon={<FaRedo />}
                  variant="ghost"
                  color="whiteAlpha.900"
                  onClick={onRemix}
                  size="sm"
                />
                <Text color="whiteAlpha.900" fontSize="xs">
                  {beat.remixes}
                </Text>
              </VStack>
            </HStack>
            <VStack spacing={1}>
              <HStack>
                <FaFire />
                <Text color="whiteAlpha.900" fontSize="sm">
                  {beat.heat} Heat
                </Text>
              </HStack>
              {beat.ranking && (
                <Badge colorScheme="orange">
                  #{beat.ranking} Trending
                </Badge>
              )}
            </VStack>
          </HStack>
        </VStack>
      </VStack>

      {/* Progress Bar */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        h="2px"
        bg="whiteAlpha.200"
      >
        <Box
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          width={`${progress}%`}
          bg="brand.500"
          transition="width 0.1s linear"
        />
      </Box>
    </MotionBox>
  )
}

const SocialFeed = () => {
  const [beats, setBeats] = useState([])
  const [currentBeat, setCurrentBeat] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [comment, setComment] = useState('')

  // Simulated beats data - replace with real API calls
  useEffect(() => {
    setBeats([
      {
        id: 1,
        title: "Summer Vibes",
        description: "A chill beat for those sunny days 🌞",
        creator: {
          username: "beatmaster",
          avatar: "https://bit.ly/dan-abramov",
        },
        genre: "Lo-Fi",
        bpm: 90,
        likes: 1234,
        comments: 56,
        remixes: 23,
        heat: 98,
        ranking: 3,
        isLiked: false,
      },
      // Add more beats...
    ])
  }, [])

  const handlePlay = (beatId) => {
    setCurrentBeat(beatId)
    setIsPlaying(true)
    // Implement actual playback logic
  }

  const handlePause = () => {
    setIsPlaying(false)
    setCurrentBeat(null)
    // Implement pause logic
  }

  const handleLike = (beatId) => {
    setBeats(beats.map(beat => 
      beat.id === beatId
        ? { ...beat, isLiked: !beat.isLiked, likes: beat.isLiked ? beat.likes - 1 : beat.likes + 1 }
        : beat
    ))
    // Implement API call
  }

  const handleComment = (beatId) => {
    onOpen()
    // Implement comment logic
  }

  const handleShare = (beatId) => {
    // Implement share logic
    toast({
      title: "Beat shared!",
      status: "success",
      duration: 2000,
    })
  }

  const handleRemix = (beatId) => {
    // Implement remix logic
    toast({
      title: "Creating remix...",
      status: "info",
      duration: 2000,
    })
  }

  return (
    <VStack spacing={8} w="full" p={4}>
      <AnimatePresence>
        {beats.map(beat => (
          <BeatCard
            key={beat.id}
            beat={beat}
            isPlaying={currentBeat === beat.id && isPlaying}
            onPlay={() => handlePlay(beat.id)}
            onPause={handlePause}
            onLike={() => handleLike(beat.id)}
            onComment={() => handleComment(beat.id)}
            onShare={() => handleShare(beat.id)}
            onRemix={() => handleRemix(beat.id)}
            isActive={currentBeat === beat.id}
          />
        ))}
      </AnimatePresence>

      {/* Comment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="dark.300" borderColor="whiteAlpha.200">
          <ModalHeader>Add Comment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Drop your thoughts..."
              bg="dark.200"
              borderColor="whiteAlpha.200"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={() => {
              // Implement comment submission
              onClose()
              setComment('')
              toast({
                title: "Comment posted!",
                status: "success",
                duration: 2000,
              })
            }}>
              Post
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export default SocialFeed 