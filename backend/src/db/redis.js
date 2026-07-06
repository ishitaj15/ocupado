import { Redis } from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const connection = new Redis({
  host: process.env.UPSTASH_REDIS_HOST,
  port: process.env.UPSTASH_REDIS_PORT,
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: {},                      // ← required for Upstash
  maxRetriesPerRequest: null,   // ← required for BullMQ
})

connection.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

connection.on('error', (err) => {
  console.error('Redis connection error:', err.message)
})

export default connection