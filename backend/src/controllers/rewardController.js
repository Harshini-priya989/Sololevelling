import { Reward } from '../models/Reward.js'
import { RewardLog } from '../models/RewardLog.js'
import { applyGoldTransaction, getProfileOrThrow } from '../services/gameStateService.js'
import { toDateKey } from '../services/gameMath.js'

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

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

export const createReward = async (req, res, next) => {
  try {
    const reward = await Reward.create({
      user: req.user._id,
      rewardId: createId('reward'),
      title: String(req.body.title || '').trim(),
      description: String(req.body.description || '').trim(),
      category: String(req.body.category || 'General').trim() || 'General',
      cost: Number(req.body.cost || 50),
      cooldownDays: Number(req.body.cooldownDays || 1),
      redeemCount: 0,
      lastRedeemedAt: '',
    })
    res.status(201).json({ reward })
  } catch (error) {
    next(error)
  }
}

export const updateReward = async (req, res, next) => {
  try {
    const reward = await Reward.findOne({ user: req.user._id, rewardId: req.params.rewardId })
    if (!reward) return res.status(404).json({ message: 'Reward not found' })

    reward.title = String(req.body.title ?? reward.title).trim() || reward.title
    reward.description = String(req.body.description ?? reward.description).trim()
    reward.category = String(req.body.category ?? reward.category).trim() || reward.category
    reward.cost = Number(req.body.cost ?? reward.cost)
    reward.cooldownDays = Number(req.body.cooldownDays ?? reward.cooldownDays)
    await reward.save()

    res.json({ reward })
  } catch (error) {
    next(error)
  }
}

export const deleteReward = async (req, res, next) => {
  try {
    const deleted = await Reward.findOneAndDelete({ user: req.user._id, rewardId: req.params.rewardId })
    if (!deleted) return res.status(404).json({ message: 'Reward not found' })
    res.json({ message: 'Reward deleted' })
  } catch (error) {
    next(error)
  }
}

export const redeemReward = async (req, res, next) => {
  try {
    const reward = await Reward.findOne({ user: req.user._id, rewardId: req.params.rewardId })
    if (!reward) return res.status(404).json({ message: 'Reward not found' })

    const cooldown = getCooldownInfo(reward)
    if (cooldown.onCooldown) return res.status(400).json({ message: `Reward on cooldown for ${cooldown.hoursRemaining} more hour(s)` })

    const profile = await getProfileOrThrow(req.user._id)
    if (profile.gold < reward.cost) return res.status(400).json({ message: 'Not enough gold' })

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
