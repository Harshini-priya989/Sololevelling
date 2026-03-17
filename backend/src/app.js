import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import authRoutesModule from './routes/authRoutes.js'
import awakeningRoutesModule from './routes/awakeningRoutes.js'
import gameRoutesModule from './routes/gameRoutes.js'
import habitRoutesModule from './routes/habitRoutes.js'
import questRoutesModule from './routes/questRoutes.js'
import rewardRoutesModule from './routes/rewardRoutes.js'
import { requireAuth } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { ensureGameDataForUser } from './services/bootstrapService.js'

const resolveRouter = (moduleValue) => moduleValue?.default || moduleValue

const authRoutes = resolveRouter(authRoutesModule)
const awakeningRoutes = resolveRouter(awakeningRoutesModule)
const gameRoutes = resolveRouter(gameRoutesModule)
const habitRoutes = resolveRouter(habitRoutesModule)
const questRoutes = resolveRouter(questRoutesModule)
const rewardRoutes = resolveRouter(rewardRoutesModule)

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
