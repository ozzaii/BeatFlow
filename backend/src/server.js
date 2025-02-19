require('dotenv').config()
const express = require('express')
const http = require('http')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const CollaborationServer = require('./services/collaborationServer')

const app = express()
const server = http.createServer(app)

// Initialize collaboration server
const collaborationServer = new CollaborationServer(server)

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  
  await collaborationServer.close()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...')
  
  await collaborationServer.close()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
}) 