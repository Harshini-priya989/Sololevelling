import { Router } from 'express'
import { completeQuest, createQuest, deleteQuest, failQuest, getQuests, setFocusQuest, updateQuest } from '../controllers/questController.js'

const router = Router()

router.get('/', getQuests)
router.post('/', createQuest)
router.put('/:questId', updateQuest)
router.delete('/:questId', deleteQuest)
router.patch('/:questId/complete', completeQuest)
router.patch('/:questId/fail', failQuest)
router.patch('/:questId/focus', setFocusQuest)

export default router
