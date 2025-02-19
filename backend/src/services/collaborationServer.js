const { Server } = require('socket.io')
const { createAdapter } = require('@socket.io/redis-adapter')
const Redis = require('ioredis')
const { v4: uuidv4 } = require('uuid')

class CollaborationServer {
  constructor(httpServer) {
    // Initialize Redis clients
    this.pubClient = new Redis(process.env.REDIS_URL)
    this.subClient = this.pubClient.duplicate()

    // Initialize Socket.IO with Redis adapter
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    })

    this.io.adapter(createAdapter(this.pubClient, this.subClient))

    // Store room data
    this.rooms = new Map()

    // Initialize server
    this.initialize()
  }

  initialize() {
    this.io.on('connection', (socket) => {
      const { userId, username } = socket.handshake.auth

      if (!userId || !username) {
        socket.disconnect()
        return
      }

      console.log(`User connected: ${username} (${userId})`)

      // Store user data
      socket.data.userId = userId
      socket.data.username = username

      // Handle room creation
      socket.on('room:create', (roomId) => {
        this.handleRoomCreate(socket, roomId)
      })

      // Handle room joining
      socket.on('room:join', (roomId) => {
        this.handleRoomJoin(socket, roomId)
      })

      // Handle room leaving
      socket.on('room:leave', (roomId) => {
        this.handleRoomLeave(socket, roomId)
      })

      // Handle pattern updates
      socket.on('pattern:update', (update) => {
        this.handlePatternUpdate(socket, update)
      })

      // Handle mixer updates
      socket.on('mixer:update', (update) => {
        this.handleMixerUpdate(socket, update)
      })

      // Handle chat messages
      socket.on('chat:message', (message) => {
        this.handleChatMessage(socket, message)
      })

      // Handle cursor updates
      socket.on('cursor:update', (update) => {
        this.handleCursorUpdate(socket, update)
      })

      // Handle audio preview sync
      socket.on('preview:sync', (previewData) => {
        this.handlePreviewSync(socket, previewData)
      })

      // Handle session management
      socket.on('session:save', (data) => {
        this.handleSessionSave(socket, data)
      })

      socket.on('session:load', (data) => {
        this.handleSessionLoad(socket, data)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })
    })
  }

  handleRoomCreate(socket, roomId) {
    const room = {
      id: roomId,
      owner: socket.data.userId,
      collaborators: new Map(),
      patterns: new Map(),
      mixerState: {},
      messages: [],
      createdAt: new Date(),
    }

    this.rooms.set(roomId, room)
    this.handleRoomJoin(socket, roomId)
  }

  handleRoomJoin(socket, roomId) {
    const room = this.rooms.get(roomId)
    if (!room) {
      socket.emit('error', { message: 'Room not found' })
      return
    }

    // Join socket.io room
    socket.join(roomId)

    // Add collaborator to room
    const collaborator = {
      userId: socket.data.userId,
      username: socket.data.username,
      isOwner: room.owner === socket.data.userId,
      joinedAt: new Date(),
      isActive: true,
    }

    room.collaborators.set(socket.data.userId, collaborator)

    // Notify others in the room
    socket.to(roomId).emit('collaborator:join', collaborator)

    // Send room state to the joining user
    socket.emit('room:state', {
      collaborators: Array.from(room.collaborators.values()),
      patterns: Array.from(room.patterns.values()),
      mixerState: room.mixerState,
      messages: room.messages,
    })
  }

  handleRoomLeave(socket, roomId) {
    const room = this.rooms.get(roomId)
    if (!room) return

    // Remove collaborator from room
    room.collaborators.delete(socket.data.userId)

    // Notify others
    socket.to(roomId).emit('collaborator:leave', socket.data.userId)

    // Leave socket.io room
    socket.leave(roomId)

    // Clean up empty rooms
    if (room.collaborators.size === 0) {
      this.rooms.delete(roomId)
    }
  }

  handlePatternUpdate(socket, update) {
    const { roomId, patternId, data } = update
    const room = this.rooms.get(roomId)
    if (!room) return

    // Update pattern in room state
    room.patterns.set(patternId, {
      ...data,
      updatedAt: new Date(),
      updatedBy: socket.data.userId,
    })

    // Broadcast to others in the room
    socket.to(roomId).emit('pattern:update', update)
  }

  handleMixerUpdate(socket, update) {
    const { roomId, data } = update
    const room = this.rooms.get(roomId)
    if (!room) return

    // Update mixer state
    room.mixerState = {
      ...room.mixerState,
      ...data,
      updatedAt: new Date(),
      updatedBy: socket.data.userId,
    }

    // Broadcast to others in the room
    socket.to(roomId).emit('mixer:update', update)
  }

  handleChatMessage(socket, message) {
    const { roomId } = message
    const room = this.rooms.get(roomId)
    if (!room) return

    // Add user data to message
    const enrichedMessage = {
      ...message,
      userId: socket.data.userId,
      username: socket.data.username,
      timestamp: new Date(),
    }

    // Store message in room
    room.messages.push(enrichedMessage)

    // Broadcast to all in the room (including sender for consistency)
    this.io.to(roomId).emit('chat:message', enrichedMessage)
  }

  handleCursorUpdate(socket, update) {
    const { roomId, position } = update
    
    // Broadcast cursor position to others in the room
    socket.to(roomId).emit('cursor:update', {
      userId: socket.data.userId,
      position,
    })
  }

  handlePreviewSync(socket, previewData) {
    const { roomId } = previewData
    
    // Broadcast preview data to others in the room
    socket.to(roomId).emit('preview:sync', {
      userId: socket.data.userId,
      ...previewData,
    })
  }

  async handleSessionSave(socket, { roomId }) {
    const room = this.rooms.get(roomId)
    if (!room) return

    try {
      const sessionData = {
        patterns: Array.from(room.patterns.values()),
        mixerState: room.mixerState,
        createdAt: new Date(),
        createdBy: socket.data.userId,
      }

      // Save to Redis
      const sessionId = uuidv4()
      await this.pubClient.set(
        `session:${sessionId}`,
        JSON.stringify(sessionData),
        'EX',
        60 * 60 * 24 * 7 // 1 week expiry
      )

      socket.emit('session:saved', { sessionId })
    } catch (error) {
      socket.emit('error', { message: 'Failed to save session' })
    }
  }

  async handleSessionLoad(socket, { roomId, sessionId }) {
    try {
      const sessionData = await this.pubClient.get(`session:${sessionId}`)
      if (!sessionData) {
        socket.emit('error', { message: 'Session not found' })
        return
      }

      const session = JSON.parse(sessionData)

      // Update room state
      const room = this.rooms.get(roomId)
      if (room) {
        room.patterns = new Map(session.patterns.map(p => [p.id, p]))
        room.mixerState = session.mixerState

        // Broadcast new state to all in room
        this.io.to(roomId).emit('session:loaded', session)
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to load session' })
    }
  }

  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.data.username} (${socket.data.userId})`)

    // Leave all rooms
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.collaborators.has(socket.data.userId)) {
        this.handleRoomLeave(socket, roomId)
      }
    }
  }

  // Clean up resources
  async close() {
    await this.pubClient.quit()
    await this.subClient.quit()
    await this.io.close()
  }
}

module.exports = CollaborationServer 