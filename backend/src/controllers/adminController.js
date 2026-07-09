import pool from '../db/index.js'

export const getAnalytics = async (req, res) => {
  try {
    // Total machines
    const machinesResult = await pool.query('SELECT COUNT(*) FROM machines')
    const totalMachines = parseInt(machinesResult.rows[0].count)

    // Available machines
    const availableResult = await pool.query(
      "SELECT COUNT(*) FROM machines WHERE status = 'FREE' AND is_maintenance = FALSE"
    )
    const available = parseInt(availableResult.rows[0].count)

    // In use machines
    const inUseResult = await pool.query(
      "SELECT COUNT(*) FROM machines WHERE status = 'ENGAGED'"
    )
    const inUse = parseInt(inUseResult.rows[0].count)

    // Students waiting
    const waitingResult = await pool.query(
      "SELECT COUNT(*) FROM waitlist WHERE status = 'WAITING'"
    )
    const studentsWaiting = parseInt(waitingResult.rows[0].count)

    // Maintenance machines
    const maintenanceResult = await pool.query(
      "SELECT COUNT(*) FROM machines WHERE is_maintenance = TRUE"
    )
    const maintenance = parseInt(maintenanceResult.rows[0].count)

    // All machines with status
    const machinesList = await pool.query(
      `SELECT m.*, s.name as current_user_name 
       FROM machines m
       LEFT JOIN students s ON m.current_user_id = s.id
       ORDER BY m.name ASC`
    )

    res.status(200).json({
      success: true,
      analytics: {
        totalMachines,
        available,
        inUse,
        studentsWaiting,
        maintenance,
        machines: machinesList.rows
      }
    })
  } catch (error) {
    console.error('getAnalytics error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}