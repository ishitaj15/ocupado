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

    const machines = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      qrUrl: row.qr_url,
      currentUserId: row.current_user_id,
      endsAt: row.ends_at,
      washDuration: row.wash_duration,
    }))

    res.status(200).json({ success: true, machines })
  } catch (error) {
    console.error('getMachines error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Start wash — student selects cycle and begins
export const startWash = async (req, res) => {
  const { id } = req.params
  const studentId = req.user.id
  const { duration } = req.body

  // Validate before taking a connection from the pool — no point holding one
  // for a request that can't proceed.
  if (!duration) {
    return res.status(400).json({ error: 'duration required' })
  }

  if (![30, 45, 60].includes(Number(duration))) {
    return res.status(400).json({ error: 'Duration must be 30, 45, or 60 minutes' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Two locks, always taken in this order (student, then machine) so that
    // concurrent requests can never deadlock by grabbing them in opposite order.

    // Lock 1 — the student. Stops two of THIS student's requests from both
    // reading the same machine count and both deciding there's room.
    await client.query(`SELECT id FROM students WHERE id = $1 FOR UPDATE`, [studentId])

    // Lock 2 — the machine. Stops two DIFFERENT students from both seeing this
    // machine as FREE and both starting a wash on it, where the second UPDATE
    // would silently overwrite the first student's wash.
    const machine = await client.query(
      'SELECT * FROM machines WHERE id = $1 FOR UPDATE',
      [id]
    )

    if (machine.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Machine not found' })
    }

    // Limit: a student can use at most 2 machines at once
    // Count machines this student holds (ENGAGED + RESERVED), excluding the one being started
    const activeCount = await client.query(
      `SELECT COUNT(*) FROM machines 
       WHERE current_user_id = $1 AND status IN ('ENGAGED', 'RESERVED') AND id != $2`,
      [studentId, id]
    )
    if (parseInt(activeCount.rows[0].count) >= 2) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'You can only use 2 machines at a time' })
    }

    const current = machine.rows[0]
    const isFree = current.status === 'FREE'
    const isMyReservation =
      current.status === 'RESERVED' && current.current_user_id === studentId

    // Allow starting only if the machine is FREE, or RESERVED for this student
    if (!isFree && !isMyReservation) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Machine is not available' })
    }

    const startedAt = new Date()
    const endsAt = new Date(startedAt.getTime() + duration * 60 * 1000)

    const result = await client.query(
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

    // If this was a reserved machine, clear the student's waitlist entry (turn used)
    await client.query(
      `DELETE FROM waitlist WHERE machine_id = $1 AND student_id = $2`,
      [id, studentId]
    )

    await client.query('COMMIT')

    // Side effects only after the commit — never schedule an auto-free for a
    // wash that might still roll back.
    await ocupadoQueue.add(
      'auto-free',
      { machineId: id },
      { delay: duration * 60 * 1000 }
    )

    await ocupadoQueue.add(
      '5-min-warning',
      { machineId: id, studentId },
      { delay: (duration - 5) * 60 * 1000 }
    )

    io.emit('machine-status-update', {
      machineId: id,
      status: 'ENGAGED',
      currentUserId: studentId,
      endsAt: endsAt.toISOString(),
      washDuration: duration
    })

    res.status(200).json({ success: true, machine: result.rows[0] })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('startWash error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
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

    if (machine.rows[0].current_user_id !== studentId) {
      return res.status(403).json({ error: 'Not authorized to end this wash' })
    }

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

    await ocupadoQueue.add('notify-next', { machineId: id })

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

    // Fetch the machine first so we can check its current state
    const machine = await pool.query('SELECT * FROM machines WHERE id = $1', [id])
    if (machine.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' })
    }

    // Safety: don't take a machine out of service while someone is using or
    // holding it. The UPDATE below overwrites status but leaves current_user_id,
    // started_at and ends_at intact — so auto-free (which only matches
    // status = 'ENGAGED') would silently skip it, stranding the machine in
    // MAINTENANCE forever with a ghost wash attached.
    if (isMaintenance && ['ENGAGED', 'RESERVED'].includes(machine.rows[0].status)) {
      return res.status(400).json({
        error: 'Cannot put a machine into maintenance while it is in use or reserved. Wait until it is free.',
      })
    }

    const result = await pool.query(
      `UPDATE machines 
       SET is_maintenance = $1,
           status = $2
       WHERE id = $3
       RETURNING *`,
      [isMaintenance, isMaintenance ? 'MAINTENANCE' : 'FREE', id]
    )

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

// DELETE /api/machines/:id — admin: remove a machine (only if not in active use)
export const deleteMachine = async (req, res) => {
  try {
    const { id } = req.params

    const machine = await pool.query('SELECT * FROM machines WHERE id = $1', [id])
    if (machine.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' })
    }

    // Safety: don't delete a machine that's currently in use or reserved
    if (['ENGAGED', 'RESERVED'].includes(machine.rows[0].status)) {
      return res.status(400).json({
        error: 'Cannot remove a machine that is in use or reserved. Wait until it is free.',
      })
    }

    // Clean up any waitlist entries pointing at this machine, then delete
    await pool.query('DELETE FROM waitlist WHERE machine_id = $1', [id])
    await pool.query('DELETE FROM machines WHERE id = $1', [id])

    io.emit('machine-status-update', { machineId: id, deleted: true })

    res.status(200).json({ success: true, message: 'Machine removed' })
  } catch (error) {
    console.error('deleteMachine error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}