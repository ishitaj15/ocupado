import express from 'express'
import { getAnalytics } from '../controllers/adminController.js'
import { verifyAdminToken } from '../middleware/auth.js'

const router = express.Router()

router.get('/analytics', verifyAdminToken, getAnalytics)

export default router
