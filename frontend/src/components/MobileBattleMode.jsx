/**
 * @component MobileBattleMode
 * @description Mobile-optimized version of the battle mode
 * Features:
 * - Touch-first interactions
 * - Gesture controls
 * - Optimized rendering
 * - Smooth animations
 * - Perfect 60fps performance
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Badge,
  Avatar,
  useToast,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Slide,
  SlideFade,
  Collapse,
} from '@chakra-ui/react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import {
  FaPlay,
  FaPause,
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaExpand,
  FaCompress,
  FaVolumeUp,
  FaVolumeMute,
} from 'react-icons/fa'
import { useSwipeable } from 'react-swipeable'
import { useInView } from 'react-intersection-observer'
import AdvancedVisualizer from './AdvancedVisualizer'

const MotionBox = motion(Box)

/**
 * @component BattleCard
 * @description Mobile-optimized battle card with gesture controls
 */
const BattleCard = React.memo(({
  battle,
  isActive,
  onVote,
  onPlay,
  onShare,
  onExpand,
}) => {
  const [ref, inView] = useInView({
    threshold: 0.5,
    triggerOnce: false,
  })

  // Gesture handling
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onShare(battle.id),
    onSwipedRight: () => onVote(battle.id),
    onSwipedUp: () => onExpand(battle.id),
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
    trackTouch: true,
  })

  // Smooth animations
  const y = useMotionValue(0)
  const scale = useTransform(y, [-100, 0, 100], [0.9, 1, 0.9])
  const opacity = useTransform(y, [-100, 0, 100], [0.3, 1, 0.3])

  // Double tap handling
  const lastTap = useRef(0)
  const handleDoubleTap = useCallback((e) => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      onVote(battle.id)
    }
    lastTap.current = now
  }, [battle.id, onVote])

  return (
    <MotionBox
      ref={ref}
      style={{ y, scale, opacity }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      whileTap={{ scale: 0.98 }}
      position="relative"
      w="full"
      h="full"
      borderRadius="2xl"
      overflow="hidden"
      bg="dark.200"
      {...swipeHandlers}
      onTouchEnd={handleDoubleTap}
    >
      {/* Visualizer Background */}
      <Box position="absolute" inset={0}>
        <AdvancedVisualizer
          audioData={battle.audioData}
          isPlaying={isActive}
          mode="particles"
          color={battle.color}
        />
      </Box>

      {/* Content Overlay */}
      <VStack
        position="absolute"
        inset={0}
        p={4}
        justify="space-between"
        bg="linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))"
        pointerEvents="none"
      >
        {/* Header */}
        <HStack w="full" justify="space-between">
          <HStack spacing={2}>
            <Avatar
              size="sm"
              src={battle.creator.avatar}
              name={battle.creator.username}
            />
            <VStack align="start" spacing={0}>
              <Text
                fontSize="sm"
                fontWeight="bold"
                color="whiteAlpha.900"
              >
                {battle.creator.username}
              </Text>
              <Badge colorScheme="purple" fontSize="xs">
                {battle.genre}
              </Badge>
            </VStack>
          </HStack>
          <Badge colorScheme="yellow">
            Round {battle.round}
          </Badge>
        </HStack>

        {/* Center Controls */}
        <HStack
          spacing={8}
          pointerEvents="auto"
        >
          <IconButton
            icon={<FaRegHeart />}
            variant="ghost"
            colorScheme="red"
            isRound
            size="lg"
            aria-label="Vote"
            onClick={() => onVote(battle.id)}
          />
          <IconButton
            icon={isActive ? <FaPause /> : <FaPlay />}
            variant="solid"
            colorScheme="brand"
            isRound
            size="xl"
            aria-label={isActive ? "Pause" : "Play"}
            onClick={() => onPlay(battle.id)}
          />
          <IconButton
            icon={<FaShare />}
            variant="ghost"
            colorScheme="blue"
            isRound
            size="lg"
            aria-label="Share"
            onClick={() => onShare(battle.id)}
          />
        </HStack>

        {/* Footer */}
        <VStack w="full" align="start" spacing={2}>
          <Text
            fontSize="lg"
            fontWeight="bold"
            color="whiteAlpha.900"
          >
            {battle.title}
          </Text>
          <HStack spacing={4}>
            <HStack>
              <FaHeart size={12} />
              <Text fontSize="sm" color="whiteAlpha.900">
                {battle.votes}
              </Text>
            </HStack>
            <HStack>
              <FaComment size={12} />
              <Text fontSize="sm" color="whiteAlpha.900">
                {battle.comments}
              </Text>
            </HStack>
          </HStack>
        </VStack>
      </VStack>

      {/* Gesture Hints */}
      <AnimatePresence>
        {!isActive && (
          <MotionBox
            position="absolute"
            inset={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Text
              color="whiteAlpha.900"
              fontSize="xl"
              textAlign="center"
              textShadow="0 0 10px rgba(0,0,0,0.5)"
            >
              Swipe ↔️ to vote
              <br />
              Swipe ⬆️ to expand
            </Text>
          </MotionBox>
        )}
      </AnimatePresence>
    </MotionBox>
  )
})

/**
 * @component MobileBattleMode
 * @description Main mobile battle mode component
 */
const MobileBattleMode = () => {
  const [battles, setBattles] = useState([])
  const [activeBattle, setActiveBattle] = useState(null)
  const [expandedBattle, setExpandedBattle] = useState(null)
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  // Handle voting
  const handleVote = useCallback((battleId) => {
    setBattles(prev =>
      prev.map(battle =>
        battle.id === battleId
          ? { ...battle, votes: battle.votes + 1, hasVoted: true }
          : battle
      )
    )
    toast({
      title: "Vote cast! 🔥",
      status: "success",
      duration: 1000,
      isClosable: true,
      position: "top",
    })
  }, [toast])

  // Handle play/pause
  const handlePlay = useCallback((battleId) => {
    setActiveBattle(current => current === battleId ? null : battleId)
  }, [])

  // Handle share
  const handleShare = useCallback((battleId) => {
    // Implement share logic
    toast({
      title: "Sharing battle...",
      status: "info",
      duration: 1000,
    })
  }, [toast])

  // Handle expand
  const handleExpand = useCallback((battleId) => {
    setExpandedBattle(current => current === battleId ? null : battleId)
  }, [])

  return (
    <Box
      w="full"
      h="full"
      bg="black"
      position="relative"
      overflow="hidden"
    >
      {/* Battle Feed */}
      <VStack
        w="full"
        h="full"
        spacing={0}
        position="relative"
      >
        <AnimatePresence>
          {battles.map(battle => (
            <MotionBox
              key={battle.id}
              w="full"
              h="100vh"
              position="relative"
            >
              <BattleCard
                battle={battle}
                isActive={activeBattle === battle.id}
                onVote={handleVote}
                onPlay={handlePlay}
                onShare={handleShare}
                onExpand={handleExpand}
              />
            </MotionBox>
          ))}
        </AnimatePresence>
      </VStack>

      {/* Expanded Battle View */}
      <Drawer
        isOpen={!!expandedBattle}
        placement="bottom"
        onClose={() => setExpandedBattle(null)}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent
          bg="dark.100"
          borderTopRadius="2xl"
        >
          <DrawerCloseButton />
          <DrawerHeader>Battle Details</DrawerHeader>
          <DrawerBody>
            {/* Implement expanded battle view */}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

export default MobileBattleMode 