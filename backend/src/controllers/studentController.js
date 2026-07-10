import pool from '../db/index.js'

// GET /api/students/:id/status
// Returns this student's active wash + their waitlist entries (with machine info)
export const getStudentStatus = async (req, res) => {
  try {
    const { id } = req.params

    // 1. Active wash — is this student currently running a machine?
    const activeWash = await pool.query(
      `SELECT id, name, status, wash_duration, started_at, ends_at
       FROM machines
       WHERE current_user_id = $1 AND status = 'ENGAGED'`,
      [id]
    )

    // 2. Waitlist entries — machines this student is queued for
    const waitlist = await pool.query(
      `SELECT w.id, w.machine_id, w.position, w.status, w.joined_at,
              m.name AS machine_name, m.status AS machine_status
       FROM waitlist w
       JOIN machines m ON w.machine_id = m.id
       WHERE w.student_id = $1
         AND w.status IN ('WAITING', 'NOTIFIED', 'CONFIRMED')
       ORDER BY w.joined_at DESC`,
      [id]
    )

    res.status(200).json({
      success: true,
      activeWash: activeWash.rows[0] || null,
      waitlist: waitlist.rows,
    })
  } catch (error) {
    console.error('getStudentStatus error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}