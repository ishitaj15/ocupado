import pool from '../db/index.js'

// SYNCHRONOUS version — does everything on request thread
// This is v1 — intentionally slow for load test comparison
export const updateMachineStatusSync = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['FREE', 'ENGAGED', 'RESERVED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    // Simulate heavy synchronous processing
    // In real app this would be matching logic running on request thread
    await new Promise(resolve => setTimeout(resolve, 3000)) // 3 second delay

    const result = await pool.query(
      'UPDATE machines SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Machine not found' })
    }

    res.status(200).json({ 
      success: true, 
      machine: result.rows[0],
      version: 'sync-v1'
    })
  } catch (error) {
    console.error('updateMachineStatusSync error:', error.message)
    res.status(500).json({ error: 'Internal server error' })
  }
}