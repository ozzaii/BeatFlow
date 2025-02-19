/**
 * @file WebSocketService.js
 * @description High-performance WebSocket service for real-time features
 * Features:
 * - Automatic reconnection
 * - Message queuing
 * - Binary protocol
 * - Presence tracking
 * - Room management
 */

import { encode, decode } from '@msgpack/msgpack'
import ReconnectingWebSocket from 'reconnecting-websocket'

class WebSocketService {
  constructor() {
    this.socket = null
    this.messageQueue = []
    this.handlers = new Map()
    this.rooms = new Map()
    this.presence = new Map()
    this.retryCount = 0
    this.maxRetries = 5
  }

  async connect(userId, authToken) {
    const wsUrl = `${process.env.REACT_APP_WS_URL}?userId=${userId}&token=${authToken}`
    
    this.socket = new ReconnectingWebSocket(wsUrl, [], {
      maxRetries: this.maxRetries,
      maxReconnectionDelay: 5000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 4000,
      maxEnqueuedMessages: 1000,
      binaryType: 'arraybuffer',
    })

    // Set up event handlers
    this.socket.addEventListener('open', this.handleOpen.bind(this))
    this.socket.addEventListener('message', this.handleMessage.bind(this))
    this.socket.addEventListener('close', this.handleClose.bind(this))
    this.socket.addEventListener('error', this.handleError.bind(this))

    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000)
      this.socket.addEventListener('open', () => {
        clearTimeout(timeout)
        resolve()
      }, { once: true })
    })
  }

  // Room management
  async joinRoom(roomId, options = {}) {
    const message = {
      type: 'room:join',
      roomId,
      options,
    }

    await this.send(message)
    this.rooms.set(roomId, {
      id: roomId,
      members: new Set(),
      state: {},
      ...options,
    })
  }

  async leaveRoom(roomId) {
    const message = {
      type: 'room:leave',
      roomId,
    }

    await this.send(message)
    this.rooms.delete(roomId)
  }

  // Real-time battle features
  async startBattle(battleId, participants) {
    const message = {
      type: 'battle:start',
      battleId,
      participants,
    }

    await this.send(message)
  }

  async submitVote(battleId, voterId, targetId) {
    const message = {
      type: 'battle:vote',
      battleId,
      voterId,
      targetId,
      timestamp: Date.now(),
    }

    await this.send(message)
  }

  async syncAudio(roomId, audioData) {
    // Use binary format for audio data
    const message = new ArrayBuffer(8 + audioData.length * 4)
    const view = new DataView(message)
    
    // Header
    view.setUint32(0, roomId)
    view.setUint32(4, audioData.length)
    
    // Audio data
    const audioView = new Float32Array(message, 8)
    audioView.set(audioData)

    await this.sendBinary(message)
  }

  // Message handling
  async send(data) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(data)
      return
    }

    const encoded = encode(data)
    this.socket.send(encoded)
  }

  async sendBinary(data) {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(data)
      return
    }

    this.socket.send(data)
  }

  // Event handlers
  handleOpen() {
    console.log('WebSocket connected')
    this.retryCount = 0

    // Send queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message instanceof ArrayBuffer) {
        this.sendBinary(message)
      } else {
        this.send(message)
      }
    }

    // Restore room subscriptions
    this.rooms.forEach((room, roomId) => {
      this.joinRoom(roomId, room)
    })
  }

  handleMessage(event) {
    let data
    
    if (event.data instanceof ArrayBuffer) {
      // Handle binary audio data
      const view = new DataView(event.data)
      const roomId = view.getUint32(0)
      const length = view.getUint32(4)
      const audioData = new Float32Array(event.data, 8, length)
      
      this.handleAudioSync(roomId, audioData)
      return
    }

    try {
      data = decode(event.data)
    } catch (error) {
      console.error('Failed to decode message:', error)
      return
    }

    const handler = this.handlers.get(data.type)
    if (handler) {
      handler(data)
    }
  }

  handleClose(event) {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`)
    this.retryCount++

    if (this.retryCount >= this.maxRetries) {
      this.handleFatalError('Max reconnection attempts reached')
    }
  }

  handleError(error) {
    console.error('WebSocket error:', error)
  }

  handleFatalError(message) {
    // Notify application of fatal error
    const handler = this.handlers.get('error')
    if (handler) {
      handler({ type: 'error', message })
    }
  }

  // Audio sync handling
  handleAudioSync(roomId, audioData) {
    const room = this.rooms.get(roomId)
    if (!room) return

    const handler = this.handlers.get('audio:sync')
    if (handler) {
      handler({ roomId, audioData })
    }
  }

  // Presence tracking
  updatePresence(status) {
    const message = {
      type: 'presence:update',
      status,
      timestamp: Date.now(),
    }

    this.send(message)
  }

  // Event registration
  on(type, handler) {
    this.handlers.set(type, handler)
  }

  off(type) {
    this.handlers.delete(type)
  }

  // Cleanup
  dispose() {
    this.socket?.close()
    this.messageQueue = []
    this.handlers.clear()
    this.rooms.clear()
    this.presence.clear()
  }
}

// Create singleton instance
const webSocketService = new WebSocketService()
export default webSocketService 