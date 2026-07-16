import { Worker } from 'bullmq'
import connection from '../db/redis.js'
import pool from '../db/index.js'
import { SocketNotifier } from '../models/Notifier.js'
import ocupadoQueue, { deadLetterQueue } from './index.js'

const worker = new Worker('ocupado', async (job) => {

  const { io } = await import('../server.js')
  const socketNotifier = new SocketNotifier(io)

  // ─────────────────────────────────────────
  // Job 1 — offer a freed machine to next ELIGIBLE student (global queue)
  // ─────────────────────────────────────────
  if (job.name === 'notify-next') {
    const { machineId } = job.data
    console.log(`📋 Processing notify-next — machine ${machineId} is free`)

    // Make sure this machine is actually FREE before offering it
    const machineCheck = await pool.query(
      `SELECT status FROM machines WHERE id = $1`,
      [machineId]
    )
    if (machineCheck.rows.length === 0 || machineCheck.rows[0].status !== 'FREE') {
      console.log(`Machine ${machineId} is not FREE — skipping offer`)
      return
    }

    // Get the GLOBAL queue (all waiting students, in order)
    const waiting = await pool.query(
      `SELECT w.*, s.name as student_name 
       FROM waitlist w 
       JOIN students s ON w.student_id = s.id 
       WHERE w.status = 'WAITING'
       ORDER BY w.joined_at ASC`
    )

    // Find first ELIGIBLE student: holds < 2 machines AND no pending offer.
    // Note: a student who joined the queue and then filled up to 2 machines
    // stays in the queue but is skipped here until they drop below the limit.
    // This is intentional — it prevents deadlock without needing to eagerly
    // remove them from the queue when their machine count changes.
    let chosen = null
    for (const entry of waiting.rows) {
      
      const held = await pool.query(
        `SELECT COUNT(*) FROM machines 
         WHERE current_user_id = $1 AND status IN ('ENGAGED', 'RESERVED')`,
        [entry.student_id]
      )
      if (parseInt(held.rows[0].count) >= 2) {
        console.log(`⏭️ Skipping ${entry.student_name} — already holds 2 machines`)
        continue
      }

      const pending = await pool.query(
        `SELECT COUNT(*) FROM waitlist 
         WHERE student_id = $1 AND status IN ('NOTIFIED', 'CONFIRMED')`,
        [entry.student_id]
      )
      if (parseInt(pending.rows[0].count) > 0) {
        console.log(`⏭️ Skipping ${entry.student_name} — already has a pending offer`)
        continue
      }

      chosen = entry
      break
    }

    // No eligible student → machine stays FREE (open to all)
    if (!chosen) {
      console.log(`No eligible students in queue — machine ${machineId} stays FREE`)
      return
    }

    // Offer THIS machine to the chosen student
    await pool.query(
      `UPDATE waitlist 
       SET status = 'NOTIFIED', machine_id = $1, notified_at = NOW() 
       WHERE id = $2`,
      [machineId, chosen.id]
    )

    // Reserve the machine so no one else grabs it during the confirm window
    await pool.query(
      `UPDATE machines SET status = 'RESERVED' WHERE id = $1`,
      [machineId]
    )

    socketNotifier.send(
      `🟢 A machine is free! Confirm within 5 minutes or you'll lose your spot.`,
      chosen.student_id
    )

    io.emit('machine-status-update', { machineId, status: 'RESERVED' })

    await ocupadoQueue.add(
      'timeout-confirmation',
      { machineId, waitlistEntryId: chosen.id },
      { delay: 5 * 60 * 1000 }
    )

    console.log(`✅ Offered machine ${machineId} to ${chosen.student_name}`)
  }

  // ─────────────────────────────────────────
  // Job 2 — 5 min confirmation timeout (notified but didn't confirm)
  // ─────────────────────────────────────────
  if (job.name === 'timeout-confirmation') {
    const { machineId, waitlistEntryId } = job.data
    console.log(`⏰ Processing confirm-timeout for waitlist entry ${waitlistEntryId}`)

    const result = await pool.query(
      'SELECT * FROM waitlist WHERE id = $1 AND status = $2',
      [waitlistEntryId, 'NOTIFIED']
    )

    if (result.rows.length === 0) {
      console.log('Student already confirmed, skipping timeout')
      return
    }

    // They didn't confirm → expire their entry
    await pool.query(
      'UPDATE waitlist SET status = $1 WHERE id = $2',
      ['EXPIRED', waitlistEntryId]
    )

    // Free the machine and re-offer it to the queue
    await pool.query(
      `UPDATE machines 
       SET status = 'FREE', current_user_id = NULL 
       WHERE id = $1 AND status = 'RESERVED'`,
      [machineId]
    )

    console.log(`⏰ Confirm timed out — re-offering machine ${machineId}`)
    await ocupadoQueue.add('notify-next', { machineId })
  }

  // ─────────────────────────────────────────
  // Job 2b — reservation timeout (confirmed but never started)
  // ─────────────────────────────────────────
  if (job.name === 'reservation-timeout') {
    const { machineId, studentId } = job.data
    console.log(`⏰ Processing reservation-timeout for machine ${machineId}`)

    // Is the machine still RESERVED for this student? (i.e. they never started)
    const result = await pool.query(
      `SELECT * FROM machines 
       WHERE id = $1 AND status = 'RESERVED' AND current_user_id = $2`,
      [machineId, studentId]
    )

    if (result.rows.length === 0) {
      console.log('Machine already started or released, skipping reservation-timeout')
      return
    }

    // They didn't start in time → release the machine and their waitlist entry
    await pool.query(
      `UPDATE waitlist SET status = 'EXPIRED' 
       WHERE machine_id = $1 AND student_id = $2 AND status = 'CONFIRMED'`,
      [machineId, studentId]
    )

    await pool.query(
      `UPDATE machines 
       SET status = 'FREE', current_user_id = NULL, wash_duration = NULL,
           started_at = NULL, ends_at = NULL
       WHERE id = $1`,
      [machineId]
    )

    console.log(`⏰ Reservation expired — student didn't start. Releasing machine ${machineId}`)

    // Give it to the next eligible person
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

    await pool.query(
      `UPDATE machines 
       SET status = 'FREE', current_user_id = NULL, wash_duration = NULL,
           started_at = NULL, ends_at = NULL
       WHERE id = $1`,
      [machineId]
    )

    io.emit('machine-status-update', {
      machineId, status: 'FREE', currentUserId: null, endsAt: null
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