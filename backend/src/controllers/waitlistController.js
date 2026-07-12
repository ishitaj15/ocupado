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

    // Position = number of people currently waiting + 1
    const count = await pool.query(
      `SELECT COUNT(*) FROM waitlist WHERE status = 'WAITING'`
    )
    const position = parseInt(count.rows[0].count) + 1

    // Add to the global queue (no machine_id yet — assigned when notified)
    const result = await pool.query(
      `INSERT INTO waitlist (id, student_id, position, status)
       VALUES ($1, $2, $3, 'WAITING') RETURNING *`,
      [uuidv4(), studentId, position]
    )

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
  try {
    const { id: machineId } = req.params
    const studentId = req.user.id

    // Find this student's NOTIFIED entry (they were offered a machine)
    const result = await pool.query(
      `SELECT * FROM waitlist 
       WHERE student_id = $1 AND status = 'NOTIFIED'`,
      [studentId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No pending confirmation found' })
    }

    const entry = result.rows[0]
    // The machine they were offered (stored on the entry when notified)
    const offeredMachineId = entry.machine_id || machineId

    // Limit: total held machines (ENGAGED + RESERVED) can't exceed 2
    const heldCount = await pool.query(
      `SELECT COUNT(*) FROM machines 
       WHERE current_user_id = $1 AND status IN ('ENGAGED', 'RESERVED')`,
      [studentId]
    )
    if (parseInt(heldCount.rows[0].count) >= 2) {
      return res.status(400).json({
        error: 'You already hold 2 machines. Finish or release one before confirming another.'
      })
    }

    // Mark waitlist entry as CONFIRMED (record confirmed_at for countdown)
    await pool.query(
      "UPDATE waitlist SET status = 'CONFIRMED', confirmed_at = NOW() WHERE id = $1",
      [entry.id]
    )

    // Reserve the offered machine specifically for this student
    await pool.query(
      `UPDATE machines SET status = 'RESERVED', current_user_id = $1 WHERE id = $2`,
      [studentId, offeredMachineId]
    )

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
    console.error('confirmMachine error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}