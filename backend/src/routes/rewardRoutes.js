import { Router } from 'express'
import { getRewards, redeemReward } from '../controllers/rewardController.js'

const router = Router()

router.get('/', getRewards)
router.post('/:rewardId/redeem', redeemReward)

export default router
