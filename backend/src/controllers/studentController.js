import pool from '../db/index.js'

// GET /api/students/:id/status
// Returns this student's active washes + their global queue entry
export const getStudentStatus = async (req, res) => {
  try {
    const { id } = req.params

    // 1. Active washes — ALL machines this student is currently running (can be up to 2)
    const activeWash = await pool.query(
      `SELECT id, name, status, wash_duration, started_at, ends_at
       FROM machines
       WHERE current_user_id = $1 AND status = 'ENGAGED'
       ORDER BY ends_at ASC`,
      [id]
    )

    // 2. Queue entry — student's spot in the GLOBAL queue (machine_id may be null while WAITING)
    const waitlist = await pool.query(
      `SELECT w.id, w.machine_id, w.position, w.status, w.joined_at,
              w.notified_at, w.confirmed_at,
              m.name AS machine_name
       FROM waitlist w
       LEFT JOIN machines m ON w.machine_id = m.id
       WHERE w.student_id = $1
         AND w.status IN ('WAITING', 'NOTIFIED', 'CONFIRMED')
       ORDER BY w.joined_at DESC`,
      [id]
    )

    // For WAITING entries, compute live position in the global queue
    const entries = []
    for (const entry of waitlist.rows) {
      let livePosition = entry.position
      if (entry.status === 'WAITING') {
        const ahead = await pool.query(
          `SELECT COUNT(*) FROM waitlist 
           WHERE status = 'WAITING' AND joined_at < $1`,
          [entry.joined_at]
        )
        livePosition = parseInt(ahead.rows[0].count) + 1
      }
      entries.push({ ...entry, position: livePosition })
    }

    res.status(200).json({
      success: true,
      activeWashes: activeWash.rows,        // now an ARRAY (both machines)
      activeWash: activeWash.rows[0] || null, // kept for backward compat
      waitlist: entries,
    })
  } catch (error) {
    console.error('getStudentStatus error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// GET /api/students — admin: list all registered students
export const getAllStudents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM students
       ORDER BY created_at DESC`
    )
    res.status(200).json({ success: true, students: result.rows })
  } catch (error) {
    console.error('getAllStudents error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// DELETE /api/students/:id — admin: remove a student (e.g. left the hostel)
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params

    // Can't delete yourself (prevents locking yourself out)
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot remove your own account' })
    }

    const student = await pool.query('SELECT * FROM students WHERE id = $1', [id])
    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Safety guard: don't delete a student who is currently holding a machine
    const active = await pool.query(
      `SELECT COUNT(*) FROM machines
       WHERE current_user_id = $1 AND status IN ('ENGAGED', 'RESERVED')`,
      [id]
    )
    if (parseInt(active.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'This student is currently using a machine. Free it before removing them.',
      })
    }

    // Clean up any queue entries, then delete the student
    await pool.query('DELETE FROM waitlist WHERE student_id = $1', [id])
    await pool.query('DELETE FROM students WHERE id = $1', [id])

    res.status(200).json({ success: true, message: 'Student removed' })
  } catch (error) {
    console.error('deleteStudent error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}