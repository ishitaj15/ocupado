import pool from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'

// Join waitlist for a machine
export const joinWaitlist = async (req, res) => {
  try {
    const { machineId } = req.params
    const { studentId } = req.body

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' })
    }

    // Check machine exists
    const machine = await pool.query(
      'SELECT * FROM machines WHERE id = $1',
      [machineId]
    )

    if (machine.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' })
    }

    // Check student not already in waitlist
    const existing = await pool.query(
      `SELECT * FROM waitlist 
       WHERE machine_id = $1 AND student_id = $2 
       AND status = 'WAITING'`,
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
    const { machineId } = req.params
    const { studentId } = req.body

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

    // Mark as CONFIRMED
    await pool.query(
      'UPDATE waitlist SET status = $1 WHERE id = $2',
      ['CONFIRMED', result.rows[0].id]
    )

    res.status(200).json({
      success: true,
      message: 'Confirmed! Machine is reserved for you. Come up now.'
    })
  } catch (error) {
    console.error('confirmMachine error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}