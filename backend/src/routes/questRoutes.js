import { Router } from 'express'
import { completeQuest, failQuest, getQuests, setFocusQuest } from '../controllers/questController.js'

const router = Router()

router.get('/', getQuests)
router.patch('/:questId/complete', completeQuest)
router.patch('/:questId/fail', failQuest)
router.patch('/:questId/focus', setFocusQuest)

export default router
