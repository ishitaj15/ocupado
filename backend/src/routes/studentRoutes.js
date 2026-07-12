import express from 'express'
import { getStudentStatus, getAllStudents, deleteStudent } from '../controllers/studentController.js'
import { verifyToken, verifyAdminToken } from '../middleware/auth.js'

const router = express.Router()

// Admin: list all registered students
router.get('/', verifyAdminToken, getAllStudents)

// Admin: remove a student
router.delete('/:id', verifyAdminToken, deleteStudent)

// Any logged-in user can check their own status
router.get('/:id/status', verifyToken, getStudentStatus)

export default router