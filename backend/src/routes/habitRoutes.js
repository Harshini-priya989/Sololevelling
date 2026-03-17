import { Router } from 'express'
import { completeHabit, getHabits } from '../controllers/habitController.js'

const router = Router()

router.get('/', getHabits)
router.patch('/:habitId/complete', completeHabit)

export default router
