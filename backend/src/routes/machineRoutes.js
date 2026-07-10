import express from 'express'
import {
  createMachine,
  getMachines,
  updateMachineStatus,
  startWash,
  endWash,
  toggleMaintenance,
  getMachineQueue
} from '../controllers/machineController.js'
import { verifyToken, verifyAdminToken } from '../middleware/auth.js'
import { updateMachineStatusSync } from '../controllers/machineSyncController.js'
import { joinWaitlist, confirmMachine } from '../controllers/waitlistController.js'

const router = express.Router()

// Admin only
router.post('/', verifyAdminToken, createMachine)
router.patch('/:id/maintenance', verifyAdminToken, toggleMaintenance)

// Public
router.get('/', getMachines)
router.get('/:id/queue', getMachineQueue)
router.patch('/:id/status', updateMachineStatus)

// Logged-in users only (identity comes from JWT via verifyToken)
router.post('/:id/start-wash', verifyToken, startWash)
router.post('/:id/end-wash', verifyToken, endWash)
router.post('/:id/waitlist', verifyToken, joinWaitlist)
router.post('/:id/confirm', verifyToken, confirmMachine)

// Load test only
router.patch('/:id/status/sync', updateMachineStatusSync)

export default router