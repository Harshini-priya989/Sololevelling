import { Router } from 'express'
import { createReward, deleteReward, getRewards, redeemReward, updateReward } from '../controllers/rewardController.js'

const router = Router()

router.get('/', getRewards)
router.post('/', createReward)
router.put('/:rewardId', updateReward)
router.delete('/:rewardId', deleteReward)
router.post('/:rewardId/redeem', redeemReward)

export default router
