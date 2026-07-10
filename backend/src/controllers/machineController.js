import { io } from '../server.js'
import pool from '../db/index.js'
import Machine from '../models/Machine.js'
import { v4 as uuidv4 } from 'uuid'
import ocupadoQueue from '../queue/index.js'
import QRCode from 'qrcode'

// Admin: Create a new machine
export const createMachine = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Machine name is required' })
    }

    const machineId = uuidv4()

    // Generate QR code URL
    const machineUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/machine/${machineId}`
    const qrCode = await QRCode.toDataURL(machineUrl)

    const result = await pool.query(
      'INSERT INTO machines (id, name, status, qr_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [machineId, name, 'FREE', qrCode]
    )

    const machine = new Machine(
      result.rows[0].id,
      result.rows[0].name,
      result.rows[0].status,
      result.rows[0].qr_url
    )

    res.status(201).json({ success: true, machine })
  } catch (error) {
    console.error('createMachine error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get all machines
export const getMachines = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM machines ORDER BY created_at ASC'
    )

    const machines = result.rows.map(row =>
      new Machine(row.id, row.name, row.status, row.qr_url)
    )

    res.status(200).json({ success: true, machines })
  } catch (error) {
    console.error('getMachines error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Update machine status
export const updateMachineStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['FREE', 'ENGAGED', 'RESERVED', 'MAINTENANCE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const result = await pool.query(
      'UPDATE machines SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' })
    }

    // When machine goes FREE → notify next in waitlist
    if (status === 'FREE') {
      await ocupadoQueue.add('notify-next', { machineId: id })
    }

    // Emit real-time update to ALL connected clients
    io.emit('machine-status-update', {
      machineId: result.rows[0].id,
      name: result.rows[0].name,
      status: result.rows[0].status
    })

    const machine = new Machine(
      result.rows[0].id,
      result.rows[0].name,
      result.rows[0].status,
      result.rows[0].qr_url
    )

    res.status(200).json({ success: true, machine })
  } catch (error) {
    console.error('updateMachineStatus error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Start wash — student selects cycle and begins
export const startWash = async (req, res) => {
  try {
    const { id } = req.params
    const studentId = req.user.id
    const { duration } = req.body

    if (!duration) {
      return res.status(400).json({ error: 'duration required' })
    }

    if (![30, 45, 60].includes(Number(duration))) {
      return res.status(400).json({ error: 'Duration must be 30, 45, or 60 minutes' })
    }

    // Check machine is FREE
    const machine = await pool.query(
      'SELECT * FROM machines WHERE id = $1',
      [id]
    )

    if (machine.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' })
    }

    if (machine.rows[0].status !== 'FREE') {
      return res.status(400).json({ error: 'Machine is not available' })
    }

    const startedAt = new Date()
    const endsAt = new Date(startedAt.getTime() + duration * 60 * 1000)

    // Update machine
    const result = await pool.query(
      `UPDATE machines 
       SET status = 'ENGAGED', 
           current_user_id = $1,
           wash_duration = $2,
           started_at = $3,
           ends_at = $4
       WHERE id = $5 
       RETURNING *`,
      [studentId, duration, startedAt, endsAt, id]
    )

    // BullMQ job — auto free after exact wash duration
    await ocupadoQueue.add(
      'auto-free',
      { machineId: id },
      { delay: duration * 60 * 1000 }
    )

    // BullMQ job — 5 min warning before wash ends
    await ocupadoQueue.add(
      '5-min-warning',
      { machineId: id, studentId },
      { delay: (duration - 5) * 60 * 1000 }
    )

    // Emit real-time update
    io.emit('machine-status-update', {
      machineId: id,
      status: 'ENGAGED',
      currentUserId: studentId,
      endsAt: endsAt.toISOString(),
      washDuration: duration
    })

    res.status(200).json({ success: true, machine: result.rows[0] })
  } catch (error) {
    console.error('startWash error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// End wash — student finishes early or timer ends
export const endWash = async (req, res) => {
  try {
    const { id } = req.params
    const studentId = req.user.id

    const machine = await pool.query(
      'SELECT * FROM machines WHERE id = $1',
      [id]
    )

    if (machine.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' })
    }

    // Only the current user can end wash
    if (machine.rows[0].current_user_id !== studentId) {
      return res.status(403).json({ error: 'Not authorized to end this wash' })
    }

    // Reset machine
    const result = await pool.query(
      `UPDATE machines 
       SET status = 'FREE',
           current_user_id = NULL,
           wash_duration = NULL,
           started_at = NULL,
           ends_at = NULL
       WHERE id = $1
       RETURNING *`,
      [id]
    )

    // Trigger waitlist
    await ocupadoQueue.add('notify-next', { machineId: id })

    // Emit real-time update
    io.emit('machine-status-update', {
      machineId: id,
      status: 'FREE',
      currentUserId: null,
      endsAt: null
    })

    res.status(200).json({ success: true, machine: result.rows[0] })
  } catch (error) {
    console.error('endWash error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Toggle maintenance mode
export const toggleMaintenance = async (req, res) => {
  try {
    const { id } = req.params
    const { isMaintenance } = req.body

    const result = await pool.query(
      `UPDATE machines 
       SET is_maintenance = $1,
           status = $2
       WHERE id = $3
       RETURNING *`,
      [isMaintenance, isMaintenance ? 'MAINTENANCE' : 'FREE', id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' })
    }

    io.emit('machine-status-update', {
      machineId: id,
      status: isMaintenance ? 'MAINTENANCE' : 'FREE'
    })

    res.status(200).json({ success: true, machine: result.rows[0] })
  } catch (error) {
    console.error('toggleMaintenance error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Get the waitlist queue for a specific machine
export const getMachineQueue = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      `SELECT w.id, w.student_id, w.position, w.status, w.joined_at,
              s.name AS student_name
       FROM waitlist w
       JOIN students s ON w.student_id = s.id
       WHERE w.machine_id = $1
         AND w.status IN ('WAITING', 'NOTIFIED')
       ORDER BY w.position ASC`,
      [id]
    )

    res.status(200).json({
      success: true,
      count: result.rows.length,
      queue: result.rows,
    })
  } catch (error) {
    console.error('getMachineQueue error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}