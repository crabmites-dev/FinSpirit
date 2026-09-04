import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getHistorySummary,
  getMonthlyDetail,
  sendMonthlyEmail
} from '../controllers/reportController.js';

const router = express.Router();

router.use(protect);

router.get('/history', getHistorySummary);
router.get('/monthly', getMonthlyDetail);
router.post('/send-email', sendMonthlyEmail);

export default router;
