import pool from '../db/index.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

// Helper — build the JWT payload (name + role included so frontend needs no extra call)
const generateToken = (student) => {
  return jwt.sign(
    {
      id: student.id,
      email: student.email,
      name: student.name,
      role: student.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Register student
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if email already registered
    const existing = await pool.query(
      'SELECT * FROM students WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash the password (never store plain text)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create student (role defaults to 'student')
    const result = await pool.query(
      `INSERT INTO students (id, name, email, password, role)
       VALUES ($1, $2, $3, $4, 'student') RETURNING *`,
      [uuidv4(), name, email, hashedPassword]
    )

    const student = result.rows[0]
    const token = generateToken(student)

    res.status(201).json({
      success: true,
      token,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role,
      },
    })
  } catch (error) {
    console.error('register error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Login student
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await pool.query(
      'SELECT * FROM students WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const student = result.rows[0]

    // Compare submitted password against the stored hash
    const isMatch = await bcrypt.compare(password, student.password)

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = generateToken(student)

    res.status(200).json({
      success: true,
      token,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role,
      },
    })
  } catch (error) {
    console.error('login error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}