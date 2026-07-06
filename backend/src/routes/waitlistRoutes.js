import express from 'express'
import {
  joinWaitlist,
  confirmMachine
} from '../controllers/waitlistController.js'

const router = express.Router()

// Join waitlist for a machine
router.post('/:machineId/waitlist', joinWaitlist)

// Confirm machine reservation
router.post('/:machineId/confirm', confirmMachine)

export default router
