import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Button,
  Input,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Badge,
} from '@chakra-ui/react'
import {
  FaSave,
  FaFolder,
  FaTrash,
  FaEdit,
  FaDownload,
  FaUpload,
  FaEllipsisV,
} from 'react-icons/fa'
import { motion } from 'framer-motion'
import {
  savePattern,
  loadPatterns,
  updatePattern,
  deletePattern,
  exportPattern,
  importPattern,
} from '../services/patternStorage'

const MotionBox = motion(Box)

const PatternCard = ({ pattern, onLoad, onDelete, onUpdate }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [name, setName] = useState(pattern.name)
  const toast = useToast()

  const handleUpdate = () => {
    const updated = updatePattern(pattern.id, { name })
    if (updated) {
      onUpdate(updated)
      onClose()
      toast({
        title: 'Pattern updated',
        status: 'success',
        duration: 2000,
      })
    }
  }

  const handleExport = () => {
    if (exportPattern(pattern)) {
      toast({
        title: 'Pattern exported',
        status: 'success',
        duration: 2000,
      })
    }
  }

  return (
    <MotionBox
      p={4}
      bg="dark.200"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      _hover={{
        borderColor: 'brand.500',
        boxShadow: '0 0 20px var(--chakra-colors-brand-500)',
      }}
      transition="all 0.2s"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" fontSize="lg">
              {pattern.name}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.600">
              {new Date(pattern.modified).toLocaleDateString()}
            </Text>
          </VStack>
          <Badge colorScheme="purple">{pattern.kit}</Badge>
        </HStack>

        <HStack spacing={2}>
          <Button
            size="sm"
            leftIcon={<FaFolder />}
            onClick={() => onLoad(pattern)}
            flex={1}
            variant="ghost"
            _hover={{ bg: 'brand.500', color: 'white' }}
          >
            Load
          </Button>
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FaEllipsisV />}
              variant="ghost"
              size="sm"
            />
            <MenuList bg="dark.300" borderColor="whiteAlpha.200">
              <MenuItem
                icon={<FaEdit />}
                onClick={onOpen}
                command="⌘E"
              >
                Rename
              </MenuItem>
              <MenuItem
                icon={<FaDownload />}
                onClick={handleExport}
                command="⌘D"
              >
                Export
              </MenuItem>
              <Divider />
              <MenuItem
                icon={<FaTrash />}
                onClick={() => onDelete(pattern.id)}
                color="red.400"
                command="⌘⌫"
              >
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </VStack>

      {/* Rename Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="dark.300" borderColor="whiteAlpha.200">
          <ModalHeader>Rename Pattern</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pattern name"
              bg="dark.200"
              borderColor="whiteAlpha.200"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleUpdate}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MotionBox>
  )
}

const PatternBrowser = ({ currentPattern, currentKit, onPatternLoad }) => {
  const [patterns, setPatterns] = useState([])
  const [saveName, setSaveName] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  // Load patterns on mount
  useEffect(() => {
    setPatterns(loadPatterns())
  }, [])

  // Save current pattern
  const handleSave = useCallback(() => {
    const saved = savePattern(currentPattern, saveName, currentKit)
    if (saved) {
      setPatterns(loadPatterns())
      onClose()
      setSaveName('')
      toast({
        title: 'Pattern saved',
        status: 'success',
        duration: 2000,
      })
    }
  }, [currentPattern, saveName, currentKit, onClose, toast])

  // Delete pattern
  const handleDelete = useCallback((id) => {
    if (deletePattern(id)) {
      setPatterns(patterns.filter(p => p.id !== id))
      toast({
        title: 'Pattern deleted',
        status: 'success',
        duration: 2000,
      })
    }
  }, [patterns, toast])

  // Update pattern
  const handleUpdate = useCallback((updated) => {
    setPatterns(patterns.map(p => 
      p.id === updated.id ? updated : p
    ))
  }, [patterns])

  // Import pattern
  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const imported = await importPattern(file)
    if (imported) {
      const saved = savePattern(
        imported.pattern,
        `${imported.name} (imported)`,
        imported.kit
      )
      if (saved) {
        setPatterns(loadPatterns())
        toast({
          title: 'Pattern imported',
          status: 'success',
          duration: 2000,
        })
      }
    }
  }, [toast])

  return (
    <VStack spacing={4} w="full">
      {/* Actions */}
      <HStack spacing={4} w="full">
        <Button
          leftIcon={<FaSave />}
          onClick={onOpen}
          colorScheme="brand"
          flex={1}
        >
          Save Pattern
        </Button>
        <IconButton
          icon={<FaUpload />}
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            input.onchange = handleImport
            input.click()
          }}
          variant="ghost"
        />
      </HStack>

      {/* Pattern Grid */}
      <Box
        w="full"
        maxH="500px"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
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
        <VStack spacing={4} p={2}>
          {patterns.map(pattern => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              onLoad={onPatternLoad}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </VStack>
      </Box>

      {/* Save Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="dark.300" borderColor="whiteAlpha.200">
          <ModalHeader>Save Pattern</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Pattern name"
              bg="dark.200"
              borderColor="whiteAlpha.200"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" onClick={handleSave}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export default PatternBrowser 