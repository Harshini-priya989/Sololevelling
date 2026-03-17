import { Awakening } from '../models/Awakening.js'
import { GameProfile } from '../models/GameProfile.js'
import { Habit } from '../models/Habit.js'
import { Quest } from '../models/Quest.js'
import { Reward } from '../models/Reward.js'
import { DEFAULT_REWARDS, FIXED_HABIT_TEMPLATES, FIXED_QUEST_TEMPLATES, createDefaultState } from '../constants/gameDefaults.js'
import { toDateKey } from './gameMath.js'

export const ensureGameDataForUser = async (userId) => {
  const defaultState = createDefaultState()
  const profile = await GameProfile.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, ...defaultState, defaultsInstalled: false } },
    { upsert: true, new: true }
  )

  if (!profile.defaultsInstalled) {
    const [habitCount, questCount, rewardCount] = await Promise.all([
      Habit.countDocuments({ user: userId }),
      Quest.countDocuments({ user: userId }),
      Reward.countDocuments({ user: userId }),
    ])

    if (habitCount || questCount || rewardCount) {
      profile.defaultsInstalled = true
      await profile.save()
    } else {
      const now = new Date().toISOString()
      const today = toDateKey()

      await Habit.insertMany(
        FIXED_HABIT_TEMPLATES.map((template) => ({
          user: userId,
          habitId: template.id,
          title: template.title,
          xpReward: template.xpReward,
          xpPenalty: template.xpPenalty,
          required: false,
          locked: false,
          category: 'Starter',
          notes: '',
          streak: 0,
          history: {},
          lastCompleted: '',
          createdAt: now,
          updatedAt: now,
        }))
      )

      await Quest.insertMany(
        FIXED_QUEST_TEMPLATES.map((template) => ({
          user: userId,
          questId: template.id,
          title: template.title,
          difficulty: template.difficulty,
          category: 'Starter',
          questType: 'daily',
          notes: '',
          xp: template.xp,
          gold: template.gold,
          deadline: today,
          status: 'active',
          completedAt: null,
          failedAt: null,
          createdAt: now,
          updatedAt: now,
        }))
      )

      await Reward.insertMany(
        DEFAULT_REWARDS.map((template) => ({
          user: userId,
          rewardId: template.id,
          title: template.title,
          description: template.description,
          category: 'Starter',
          cost: template.cost,
          cooldownDays: template.cooldownDays,
          redeemCount: 0,
          lastRedeemedAt: '',
        }))
      )

      profile.defaultsInstalled = true
      await profile.save()
    }
  }

  await Awakening.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, vision: '', antiVision: '' } },
    { upsert: true, new: true }
  )
}
