import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/authRoutes.js'
import transactionRoutes from './routes/transactionRoute.js'
import budgetRoutes from './routes/budgetRoute.js'
import objectifRoutes from './routes/objectifRoute.js'
import echeanceRoutes from './routes/echeanceRoute.js'

dotenv.config()

const app = express()

app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5175'],
    credentials: true
}))
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/objectifs', objectifRoutes)
app.use('/api/echeances', echeanceRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`)
})
