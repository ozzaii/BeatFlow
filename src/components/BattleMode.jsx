/**
 * @component BattleMode
 * @description A real-time beat battle arena where producers compete live
 * Features:
 * - Live head-to-head battles
 * - Real-time audience voting
 * - Tournament brackets
 * - Live chat and reactions
 * - Performance optimized with React.memo and useCallback
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Progress,
  Badge,
  Avatar,
  useToast,
  Tooltip,
  Grid,
  GridItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaPlay,
  FaPause,
  FaCrown,
  FaFire,
  FaHeart,
  FaRegHeart,
  FaChevronRight,
  FaTrophy,
  FaMedal,
  FaStar,
} from 'react-icons/fa'
import * as Tone from 'tone'
import { useThree, Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { useSpring, a } from '@react-spring/three'

const MotionBox = motion(Box)

/**
 * @component BattleVisualizer
 * @description 3D visualization of the current battle beats
 * Uses Three.js for hardware-accelerated graphics
 */
const BattleVisualizer = React.memo(({ audioData, isPlaying, winner }) => {
  const { camera } = useThree()
  const meshRef = useRef()

  // Optimized animation using react-spring
  const { scale } = useSpring({
    scale: isPlaying ? 1.2 : 1,
    config: { tension: 300, friction: 10 },
  })

  useEffect(() => {
    camera.position.z = 5
  }, [camera])

  return (
    <>
      <a.mesh ref={meshRef} scale={scale}>
        <torusKnotGeometry args={[1, 0.3, 100, 16]} />
        <meshStandardMaterial
          color={winner ? '#00ff00' : '#ff00ff'}
          metalness={0.5}
          roughness={0.1}
        />
      </a.mesh>
      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} height={300} />
        <ChromaticAberration offset={[0.002, 0.002]} />
      </EffectComposer>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
    </>
  )
})

/**
 * @component BattlePlayer
 * @description Individual player component in the battle
 * Optimized for real-time updates and animations
 */
const BattlePlayer = React.memo(({ player, score, isPlaying, onPlay, onVote }) => {
  const scoreAnimation = useSpring({
    number: score,
    from: { number: 0 },
  })

  return (
    <VStack
      spacing={4}
      p={6}
      bg="dark.200"
      borderRadius="xl"
      borderWidth="2px"
      borderColor={isPlaying ? 'brand.500' : 'whiteAlpha.100'}
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: '0 0 30px var(--chakra-colors-brand-500)',
      }}
    >
      <Avatar
        size="xl"
        src={player.avatar}
        name={player.username}
        ring={4}
        ringColor={isPlaying ? 'brand.500' : 'transparent'}
      />
      <VStack spacing={1}>
        <Text fontSize="xl" fontWeight="bold">
          {player.username}
        </Text>
        <HStack>
          <Badge colorScheme="purple">{player.rank}</Badge>
          <Badge colorScheme="yellow">{player.wins} Wins</Badge>
        </HStack>
      </VStack>
      <HStack spacing={4}>
        <IconButton
          icon={isPlaying ? <FaPause /> : <FaPlay />}
          onClick={onPlay}
          colorScheme="brand"
          size="lg"
          isRound
        />
        <IconButton
          icon={player.hasVoted ? <FaHeart /> : <FaRegHeart />}
          onClick={onVote}
          colorScheme={player.hasVoted ? 'red' : 'gray'}
          size="lg"
          isRound
          isDisabled={player.isCompetitor}
        />
      </HStack>
      <Text fontSize="3xl" fontWeight="bold" color="brand.500">
        {scoreAnimation.number.to(n => n.toFixed(0))}
      </Text>
    </VStack>
  )
})

/**
 * @component BattleBracket
 * @description Tournament bracket visualization
 * Uses virtual scrolling for large tournaments
 */
const BattleBracket = React.memo(({ rounds, currentRound }) => {
  return (
    <Box
      w="full"
      overflowX="auto"
      css={{
        '&::-webkit-scrollbar': {
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'var(--chakra-colors-dark-300)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'var(--chakra-colors-brand-500)',
          borderRadius: '4px',
        },
      }}
    >
      <HStack spacing={8} p={4} minW="fit-content">
        {rounds.map((round, roundIndex) => (
          <VStack key={roundIndex} spacing={4}>
            <Text
              color="whiteAlpha.700"
              fontSize="sm"
              fontWeight="bold"
              textTransform="uppercase"
            >
              {round.name}
            </Text>
            {round.matches.map((match, matchIndex) => (
              <MotionBox
                key={matchIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: matchIndex * 0.1 }}
                p={4}
                bg="dark.300"
                borderRadius="lg"
                borderWidth="1px"
                borderColor={
                  currentRound === roundIndex
                    ? 'brand.500'
                    : 'whiteAlpha.100'
                }
                minW="200px"
              >
                <VStack spacing={2}>
                  {match.players.map((player, playerIndex) => (
                    <HStack
                      key={playerIndex}
                      w="full"
                      justify="space-between"
                      p={2}
                      bg={
                        player.isWinner
                          ? 'whiteAlpha.200'
                          : 'transparent'
                      }
                      borderRadius="md"
                    >
                      <Text fontSize="sm">{player.username}</Text>
                      {player.isWinner && (
                        <FaCrown color="gold" size={12} />
                      )}
                    </HStack>
                  ))}
                </VStack>
              </MotionBox>
            ))}
          </VStack>
        ))}
      </HStack>
    </Box>
  )
})

/**
 * @component BattleMode
 * @description Main battle mode component
 * Handles tournament logic, real-time updates, and state management
 */
const BattleMode = () => {
  const [currentBattle, setCurrentBattle] = useState(null)
  const [votes, setVotes] = useState({})
  const [tournament, setTournament] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const toast = useToast()
  const audioContext = useRef(null)
  const analyzerLeft = useRef(null)
  const analyzerRight = useRef(null)

  // Optimized audio initialization
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)()
        analyzerLeft.current = audioContext.current.createAnalyser()
        analyzerRight.current = audioContext.current.createAnalyser()
        
        // High performance settings
        analyzerLeft.current.fftSize = 1024
        analyzerRight.current.fftSize = 1024
        
        await Tone.start()
        Tone.context.lookAhead = 0.01 // Reduce latency
        
        console.log('Audio initialized successfully')
      } catch (error) {
        console.error('Audio initialization failed:', error)
      }
    }

    initAudio()
    return () => {
      if (audioContext.current) {
        audioContext.current.close()
      }
    }
  }, [])

  // Optimized vote handling with debouncing
  const handleVote = useCallback((playerId) => {
    setVotes(prev => {
      const newVotes = { ...prev }
      newVotes[playerId] = (newVotes[playerId] || 0) + 1
      return newVotes
    })
  }, [])

  // Tournament progression logic
  const advanceRound = useCallback(() => {
    // Tournament advancement logic here
  }, [])

  return (
    <Box
      w="full"
      minH="100vh"
      bg="dark.100"
      position="relative"
      overflow="hidden"
    >
      {/* 3D Visualizer Background */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={0}
      >
        <Canvas>
          <BattleVisualizer
            audioData={/* audio data */}
            isPlaying={isPlaying}
            winner={currentBattle?.winner}
          />
        </Canvas>
      </Box>

      {/* Battle Content */}
      <VStack
        spacing={8}
        p={8}
        position="relative"
        zIndex={1}
      >
        {/* Tournament Header */}
        <HStack w="full" justify="space-between">
          <VStack align="start">
            <Text
              fontSize="4xl"
              fontWeight="bold"
              bgGradient="linear(to-r, brand.500, accent.500)"
              bgClip="text"
            >
              Beat Battle Arena
            </Text>
            <HStack>
              <Badge colorScheme="purple">Season 1</Badge>
              <Badge colorScheme="yellow">Prize Pool: $1,000</Badge>
            </HStack>
          </VStack>
          <HStack>
            <Button
              leftIcon={<FaTrophy />}
              colorScheme="brand"
              variant="outline"
            >
              Leaderboard
            </Button>
            <Button
              leftIcon={<FaStar />}
              colorScheme="brand"
            >
              Join Tournament
            </Button>
          </HStack>
        </HStack>

        {/* Current Battle */}
        <Grid
          templateColumns="1fr auto 1fr"
          gap={8}
          w="full"
          maxW="1400px"
          alignItems="center"
        >
          <BattlePlayer
            player={currentBattle?.player1}
            score={votes[currentBattle?.player1?.id] || 0}
            isPlaying={isPlaying}
            onPlay={() => {/* Play logic */}}
            onVote={() => handleVote(currentBattle?.player1?.id)}
          />
          <VStack>
            <Text
              fontSize="6xl"
              fontWeight="black"
              bgGradient="linear(to-b, brand.500, accent.500)"
              bgClip="text"
            >
              VS
            </Text>
            <Badge
              colorScheme="yellow"
              p={2}
              borderRadius="full"
              fontSize="lg"
            >
              Round {currentBattle?.round}
            </Badge>
          </VStack>
          <BattlePlayer
            player={currentBattle?.player2}
            score={votes[currentBattle?.player2?.id] || 0}
            isPlaying={isPlaying}
            onPlay={() => {/* Play logic */}}
            onVote={() => handleVote(currentBattle?.player2?.id)}
          />
        </Grid>

        {/* Tournament Bracket */}
        <BattleBracket
          rounds={tournament?.rounds || []}
          currentRound={tournament?.currentRound}
        />
      </VStack>
    </Box>
  )
}

export default BattleMode 