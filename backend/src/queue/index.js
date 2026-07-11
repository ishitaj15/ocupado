import { Queue } from 'bullmq'
import connection from '../db/redis.js'

// Default options applied to every job added to the main queue
const defaultJobOptions = {
  attempts: 3,                        // retry up to 3 times before giving up
  backoff: {
    type: 'exponential',
    delay: 2000,                      // 2s, then 4s, then 8s between retries
  },
  removeOnComplete: true,             // clean up successful jobs from Redis
  removeOnFail: false,                // keep failed jobs for inspection
}

// Main queue for all jobs
const ocupadoQueue = new Queue('ocupado', { connection, defaultJobOptions })

// Dead-letter queue — permanently failed jobs land here for inspection
const deadLetterQueue = new Queue('ocupado-dlq', { connection })

console.log('✅ BullMQ Queue initialized')
console.log('✅ Dead-letter queue initialized')

export default ocupadoQueue
export { deadLetterQueue }