import ocupadoQueue from './queue/index.js'
import './queue/worker.js'
import './db/redis.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import './db/index.js'
import waitlistRoutes from './routes/waitlistRoutes.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}))
app.use(express.json())

// Health check route — used by cron-job.org to keep Render awake
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() })
})

import machineRoutes from './routes/machineRoutes.js'
app.use('/api/machines', waitlistRoutes)

// Routes
app.use('/api/machines', machineRoutes)

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`)
    console.log(`User ${userId} joined their room`)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Export io for use in other files
export { io }

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Ocupado server running on port ${PORT}`)
})