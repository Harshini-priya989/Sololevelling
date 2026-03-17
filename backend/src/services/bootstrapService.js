import { Awakening } from '../models/Awakening.js'
import { GameProfile } from '../models/GameProfile.js'
import { Habit } from '../models/Habit.js'
import { Quest } from '../models/Quest.js'
import { Reward } from '../models/Reward.js'
import { createDefaultState, DEFAULT_REWARDS, FIXED_HABIT_TEMPLATES, FIXED_QUEST_TEMPLATES } from '../constants/gameDefaults.js'
import { toDateKey } from './gameMath.js'

export const ensureGameDataForUser = async (userId) => {
  const defaultState = createDefaultState()

  await GameProfile.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, ...defaultState } },
    { upsert: true, new: true }
  )

  const existingHabits = await Habit.find({ user: userId }).lean()
  const habitsById = new Map(existingHabits.map((habit) => [habit.habitId, habit]))
  const habitOps = FIXED_HABIT_TEMPLATES.map((template) => ({
    updateOne: {
      filter: { user: userId, habitId: template.id },
      update: {
        $set: {
          title: template.title,
          xpReward: template.xpReward,
          xpPenalty: template.xpPenalty,
          required: true,
          locked: true,
          category: 'Fixed',
        },
        $setOnInsert: {
          user: userId,
          habitId: template.id,
          streak: habitsById.get(template.id)?.streak || 0,
          history: habitsById.get(template.id)?.history || {},
          lastCompleted: habitsById.get(template.id)?.lastCompleted || '',
        },
      },
      upsert: true,
    },
  }))
  if (habitOps.length) await Habit.bulkWrite(habitOps)

  const today = toDateKey()
  const existingQuests = await Quest.find({ user: userId }).lean()
  const questsById = new Map(existingQuests.map((quest) => [quest.questId, quest]))
  const questOps = FIXED_QUEST_TEMPLATES.map((template) => ({
    updateOne: {
      filter: { user: userId, questId: template.id },
      update: {
        $set: {
          title: template.title,
          difficulty: template.difficulty,
          xp: template.xp,
          gold: template.gold,
        },
        $setOnInsert: {
          user: userId,
          questId: template.id,
          deadline: questsById.get(template.id)?.deadline || today,
          status: questsById.get(template.id)?.status || 'active',
          completedAt: questsById.get(template.id)?.completedAt || null,
          failedAt: questsById.get(template.id)?.failedAt || null,
        },
      },
      upsert: true,
    },
  }))
  if (questOps.length) await Quest.bulkWrite(questOps)

  const existingRewards = await Reward.find({ user: userId }).lean()
  const rewardsById = new Map(existingRewards.map((reward) => [reward.rewardId, reward]))
  const rewardOps = DEFAULT_REWARDS.map((template) => ({
    updateOne: {
      filter: { user: userId, rewardId: template.id },
      update: {
        $set: {
          title: template.title,
          description: template.description,
          cost: template.cost,
          cooldownDays: template.cooldownDays,
        },
        $setOnInsert: {
          user: userId,
          rewardId: template.id,
          redeemCount: rewardsById.get(template.id)?.redeemCount || 0,
          lastRedeemedAt: rewardsById.get(template.id)?.lastRedeemedAt || '',
        },
      },
      upsert: true,
    },
  }))
  if (rewardOps.length) await Reward.bulkWrite(rewardOps)

  await Awakening.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, vision: '', antiVision: '' } },
    { upsert: true, new: true }
  )
}
