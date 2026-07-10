import express from 'express'
import { getStudentStatus } from '../controllers/studentController.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Any logged-in user can check their own status
router.get('/:id/status', verifyToken, getStudentStatus)

export default router