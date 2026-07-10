import express from 'express'
import { register, login } from '../controllers/authController.js'
import { verifyAdminToken } from '../middleware/auth.js'

const router = express.Router()

// Admin-only: only a logged-in admin can create student accounts (Flow B)
router.post('/register', verifyAdminToken, register)

// Public: anyone with an account can log in
router.post('/login', login)

export default router