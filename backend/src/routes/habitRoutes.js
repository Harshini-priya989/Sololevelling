import { Router } from 'express'
import { completeHabit, createHabit, deleteHabit, getHabits, updateHabit } from '../controllers/habitController.js'

const router = Router()

router.get('/', getHabits)
router.post('/', createHabit)
router.put('/:habitId', updateHabit)
router.delete('/:habitId', deleteHabit)
router.patch('/:habitId/complete', completeHabit)

export default router
