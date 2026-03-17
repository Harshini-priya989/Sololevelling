import { Reward } from '../models/Reward.js'
import { RewardLog } from '../models/RewardLog.js'
import { applyGoldTransaction, getProfileOrThrow } from '../services/gameStateService.js'
import { toDateKey } from '../services/gameMath.js'

const getCooldownInfo = (reward) => {
  if (!reward.lastRedeemedAt) return { onCooldown: false, hoursRemaining: 0 }
  const cooldownMs = (reward.cooldownDays || 1) * 24 * 60 * 60 * 1000
  const nextAvailable = new Date(reward.lastRedeemedAt).getTime() + cooldownMs
  const remaining = nextAvailable - Date.now()
  if (remaining <= 0) return { onCooldown: false, hoursRemaining: 0 }
  return { onCooldown: true, hoursRemaining: Math.ceil(remaining / (1000 * 60 * 60)) }
}

export const getRewards = async (req, res, next) => {
  try {
    const rewards = await Reward.find({ user: req.user._id }).sort({ createdAt: 1 }).lean()
    const rewardLog = await RewardLog.find({ user: req.user._id }).sort({ createdAt: -1 }).lean()
    res.json({ rewards, rewardLog })
  } catch (error) {
    next(error)
  }
}

export const redeemReward = async (req, res, next) => {
  try {
    const reward = await Reward.findOne({ user: req.user._id, rewardId: req.params.rewardId })
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' })
    }

    const cooldown = getCooldownInfo(reward)
    if (cooldown.onCooldown) {
      return res.status(400).json({ message: `Reward on cooldown for ${cooldown.hoursRemaining} more hour(s)` })
    }

    const profile = await getProfileOrThrow(req.user._id)
    if (profile.gold < reward.cost) {
      return res.status(400).json({ message: 'Not enough gold' })
    }

    const now = new Date().toISOString()
    applyGoldTransaction(profile, -reward.cost, { trackHistory: true, dateKey: toDateKey(now) })
    reward.redeemCount += 1
    reward.lastRedeemedAt = now

    await Promise.all([
      profile.save(),
      reward.save(),
      RewardLog.create({ user: req.user._id, rewardId: reward.rewardId, title: reward.title, cost: reward.cost, at: now }),
    ])

    res.json({ message: 'Reward redeemed', reward, state: profile })
  } catch (error) {
    next(error)
  }
}
