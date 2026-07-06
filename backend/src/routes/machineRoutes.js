import express from 'express'
import {
  createMachine,
  getMachines,
  updateMachineStatus
} from '../controllers/machineController.js'
import { verifyAdminToken } from '../middleware/auth.js'

const router = express.Router()

// Admin only — create machine
router.post('/', verifyAdminToken, createMachine)

// Public — get all machines
router.get('/', getMachines)

// Update machine status
router.patch('/:id/status', updateMachineStatus)

export default router