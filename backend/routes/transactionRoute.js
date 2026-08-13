import express from 'express'
import { addTransaction, deleteTransaction, getExpenseByCategorie, getSummary, getTransaction, updateTransaction } from '../controllers/transactionController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect)

router.post('/', addTransaction)
router.get('/', getTransaction)
router.put('/:id', updateTransaction)
router.delete('/:id', deleteTransaction)
router.get('/summary', getSummary)
router.get('/categorie', getExpenseByCategorie)

export default router
