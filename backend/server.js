import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/authRoutes.js'
import transactionRoutes from './routes/transactionRoute.js'
import budgetRoutes from './routes/budgetRoute.js'
import objectifRoutes from './routes/objectifRoute.js'
import echeanceRoutes from './routes/echeanceRoute.js'
import notificationRoutes from './routes/notificationRoute.js'
import reportRoutes from './routes/reportRoute.js'
import { initMonthlyReportScheduler } from './services/monthlyReportScheduler.js'

dotenv.config()

import pool from './config/db.js'

async function ensureDatabaseReady() {
  try {
    await pool.query('SELECT 1 FROM users LIMIT 1')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('success', 'error', 'warning', 'info')),
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS monthly_reports_sent (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        sent_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, year, month)
      )
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_monthly_reports_user ON monthly_reports_sent(user_id)
    `)
  } catch (error) {
    console.error('⚠️ Vérification DB impossible:', error.message)
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
app.use('/api/notifications', notificationRoutes)
app.use('/api/reports', reportRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, async () => {
    await ensureDatabaseReady()
    initMonthlyReportScheduler()
    console.log(`Serveur lancé sur le port ${PORT}`)
})
