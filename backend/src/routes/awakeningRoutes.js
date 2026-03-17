import { Router } from 'express'
import { getAwakening, updateAwakening } from '../controllers/awakeningController.js'

const router = Router()

router.get('/', getAwakening)
router.put('/', updateAwakening)

export default router
