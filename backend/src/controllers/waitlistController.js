import pool from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'
import { io } from '../server.js'
import ocupadoQueue from '../queue/index.js'

// Join waitlist for a machine
export const joinWaitlist = async (req, res) => {
  try {
    const { id: machineId } = req.params
    const studentId = req.user.id

    // Check machine exists
    const machine = await pool.query(
      'SELECT * FROM machines WHERE id = $1',
      [machineId]
    )
    if (machine.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' })
    }

    // Block joining a new queue if student already holds 2 machines
    const held = await pool.query(
      `SELECT COUNT(*) FROM machines 
       WHERE current_user_id = $1 AND status IN ('ENGAGED', 'RESERVED')`,
      [studentId]
    )
    if (parseInt(held.rows[0].count) >= 2) {
      return res.status(400).json({
        error: 'You already hold 2 machines. Free one before joining a new queue.'
      })
    }

    // Check student not already in waitlist
    const existing = await pool.query(
      `SELECT * FROM waitlist 
       WHERE machine_id = $1 AND student_id = $2 
       AND status IN ('WAITING', 'NOTIFIED')`,
      [machineId, studentId]
    )
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already in waitlist' })
    }

    // Get current waitlist size for position
    const count = await pool.query(
      `SELECT COUNT(*) FROM waitlist 
       WHERE machine_id = $1 AND status = 'WAITING'`,
      [machineId]
    )
    const position = parseInt(count.rows[0].count) + 1

    // Add to waitlist
    const result = await pool.query(
      `INSERT INTO waitlist (id, machine_id, student_id, position, status)
       VALUES ($1, $2, $3, $4, 'WAITING') RETURNING *`,
      [uuidv4(), machineId, studentId, position]
    )

    res.status(201).json({
      success: true,
      message: `You are position ${position} in the waitlist`,
      waitlist: result.rows[0]
    })
  } catch (error) {
    console.error('joinWaitlist error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Confirm machine (student says "I'm coming")
export const confirmMachine = async (req, res) => {
  try {
    const { id: machineId } = req.params
    const studentId = req.user.id

    // Find NOTIFIED entry for this student
    const result = await pool.query(
      `SELECT * FROM waitlist 
       WHERE machine_id = $1 AND student_id = $2 
       AND status = 'NOTIFIED'`,
      [machineId, studentId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No pending confirmation found' })
    }

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

    // Mark waitlist entry as CONFIRMED
    await pool.query(
      'UPDATE waitlist SET status = $1 WHERE id = $2',
      ['CONFIRMED', result.rows[0].id]
    )

    // Reserve the machine specifically for this student
    await pool.query(
      `UPDATE machines SET status = 'RESERVED', current_user_id = $1 WHERE id = $2`,
      [studentId, machineId]
    )

    // Notify all clients so the machine shows RESERVED
    io.emit('machine-status-update', { machineId, status: 'RESERVED', currentUserId: studentId })

    // Schedule a 3-min timer: if they don't start the wash, release the machine
    await ocupadoQueue.add(
      'reservation-timeout',
      { machineId, studentId },
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