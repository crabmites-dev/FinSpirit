import express from 'express';
import { getObjectifs, addObjectif, updateObjectif, addFunds, deleteObjectif } from '../controllers/objectifController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getObjectifs);
router.post('/', addObjectif);
router.put('/:id', updateObjectif);
router.patch('/:id/funds', addFunds);
router.delete('/:id', deleteObjectif);

export default router;
