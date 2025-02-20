import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Avatar,
  Input,
  Button,
  useToast,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Badge,
  Tooltip,
  Flex,
  Spacer,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  FaUsers,
  FaComments,
  FaCopy,
  FaShare,
  FaSave,
  FaVideo,
  FaMicrophone,
  FaUserPlus,
  FaLock,
  FaUnlock,
} from 'react-icons/fa'
import collaborationService from '../services/CollaborationService'

const MotionBox = motion(Box)

const CollaboratorsList = ({ collaborators }) => (
  <VStack align="stretch" spacing={2} w="full">
    {collaborators.map((collaborator) => (
      <HStack
        key={collaborator.userId}
        p={2}
        bg="whiteAlpha.100"
        borderRadius="md"
        spacing={3}
      >
        <Avatar size="sm" name={collaborator.username} src={collaborator.avatar} />
        <VStack align="start" spacing={0} flex={1}>
          <Text fontSize="sm" fontWeight="bold">
            {collaborator.username}
          </Text>
          <Badge
            colorScheme={collaborator.isActive ? 'green' : 'gray'}
            fontSize="xs"
          >
            {collaborator.isActive ? 'Active' : 'Idle'}
          </Badge>
        </VStack>
        {collaborator.isOwner && (
          <Tooltip label="Room Owner">
            <FaLock size={14} />
          </Tooltip>
        )}
      </HStack>
    ))}
  </VStack>
)

const ChatMessage = ({ message, isOwn }) => (
  <HStack
    alignSelf={isOwn ? 'flex-end' : 'flex-start'}
    maxW="80%"
    spacing={2}
  >
    {!isOwn && (
      <Avatar size="xs" name={message.username} src={message.avatar} />
    )}
    <Box
      bg={isOwn ? 'brand.500' : 'whiteAlpha.200'}
      p={3}
      borderRadius="lg"
      position="relative"
    >
      {!isOwn && (
        <Text fontSize="xs" color="whiteAlpha.700" mb={1}>
          {message.username}
        </Text>
      )}
      <Text fontSize="sm">{message.content}</Text>
      <Text
        fontSize="xs"
        color="whiteAlpha.600"
        textAlign="right"
        mt={1}
      >
        {new Date(message.timestamp).toLocaleTimeString()}
      </Text>
    </Box>
  </HStack>
)

const CollaborationRoom = ({ roomId, userId, username }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [collaborators, setCollaborators] = useState([])
  const [isPrivate, setIsPrivate] = useState(false)
  const toast = useToast()
  const chatEndRef = useRef(null)
  const {
    isOpen: isChatOpen,
    onOpen: onChatOpen,
    onClose: onChatClose,
  } = useDisclosure()
  const {
    isOpen: isCollaboratorsOpen,
    onOpen: onCollaboratorsOpen,
    onClose: onCollaboratorsClose,
  } = useDisclosure()

  useEffect(() => {
    // Connect to collaboration service
    collaborationService.connect(userId, username)
    
    // Join room
    if (roomId) {
      collaborationService.joinRoom(roomId)
    } else {
      const newRoomId = collaborationService.createRoom()
      // Update URL with room ID
      window.history.pushState({}, '', `/room/${newRoomId}`)
    }

    // Set up event handlers
    collaborationService.setEventHandlers({
      onCollaboratorJoin: handleCollaboratorJoin,
      onCollaboratorLeave: handleCollaboratorLeave,
      onChatMessage: handleChatMessage,
      onPatternUpdate: handlePatternUpdate,
      onMixerUpdate: handleMixerUpdate,
    })

    return () => {
      collaborationService.disconnect()
    }
  }, [roomId, userId, username])

  useEffect(() => {
    // Scroll to bottom of chat when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleCollaboratorJoin = (collaborator) => {
    setCollaborators(prev => [...prev, collaborator])
    toast({
      title: `${collaborator.username} joined the room`,
      status: 'info',
      duration: 3000,
    })
  }

  const handleCollaboratorLeave = (collaborator) => {
    setCollaborators(prev =>
      prev.filter(c => c.userId !== collaborator.userId)
    )
    toast({
      title: `${collaborator.username} left the room`,
      status: 'info',
      duration: 3000,
    })
  }

  const handleChatMessage = (message) => {
    setMessages(prev => [...prev, message])
  }

  const handlePatternUpdate = (update) => {
    // Handle pattern updates from collaborators
    console.log('Pattern update:', update)
  }

  const handleMixerUpdate = (update) => {
    // Handle mixer updates from collaborators
    console.log('Mixer update:', update)
  }

  const sendMessage = () => {
    if (newMessage.trim()) {
      collaborationService.sendChatMessage(newMessage)
      setNewMessage('')
    }
  }

  const copyRoomLink = () => {
    const link = window.location.href
    navigator.clipboard.writeText(link)
    toast({
      title: 'Room link copied to clipboard',
      status: 'success',
      duration: 2000,
    })
  }

  const togglePrivacy = () => {
    setIsPrivate(!isPrivate)
    toast({
      title: `Room is now ${!isPrivate ? 'private' : 'public'}`,
      status: 'info',
      duration: 2000,
    })
  }

  return (
    <Box
      position="fixed"
      bottom={4}
      right={4}
      zIndex={100}
    >
      {/* Room Controls */}
      <HStack spacing={2} mb={4}>
        <Tooltip label="Collaborators">
          <IconButton
            icon={<FaUsers />}
            onClick={onCollaboratorsOpen}
            colorScheme="brand"
            variant="solid"
            size="lg"
            isRound
          />
        </Tooltip>
        <Tooltip label="Chat">
          <IconButton
            icon={<FaComments />}
            onClick={onChatOpen}
            colorScheme="brand"
            variant="solid"
            size="lg"
            isRound
          />
        </Tooltip>
        <Tooltip label="Copy Room Link">
          <IconButton
            icon={<FaCopy />}
            onClick={copyRoomLink}
            colorScheme="brand"
            variant="solid"
            size="lg"
            isRound
          />
        </Tooltip>
        <Tooltip label={isPrivate ? 'Make Public' : 'Make Private'}>
          <IconButton
            icon={isPrivate ? <FaLock /> : <FaUnlock />}
            onClick={togglePrivacy}
            colorScheme="brand"
            variant="solid"
            size="lg"
            isRound
          />
        </Tooltip>
      </HStack>

      {/* Collaborators Drawer */}
      <Drawer
        isOpen={isCollaboratorsOpen}
        placement="right"
        onClose={onCollaboratorsClose}
      >
        <DrawerOverlay />
        <DrawerContent bg="dark.300">
          <DrawerCloseButton />
          <DrawerHeader>
            <HStack>
              <FaUsers />
              <Text>Collaborators</Text>
              <Badge colorScheme="brand" ml={2}>
                {collaborators.length}
              </Badge>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4}>
              <Button
                leftIcon={<FaUserPlus />}
                colorScheme="brand"
                variant="outline"
                w="full"
                onClick={copyRoomLink}
              >
                Invite Collaborators
              </Button>
              <Divider />
              <CollaboratorsList collaborators={collaborators} />
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Chat Drawer */}
      <Drawer
        isOpen={isChatOpen}
        placement="right"
        onClose={onChatClose}
      >
        <DrawerOverlay />
        <DrawerContent bg="dark.300">
          <DrawerCloseButton />
          <DrawerHeader>
            <HStack>
              <FaComments />
              <Text>Chat</Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody>
            <VStack h="full" spacing={4}>
              <VStack
                flex={1}
                w="full"
                overflowY="auto"
                spacing={4}
                p={2}
              >
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isOwn={message.userId === userId}
                  />
                ))}
                <div ref={chatEndRef} />
              </VStack>
              <HStack w="full" spacing={2}>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  bg="dark.200"
                  borderColor="whiteAlpha.200"
                />
                <IconButton
                  icon={<FaShare />}
                  onClick={sendMessage}
                  colorScheme="brand"
                  isDisabled={!newMessage.trim()}
                />
              </HStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

export default CollaborationRoom 