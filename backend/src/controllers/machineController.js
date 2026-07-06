import pool from '../db/index.js'
import Machine from '../models/Machine.js'
import { v4 as uuidv4 } from 'uuid'

// Admin: Create a new machine
export const createMachine = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Machine name is required' })
    }

    const result = await pool.query(
      'INSERT INTO machines (id, name, status) VALUES ($1, $2, $3) RETURNING *',
      [uuidv4(), name, 'FREE']
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

    if (!['FREE', 'ENGAGED', 'RESERVED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const result = await pool.query(
      'UPDATE machines SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' })
    }

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