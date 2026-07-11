import { Worker } from 'bullmq'
import connection from '../db/redis.js'
import pool from '../db/index.js'
import { SocketNotifier } from '../models/Notifier.js'
import ocupadoQueue, { deadLetterQueue } from './index.js'

const worker = new Worker('ocupado', async (job) => {

  const { io } = await import('../server.js')
  const socketNotifier = new SocketNotifier(io)

  // ─────────────────────────────────────────
  // Job 1 — notify next student in waitlist
  // ─────────────────────────────────────────
  if (job.name === 'notify-next') {
    const { machineId } = job.data
    console.log(`📋 Processing notify-next for machine ${machineId}`)

    const result = await pool.query(
      `SELECT w.*, s.phone, s.name as student_name 
       FROM waitlist w 
       JOIN students s ON w.student_id = s.id 
       WHERE w.machine_id = $1 AND w.status = 'WAITING'
       ORDER BY w.position ASC 
       LIMIT 1`,
      [machineId]
    )

    if (result.rows.length === 0) {
      console.log(`No students waiting for machine ${machineId}`)
      await pool.query(
        `UPDATE machines 
         SET status = 'FREE',
             current_user_id = NULL,
             wash_duration = NULL,
             started_at = NULL,
             ends_at = NULL
         WHERE id = $1`,
        [machineId]
      )
      io.emit('machine-status-update', { machineId, status: 'FREE', currentUserId: null, endsAt: null })
      return
    }

    const waitlistEntry = result.rows[0]

    await pool.query(
      'UPDATE waitlist SET status = $1 WHERE id = $2',
      ['NOTIFIED', waitlistEntry.id]
    )

    await pool.query(
      'UPDATE machines SET status = $1 WHERE id = $2',
      ['RESERVED', machineId]
    )

    socketNotifier.send(
      `🟢 Machine is free! Confirm within 5 minutes or you'll lose your spot.`,
      waitlistEntry.student_id
    )

    io.emit('machine-status-update', {
      machineId,
      status: 'RESERVED'
    })

    await ocupadoQueue.add(
      'timeout-confirmation',
      { machineId, waitlistEntryId: waitlistEntry.id },
      { delay: 5 * 60 * 1000 }
    )

    console.log(`✅ Notified student ${waitlistEntry.student_name}`)
  }

  // ─────────────────────────────────────────
  // Job 2 — handle 10 min confirmation timeout
  // ─────────────────────────────────────────
  if (job.name === 'timeout-confirmation') {
    const { machineId, waitlistEntryId } = job.data
    console.log(`⏰ Processing timeout for waitlist entry ${waitlistEntryId}`)

    const result = await pool.query(
      'SELECT * FROM waitlist WHERE id = $1 AND status = $2',
      [waitlistEntryId, 'NOTIFIED']
    )

    if (result.rows.length === 0) {
      console.log('Student already confirmed, skipping timeout')
      return
    }

    await pool.query(
      'UPDATE waitlist SET status = $1 WHERE id = $2',
      ['EXPIRED', waitlistEntryId]
    )

    console.log(`⏰ Student timed out — moving to next in queue`)
    await ocupadoQueue.add('notify-next', { machineId })
  }

  // ─────────────────────────────────────────
  // Job 3 — auto free after exact wash duration
  // ─────────────────────────────────────────
  if (job.name === 'auto-free') {
    const { machineId } = job.data
    console.log(`🔄 Auto-freeing machine ${machineId}`)

    const result = await pool.query(
      'SELECT * FROM machines WHERE id = $1 AND status = $2',
      [machineId, 'ENGAGED']
    )

    if (result.rows.length === 0) {
      console.log('Machine already freed manually, skipping auto-free')
      return
    }

    // Reset all wash columns
    await pool.query(
      `UPDATE machines 
       SET status = 'FREE',
           current_user_id = NULL,
           wash_duration = NULL,
           started_at = NULL,
           ends_at = NULL
       WHERE id = $1`,
      [machineId]
    )

    io.emit('machine-status-update', {
      machineId,
      status: 'FREE',
      currentUserId: null,
      endsAt: null
    })

    await ocupadoQueue.add('notify-next', { machineId })
    console.log(`✅ Machine ${machineId} auto-freed after wash cycle`)
  }

  // ─────────────────────────────────────────
  // Job 4 — 5 minute warning before wash ends
  // ─────────────────────────────────────────
  if (job.name === '5-min-warning') {
    const { machineId, studentId } = job.data
    console.log(`⏰ 5 min warning for machine ${machineId}`)

    socketNotifier.send(
      '⏰ Your laundry finishes in 5 minutes! Get ready to collect your clothes.',
      studentId
    )

    console.log(`✅ 5 min warning sent to student ${studentId}`)
  }

}, { connection })

worker.on('completed', (job) => {
  console.log(`✅ Job completed: ${job.name}`)
})

worker.on('failed', async (job, err) => {
  console.error(`❌ Job failed: ${job.name} — ${err.message}`)

  // If the job has exhausted all retry attempts, move it to the dead-letter queue
  if (job.attemptsMade >= job.opts.attempts) {
    console.error(`💀 Job ${job.name} failed permanently after ${job.attemptsMade} attempts — moving to DLQ`)

    await deadLetterQueue.add('failed-job', {
      originalJobName: job.name,
      originalData: job.data,
      failedReason: err.message,
      attemptsMade: job.attemptsMade,
      failedAt: new Date().toISOString(),
    })
  }
})

worker.on('error', (err) => {
  console.error('Worker error:', err.message)
})

export default worker