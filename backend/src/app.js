import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import authRoutes from './routes/authRoutes.js'
import awakeningRoutes from './routes/awakeningRoutes.js'
import gameRoutes from './routes/gameRoutes.js'
import habitRoutes from './routes/habitRoutes.js'
import questRoutes from './routes/questRoutes.js'
import rewardRoutes from './routes/rewardRoutes.js'
import { requireAuth } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { ensureGameDataForUser } from './services/bootstrapService.js'

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.clientUrls.includes(origin)) return callback(null, true)
    return callback(new Error('CORS origin not allowed'))
  },
  credentials: true,
}))
app.use(helmet())
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'solo-leveling-system-backend', origins: env.clientUrls })
})

app.use('/api/auth', authRoutes)
app.use('/api', requireAuth, async (req, res, next) => {
  try {
    await ensureGameDataForUser(req.user._id)
    next()
  } catch (error) {
    next(error)
  }
})
app.use('/api/game', gameRoutes)
app.use('/api/habits', habitRoutes)
app.use('/api/quests', questRoutes)
app.use('/api/rewards', rewardRoutes)
app.use('/api/awakening', awakeningRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
