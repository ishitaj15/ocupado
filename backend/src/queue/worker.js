import { Worker } from 'bullmq'
import connection from '../db/redis.js'
import pool from '../db/index.js'
import { SocketNotifier } from '../models/Notifier.js'
import ocupadoQueue from './index.js'

const worker = new Worker('ocupado', async (job) => {

  // Import io inside handler to avoid circular dependency
  const { io } = await import('../server.js')
  const socketNotifier = new SocketNotifier(io)

  // ─────────────────────────────────────────
  // Job 1 — notify next student in waitlist
  // ─────────────────────────────────────────
  if (job.name === 'notify-next') {
    const { machineId } = job.data
    console.log(`📋 Processing notify-next for machine ${machineId}`)

    // Get next WAITING student for this machine
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
      // No one waiting — machine goes FREE
      await pool.query(
        'UPDATE machines SET status = $1 WHERE id = $2',
        ['FREE', machineId]
      )
      io.emit('machine-status-update', { machineId, status: 'FREE' })
      return
    }

    const waitlistEntry = result.rows[0]

    // Mark waitlist entry as NOTIFIED
    await pool.query(
      'UPDATE waitlist SET status = $1 WHERE id = $2',
      ['NOTIFIED', waitlistEntry.id]
    )

    // Mark machine as RESERVED
    await pool.query(
      'UPDATE machines SET status = $1 WHERE id = $2',
      ['RESERVED', machineId]
    )

    // Notify student via Socket.io
    socketNotifier.send(
      `🟢 Machine is free! Confirm within 10 minutes or you'll lose your spot.`,
      waitlistEntry.student_id
    )

    // Update dashboard for everyone
    io.emit('machine-status-update', {
      machineId,
      status: 'RESERVED'
    })

    // Create 10 min timeout job
    await ocupadoQueue.add(
      'timeout-confirmation',
      { 
        machineId, 
        waitlistEntryId: waitlistEntry.id 
      },
      { delay: 10 * 60 * 1000 }  // 10 minutes in ms
    )

    console.log(`✅ Notified student ${waitlistEntry.student_name}`)
  }

  // ─────────────────────────────────────────
  // Job 2 — handle 10 min confirmation timeout
  // ─────────────────────────────────────────
  if (job.name === 'timeout-confirmation') {
    const { machineId, waitlistEntryId } = job.data
    console.log(`⏰ Processing timeout for waitlist entry ${waitlistEntryId}`)

    // Check if student still hasn't confirmed
    const result = await pool.query(
      'SELECT * FROM waitlist WHERE id = $1 AND status = $2',
      [waitlistEntryId, 'NOTIFIED']
    )

    if (result.rows.length === 0) {
      // Student already confirmed or manually handled
      console.log('Student already confirmed, skipping timeout')
      return
    }

    // Mark as EXPIRED — they lost their spot
    await pool.query(
      'UPDATE waitlist SET status = $1 WHERE id = $2',
      ['EXPIRED', waitlistEntryId]
    )

    console.log(`⏰ Student timed out — moving to next in queue`)

    // Notify next student in line
    await ocupadoQueue.add('notify-next', { machineId })
  }

  // ─────────────────────────────────────────
  // Job 3 — auto free machine after 2 hours
  // ─────────────────────────────────────────
  if (job.name === 'auto-free') {
    const { machineId } = job.data
    console.log(`🔄 Auto-freeing machine ${machineId}`)

    // Only free if still ENGAGED (student may have freed manually)
    const result = await pool.query(
      'SELECT * FROM machines WHERE id = $1 AND status = $2',
      [machineId, 'ENGAGED']
    )

    if (result.rows.length === 0) {
      console.log('Machine already freed manually, skipping auto-free')
      return
    }

    // Mark machine FREE
    await pool.query(
      'UPDATE machines SET status = $1 WHERE id = $2',
      ['FREE', machineId]
    )

    // Update dashboard
    io.emit('machine-status-update', {
      machineId,
      status: 'FREE'
    })

    // Trigger waitlist
    await ocupadoQueue.add('notify-next', { machineId })

    console.log(`✅ Machine ${machineId} auto-freed after 2 hours`)
  }

}, { connection })

// ─────────────────────────────────────────
// Worker event listeners
// ─────────────────────────────────────────
worker.on('completed', (job) => {
  console.log(`✅ Job completed: ${job.name}`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Job failed: ${job.name} — ${err.message}`)
})

worker.on('error', (err) => {
  console.error('Worker error:', err.message)
})

export default worker