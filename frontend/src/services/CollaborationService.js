import { io } from 'socket.io-client'
import { nanoid } from 'nanoid'

class CollaborationService {
  constructor() {
    this.socket = null
    this.roomId = null
    this.collaborators = new Map()
    this.onCollaboratorJoin = null
    this.onCollaboratorLeave = null
    this.onPatternUpdate = null
    this.onMixerUpdate = null
    this.onChatMessage = null
  }

  connect(userId, username) {
    this.socket = io(process.env.REACT_APP_WEBSOCKET_URL, {
      auth: {
        userId,
        username,
      },
    })

    this.setupEventListeners()
  }

  setupEventListeners() {
    this.socket.on('collaborator:join', (collaborator) => {
      this.collaborators.set(collaborator.userId, collaborator)
      if (this.onCollaboratorJoin) {
        this.onCollaboratorJoin(collaborator)
      }
    })

    this.socket.on('collaborator:leave', (userId) => {
      const collaborator = this.collaborators.get(userId)
      this.collaborators.delete(userId)
      if (this.onCollaboratorLeave && collaborator) {
        this.onCollaboratorLeave(collaborator)
      }
    })

    this.socket.on('pattern:update', (update) => {
      if (this.onPatternUpdate) {
        this.onPatternUpdate(update)
      }
    })

    this.socket.on('mixer:update', (update) => {
      if (this.onMixerUpdate) {
        this.onMixerUpdate(update)
      }
    })

    this.socket.on('chat:message', (message) => {
      if (this.onChatMessage) {
        this.onChatMessage(message)
      }
    })
  }

  createRoom() {
    this.roomId = nanoid()
    this.socket.emit('room:create', this.roomId)
    return this.roomId
  }

  joinRoom(roomId) {
    this.roomId = roomId
    this.socket.emit('room:join', roomId)
  }

  leaveRoom() {
    if (this.roomId) {
      this.socket.emit('room:leave', this.roomId)
      this.roomId = null
      this.collaborators.clear()
    }
  }

  updatePattern(patternUpdate) {
    if (this.roomId) {
      this.socket.emit('pattern:update', {
        roomId: this.roomId,
        ...patternUpdate,
      })
    }
  }

  updateMixer(mixerUpdate) {
    if (this.roomId) {
      this.socket.emit('mixer:update', {
        roomId: this.roomId,
        ...mixerUpdate,
      })
    }
  }

  sendChatMessage(message) {
    if (this.roomId) {
      const chatMessage = {
        id: nanoid(),
        roomId: this.roomId,
        timestamp: new Date().toISOString(),
        content: message,
      }
      this.socket.emit('chat:message', chatMessage)
    }
  }

  // Cursor position sync for collaborative editing
  updateCursorPosition(position) {
    if (this.roomId) {
      this.socket.emit('cursor:update', {
        roomId: this.roomId,
        position,
      })
    }
  }

  // Real-time audio preview sync
  syncAudioPreview(previewData) {
    if (this.roomId) {
      this.socket.emit('preview:sync', {
        roomId: this.roomId,
        previewData,
      })
    }
  }

  // Save collaboration session
  saveSession() {
    if (this.roomId) {
      this.socket.emit('session:save', {
        roomId: this.roomId,
      })
    }
  }

  // Load collaboration session
  loadSession(sessionId) {
    if (this.roomId) {
      this.socket.emit('session:load', {
        roomId: this.roomId,
        sessionId,
      })
    }
  }

  // Handle reconnection
  reconnect() {
    if (this.socket && this.roomId) {
      this.socket.connect()
      this.joinRoom(this.roomId)
    }
  }

  // Clean up
  disconnect() {
    if (this.socket) {
      this.leaveRoom()
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Get current collaborators
  getCollaborators() {
    return Array.from(this.collaborators.values())
  }

  // Check if user is room owner
  isRoomOwner(userId) {
    return this.socket?.auth?.userId === userId
  }

  // Set event handlers
  setEventHandlers({
    onCollaboratorJoin,
    onCollaboratorLeave,
    onPatternUpdate,
    onMixerUpdate,
    onChatMessage,
  }) {
    this.onCollaboratorJoin = onCollaboratorJoin
    this.onCollaboratorLeave = onCollaboratorLeave
    this.onPatternUpdate = onPatternUpdate
    this.onMixerUpdate = onMixerUpdate
    this.onChatMessage = onChatMessage
  }
}

// Create singleton instance
const collaborationService = new CollaborationService()
export default collaborationService 