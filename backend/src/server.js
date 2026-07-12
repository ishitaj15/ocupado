import adminRoutes from './routes/adminRoutes.js'
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import studentRoutes from './routes/studentRoutes.js'

// DB connections
import './db/index.js'
import './db/redis.js'

// Queue
import './queue/index.js'
import './queue/worker.js'

const app = express()
const httpServer = createServer(app)

// Socket.io setup
// Allowed frontend origins (both common Vite dev ports)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean)

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(cors({
  origin: allowedOrigins
}))


app.use(express.json())

// Routes
import machineRoutes from './routes/machineRoutes.js'
import authRoutes from './routes/authRoutes.js'
import waitlistRoutes from './routes/waitlistRoutes.js'


app.use('/api/admin', adminRoutes)

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() })
})

app.use('/api/auth', authRoutes)
app.use('/api/machines', machineRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/waitlist', waitlistRoutes)

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