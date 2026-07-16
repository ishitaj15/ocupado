import express from 'express'
import {
  createMachine,
  getMachines,
  startWash,
  endWash,
  toggleMaintenance,
  deleteMachine
} from '../controllers/machineController.js'
import { verifyToken, verifyAdminToken } from '../middleware/auth.js'

import { confirmMachine } from '../controllers/waitlistController.js'

const router = express.Router()

// Admin only
router.post('/', verifyAdminToken, createMachine)
router.patch('/:id/maintenance', verifyAdminToken, toggleMaintenance)
router.delete('/:id', verifyAdminToken, deleteMachine)

// Public
router.get('/', getMachines)


// Logged-in users only (identity comes from JWT via verifyToken)
router.post('/:id/start-wash', verifyToken, startWash)
router.post('/:id/end-wash', verifyToken, endWash)
router.post('/:id/confirm', verifyToken, confirmMachine)



export default router