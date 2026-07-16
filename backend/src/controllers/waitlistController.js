import pool from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'
import { io } from '../server.js'
import ocupadoQueue from '../queue/index.js'

// Join the GLOBAL queue — student wants any machine, whichever frees first
export const joinWaitlist = async (req, res) => {
  try {
    const studentId = req.user.id

    // Block joining if student already holds 2 machines
    const held = await pool.query(
      `SELECT COUNT(*) FROM machines 
       WHERE current_user_id = $1 AND status IN ('ENGAGED', 'RESERVED')`,
      [studentId]
    )
    if (parseInt(held.rows[0].count) >= 2) {
      return res.status(400).json({
        error: 'You already hold 2 machines. Free one before joining the queue.'
      })
    }

    // Block if already in the queue (WAITING, NOTIFIED, or CONFIRMED)
    const existing = await pool.query(
      `SELECT * FROM waitlist 
       WHERE student_id = $1 AND status IN ('WAITING', 'NOTIFIED', 'CONFIRMED')`,
      [studentId]
    )
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You are already in the queue' })
    }

    // Add to the global queue (no machine_id yet — assigned when notified).
    // No position column: order is derived from joined_at, which can never
    // go stale or collide the way a cached counter does.
    const result = await pool.query(
      `INSERT INTO waitlist (id, student_id, status)
       VALUES ($1, $2, 'WAITING') RETURNING *`,
      [uuidv4(), studentId]
    )

    // Position for the response message, computed live
    const ahead = await pool.query(
      `SELECT COUNT(*) FROM waitlist
       WHERE status = 'WAITING' AND joined_at < $1`,
      [result.rows[0].joined_at]
    )
    const position = parseInt(ahead.rows[0].count) + 1

    res.status(201).json({
      success: true,
      message: `You're #${position} in line for the next available machine`,
      waitlist: result.rows[0]
    })
  } catch (error) {
    console.error('joinWaitlist error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Confirm — student accepts the machine they were offered
export const confirmMachine = async (req, res) => {
  const client = await pool.connect()
  try {
    const { id: machineId } = req.params
    const studentId = req.user.id

    await client.query('BEGIN')

    // Lock this student's row for the duration of the transaction. Two confirms
    // arriving at once would otherwise both read the same machine count, both
    // see room, and both proceed — leaving the student holding 3 machines.
    // The second one now blocks here until the first commits, then re-reads.
    await client.query(`SELECT id FROM students WHERE id = $1 FOR UPDATE`, [studentId])

    // Find this student's NOTIFIED entry (they were offered a machine)
    const result = await client.query(
      `SELECT * FROM waitlist 
       WHERE student_id = $1 AND status = 'NOTIFIED'`,
      [studentId]
    )
    if (result.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'No pending confirmation found' })
    }

    const entry = result.rows[0]
    // The machine they were offered (stored on the entry when notified)
    const offeredMachineId = entry.machine_id || machineId

    // Limit: total held machines (ENGAGED + RESERVED) can't exceed 2
    const heldCount = await client.query(
      `SELECT COUNT(*) FROM machines 
       WHERE current_user_id = $1 AND status IN ('ENGAGED', 'RESERVED')`,
      [studentId]
    )
    if (parseInt(heldCount.rows[0].count) >= 2) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'You already hold 2 machines. Finish or release one before confirming another.'
      })
    }

    // Mark waitlist entry as CONFIRMED (record confirmed_at for countdown)
    await client.query(
      "UPDATE waitlist SET status = 'CONFIRMED', confirmed_at = NOW() WHERE id = $1",
      [entry.id]
    )

    // Reserve the offered machine specifically for this student
    await client.query(
      `UPDATE machines SET status = 'RESERVED', current_user_id = $1 WHERE id = $2`,
      [studentId, offeredMachineId]
    )

    await client.query('COMMIT')

    // Side effects go AFTER the commit — never emit a socket event or enqueue a
    // job for a transaction that might still roll back.
    io.emit('machine-status-update', {
      machineId: offeredMachineId,
      status: 'RESERVED',
      currentUserId: studentId,
    })

    // Schedule a 3-min timer: if they don't start the wash, release the machine
    await ocupadoQueue.add(
      'reservation-timeout',
      { machineId: offeredMachineId, studentId },
      { delay: 3 * 60 * 1000 }
    )

    res.status(200).json({
      success: true,
      message: 'Confirmed! The machine is reserved for you — start your wash within 3 minutes.'
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('confirmMachine error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
  }
}