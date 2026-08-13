import express from 'express'
import { register, login, getMe, logout, forgotPassword, resetPassword, deleteSampleData, checkSampleData } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.post('/forgotPassword', forgotPassword)
router.post('/resetPassword', resetPassword)

router.get('/getMe', protect, getMe)
router.get('/sample-data', protect, checkSampleData)
router.delete('/sample-data', protect, deleteSampleData)

export default router
