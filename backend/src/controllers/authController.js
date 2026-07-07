import pool from '../db/index.js'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

// Register student
export const register = async (req, res) => {
  try {
    const { name, phone } = req.body

    if (!name || !phone) {
      return res.status(400).json({ 
        error: 'Name and phone are required' 
      })
    }

    // Check if already registered
    const existing = await pool.query(
      'SELECT * FROM students WHERE phone = $1',
      [phone]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Phone number already registered' 
      })
    }

    // Create student
    const result = await pool.query(
      'INSERT INTO students (id, name, phone) VALUES ($1, $2, $3) RETURNING *',
      [uuidv4(), name, phone]
    )

    const student = result.rows[0]

    // Generate JWT
    const token = jwt.sign(
      { id: student.id, phone: student.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({ 
      success: true, 
      token,
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone
      }
    })
  } catch (error) {
    console.error('register error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Login student
export const login = async (req, res) => {
  try {
    const { phone } = req.body

    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' })
    }

    const result = await pool.query(
      'SELECT * FROM students WHERE phone = $1',
      [phone]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Phone number not registered' 
      })
    }

    const student = result.rows[0]

    // Generate JWT
    const token = jwt.sign(
      { id: student.id, phone: student.phone },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(200).json({ 
      success: true, 
      token,
      student: {
        id: student.id,
        name: student.name,
        phone: student.phone
      }
    })
  } catch (error) {
    console.error('login error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}