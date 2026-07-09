import express from 'express'
import {
  createMachine,
  getMachines,
  updateMachineStatus,
  startWash,
  endWash,
  toggleMaintenance
} from '../controllers/machineController.js'
import { verifyAdminToken } from '../middleware/auth.js'
import { updateMachineStatusSync } from '../controllers/machineSyncController.js'

const router = express.Router()

// Admin only
router.post('/', verifyAdminToken, createMachine)
router.patch('/:id/maintenance', verifyAdminToken, toggleMaintenance)

// Public
router.get('/', getMachines)
router.patch('/:id/status', updateMachineStatus)
router.post('/:id/start-wash', startWash)
router.post('/:id/end-wash', endWash)

// Waitlist
router.post('/:id/waitlist', (await import('../controllers/waitlistController.js')).joinWaitlist)
router.post('/:id/confirm', (await import('../controllers/waitlistController.js')).confirmMachine)

// Load test only
router.patch('/:id/status/sync', updateMachineStatusSync)

export default router