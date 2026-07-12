import express from 'express'
import { joinWaitlist } from '../controllers/waitlistController.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Join the global queue (any machine, whichever frees first)
router.post('/join', verifyToken, joinWaitlist)

export default router