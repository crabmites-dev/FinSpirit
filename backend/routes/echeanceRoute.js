import express from 'express';
import { getEcheances, addEcheance, updateEcheance, togglePaid, deleteEcheance } from '../controllers/echeanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getEcheances);
router.post('/', addEcheance);
router.put('/:id', updateEcheance);
router.patch('/:id/toggle-paid', togglePaid);
router.delete('/:id', deleteEcheance);

export default router;
