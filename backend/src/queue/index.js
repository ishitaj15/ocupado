import { Queue } from 'bullmq'
import connection from '../db/redis.js'

// Main queue for all jobs
const ocupadoQueue = new Queue('ocupado', { connection })

console.log('✅ BullMQ Queue initialized')

export default ocupadoQueue