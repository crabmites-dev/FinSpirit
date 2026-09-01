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

import pool from './config/db.js'

dotenv.config()

async function ensureDatabaseReady() {
  try {
    await pool.query('SELECT 1 FROM users LIMIT 1')
  } catch {
    console.log('⚠️  Tables absentes — lancez: npm run db:migrate')
  }
}

const app = express()

app.use(express.json())
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5175',
    process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) return callback(null, true)
        // Autorise l'accès depuis le réseau local (ex. téléphone : http://192.168.x.x:5173)
        if (/^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)) return callback(null, true)
        if (/^http:\/\/10\.\d+\.\d+\.\d+:\d+$/.test(origin)) return callback(null, true)
        callback(new Error('Non autorisé par CORS'))
    },
    credentials: true
}))
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/objectifs', objectifRoutes)
app.use('/api/echeances', echeanceRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, async () => {
    await ensureDatabaseReady()
    console.log(`Serveur lancé sur le port ${PORT}`)
})
