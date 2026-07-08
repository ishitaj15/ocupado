import express from 'express'
import {
  createMachine,
  getMachines,
  updateMachineStatus
} from '../controllers/machineController.js'
import { verifyAdminToken } from '../middleware/auth.js'
import { updateMachineStatusSync } from '../controllers/machineSyncController.js'

const router = express.Router()

// Admin only — create machine
router.post('/', verifyAdminToken, createMachine)

// Public — get all machines
router.get('/', getMachines)

// Async version — actual production route
router.patch('/:id/status', updateMachineStatus)

// Sync version — for load test comparison only
router.patch('/:id/status/sync', updateMachineStatusSync)

export default router