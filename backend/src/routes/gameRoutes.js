import { Router } from 'express'
import { exportData, getOverview, getState, hardResetGame, importData, resetGameSeason, syncStreak, updateProfile, updateSettings, updateStreak } from '../controllers/gameController.js'

const router = Router()

router.get('/overview', getOverview)
router.get('/state', getState)
router.put('/profile', updateProfile)
router.put('/settings', updateSettings)
router.patch('/streak', updateStreak)
router.post('/sync-streak', syncStreak)
router.post('/reset-season', resetGameSeason)
router.post('/hard-reset', hardResetGame)
router.get('/backup/export', exportData)
router.post('/backup/import', importData)

export default router
