import { createDefaultState } from '../constants/gameDefaults.js'
import { ensureGameDataForUser } from './bootstrapService.js'
import { Awakening } from '../models/Awakening.js'
import { GameProfile } from '../models/GameProfile.js'
import { Habit } from '../models/Habit.js'
import { Quest } from '../models/Quest.js'
import { Reward } from '../models/Reward.js'
import { RewardLog } from '../models/RewardLog.js'
import { applyXpChange, clampInt, clampNumber, mergeDailyHistory, normalizeSeverity, penaltyBySeverity, rankFromLevel, toDateKey } from './gameMath.js'

const DEFAULT_PROFILE = createDefaultState().profile
const DEFAULT_SETTINGS = createDefaultState().settings

const normalizeProfile = (profile = {}) => ({
  playerName: String(profile.playerName || DEFAULT_PROFILE.playerName).trim() || DEFAULT_PROFILE.playerName,
  title: String(profile.title || DEFAULT_PROFILE.title).trim() || DEFAULT_PROFILE.title,
})

const normalizeSettings = (settings = {}) => {
  const themeMode = settings.themeMode === 'light' ? 'light' : 'dark'
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    xpMultiplier: Math.max(0.5, Math.min(2, clampNumber(settings.xpMultiplier, DEFAULT_SETTINGS.xpMultiplier))),
    penaltySeverity: normalizeSeverity(settings.penaltySeverity || DEFAULT_SETTINGS.penaltySeverity),
    dailyXpCapEnabled: Boolean(settings.dailyXpCapEnabled),
    dailyXpCap: Math.max(0, clampInt(settings.dailyXpCap, 0, 5000)),
    habitPenalties: settings.habitPenalties ?? DEFAULT_SETTINGS.habitPenalties,
    streakResetOnMiss: settings.streakResetOnMiss ?? DEFAULT_SETTINGS.streakResetOnMiss,
    habitReminder: settings.habitReminder ?? DEFAULT_SETTINGS.habitReminder,
    questPenalties: settings.questPenalties ?? DEFAULT_SETTINGS.questPenalties,
    autoFailOverdueQuests: settings.autoFailOverdueQuests ?? DEFAULT_SETTINGS.autoFailOverdueQuests,
    darkMode: settings.darkMode ?? themeMode !== 'light',
    themeMode,
    glowIntensity: clampInt(settings.glowIntensity, 0, 100),
    reduceAnimations: settings.reduceAnimations ?? DEFAULT_SETTINGS.reduceAnimations,
    streakWarnings: settings.streakWarnings ?? DEFAULT_SETTINGS.streakWarnings,
    dailyGoalReminders: settings.dailyGoalReminders ?? DEFAULT_SETTINGS.dailyGoalReminders,
  }
}

export const getProfileOrThrow = async (userId) => {
  const profile = await GameProfile.findOne({ user: userId })
  if (!profile) throw new Error('Game profile not initialized')
  return profile
}

export const applyXpTransaction = (profile, requestedDelta, options = {}) => {
  const settings = normalizeSettings(profile.settings)
  const dateKey = options.dateKey || toDateKey()
  let delta = clampNumber(requestedDelta, 0)

  if (delta > 0) {
    if (!options.ignoreMultiplier) delta *= settings.xpMultiplier
    delta = Math.round(Math.max(0, delta))
    if (settings.dailyXpCapEnabled && !options.ignoreDailyCap) {
      const todayHistory = profile.dailyHistory?.[dateKey] || {}
      const remaining = Math.max(0, settings.dailyXpCap - clampNumber(todayHistory.xpGained, 0))
      delta = Math.min(delta, remaining)
    }
  } else if (delta < 0) {
    let loss = Math.abs(delta)
    if (!options.ignorePenaltyScale) loss *= penaltyBySeverity[settings.penaltySeverity] || 1
    delta = -Math.round(Math.max(0, loss))
  }

  if (!delta) return 0

  const next = applyXpChange({ xp: profile.xp, level: profile.level }, delta)
  profile.xp = next.xp
  profile.level = next.level
  profile.rank = rankFromLevel(next.level)
  profile.longestStreak = Math.max(profile.longestStreak || 0, profile.streak || 0)

  if (delta > 0 && options.countTotals !== false) profile.totalXPEarned += delta
  if (delta < 0 && options.countTotals !== false) profile.totalXPLost += Math.abs(delta)

  if (options.trackHistory) {
    profile.dailyHistory = mergeDailyHistory(profile.dailyHistory, dateKey, {
      xpGainedDelta: Math.max(0, delta),
      xpLostDelta: Math.max(0, -delta),
      ...(options.historyPatch || {}),
    })
  }

  return delta
}

export const applyGoldTransaction = (profile, requestedDelta, options = {}) => {
  const delta = clampNumber(requestedDelta, 0)
  if (!delta) return 0

  let appliedDelta = delta
  if (delta < 0) appliedDelta = -Math.min(profile.gold, Math.abs(delta))

  profile.gold = Math.max(0, profile.gold + appliedDelta)
  if (appliedDelta > 0 && options.countTotals !== false) profile.totalGoldEarned += appliedDelta
  if (appliedDelta < 0 && options.countTotals !== false) profile.totalGoldSpent += Math.abs(appliedDelta)

  if (options.trackHistory) {
    profile.dailyHistory = mergeDailyHistory(profile.dailyHistory, options.dateKey || toDateKey(), {
      goldGainedDelta: Math.max(0, appliedDelta),
      goldSpentDelta: Math.max(0, -appliedDelta),
      ...(options.historyPatch || {}),
    })
  }

  return appliedDelta
}

export const syncCombinedStreak = async (userId) => {
  const [profile, habits] = await Promise.all([getProfileOrThrow(userId), Habit.find({ user: userId })])
  const combinedStreak = habits.reduce((total, habit) => total + (habit.streak || 0), 0)
  profile.streak = combinedStreak
  profile.longestStreak = Math.max(profile.longestStreak || 0, combinedStreak)
  await profile.save()
  return profile
}

export const setProfileStreak = async (userId, streakValue) => {
  const profile = await getProfileOrThrow(userId)
  profile.streak = Math.max(0, clampInt(streakValue, 0, 100000))
  profile.longestStreak = Math.max(profile.longestStreak || 0, profile.streak)
  await profile.save()
  return profile
}

export const exportSnapshot = async (userId) => {
  const [state, quests, habits, rewards, rewardLog, awakening] = await Promise.all([
    GameProfile.findOne({ user: userId }).lean(),
    Quest.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    Habit.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    Reward.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    RewardLog.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    Awakening.findOne({ user: userId }).lean(),
  ])

  const base = createDefaultState()
  return {
    version: 1,
    state: state ? {
      schemaVersion: state.schemaVersion,
      historyVersion: state.historyVersion,
      xp: state.xp,
      level: state.level,
      gold: state.gold,
      streak: state.streak,
      rank: state.rank,
      firstUseAt: state.firstUseAt,
      totalXPEarned: state.totalXPEarned,
      totalXPLost: state.totalXPLost,
      totalGoldEarned: state.totalGoldEarned,
      totalGoldSpent: state.totalGoldSpent,
      longestStreak: state.longestStreak,
      daysMissedTotal: state.daysMissedTotal,
      perfectDaysCount: state.perfectDaysCount,
      dailyHistory: state.dailyHistory,
      gradingHistory: state.gradingHistory,
      analyticsLog: state.analyticsLog,
      unlockedAchievements: state.unlockedAchievements,
      behaviorInsights: state.behaviorInsights,
      todaySummary: state.todaySummary,
      weeklyPerformance: state.weeklyPerformance,
      profile: state.profile,
      settings: state.settings,
    } : base,
    quests: quests.map((quest) => ({ id: quest.questId, title: quest.title, difficulty: quest.difficulty, xp: quest.xp, gold: quest.gold, deadline: quest.deadline, status: quest.status, createdAt: quest.createdAt, updatedAt: quest.updatedAt, completedAt: quest.completedAt, failedAt: quest.failedAt })),
    habits: habits.map((habit) => ({ id: habit.habitId, title: habit.title, xpReward: habit.xpReward, xpPenalty: habit.xpPenalty, required: habit.required, locked: habit.locked, category: habit.category, streak: habit.streak, history: habit.history, lastCompleted: habit.lastCompleted, createdAt: habit.createdAt, updatedAt: habit.updatedAt })),
    rewards: rewards.map((reward) => ({ id: reward.rewardId, title: reward.title, description: reward.description, cost: reward.cost, cooldownDays: reward.cooldownDays, redeemCount: reward.redeemCount, lastRedeemedAt: reward.lastRedeemedAt })),
    rewardLog: rewardLog.map((entry) => ({ id: entry._id.toString(), title: entry.title, cost: entry.cost, at: entry.at, rewardId: entry.rewardId })),
    awakening: awakening ? { vision: awakening.vision, antiVision: awakening.antiVision } : { vision: '', antiVision: '' },
    focusId: state?.focusQuestId || '',
  }
}

export const importSnapshot = async (userId, payload = {}) => {
  const state = payload.state || {}
  const profile = await getProfileOrThrow(userId)

  profile.schemaVersion = state.schemaVersion ?? profile.schemaVersion
  profile.historyVersion = state.historyVersion ?? profile.historyVersion
  profile.xp = clampNumber(state.xp, 0)
  profile.level = Math.max(1, clampInt(state.level, 1, 100000))
  profile.gold = clampNumber(state.gold, 0)
  profile.streak = clampNumber(state.streak, 0)
  profile.rank = rankFromLevel(profile.level)
  profile.firstUseAt = state.firstUseAt || profile.firstUseAt
  profile.totalXPEarned = clampNumber(state.totalXPEarned, profile.totalXPEarned)
  profile.totalXPLost = clampNumber(state.totalXPLost, profile.totalXPLost)
  profile.totalGoldEarned = clampNumber(state.totalGoldEarned, profile.totalGoldEarned)
  profile.totalGoldSpent = clampNumber(state.totalGoldSpent, profile.totalGoldSpent)
  profile.longestStreak = clampNumber(state.longestStreak, profile.longestStreak)
  profile.daysMissedTotal = clampNumber(state.daysMissedTotal, profile.daysMissedTotal)
  profile.perfectDaysCount = clampNumber(state.perfectDaysCount, profile.perfectDaysCount)
  profile.dailyHistory = state.dailyHistory || {}
  profile.gradingHistory = state.gradingHistory || {}
  profile.analyticsLog = state.analyticsLog || []
  profile.unlockedAchievements = state.unlockedAchievements || {}
  profile.behaviorInsights = state.behaviorInsights || profile.behaviorInsights
  profile.todaySummary = state.todaySummary ?? profile.todaySummary
  profile.weeklyPerformance = state.weeklyPerformance || profile.weeklyPerformance
  profile.profile = normalizeProfile(state.profile || profile.profile)
  profile.settings = normalizeSettings(state.settings || profile.settings)
  profile.focusQuestId = typeof payload.focusId === 'string' ? payload.focusId : profile.focusQuestId
  await profile.save()

  if (Array.isArray(payload.habits)) {
    await Habit.deleteMany({ user: userId })
    if (payload.habits.length) {
      await Habit.insertMany(payload.habits.map((habit) => ({ user: userId, habitId: habit.id, title: habit.title, xpReward: habit.xpReward, xpPenalty: habit.xpPenalty, required: habit.required ?? true, locked: habit.locked ?? true, category: habit.category || 'Fixed', streak: habit.streak || 0, history: habit.history || {}, lastCompleted: habit.lastCompleted || '', createdAt: habit.createdAt, updatedAt: habit.updatedAt })))
    }
  }

  if (Array.isArray(payload.quests)) {
    await Quest.deleteMany({ user: userId })
    if (payload.quests.length) {
      await Quest.insertMany(payload.quests.map((quest) => ({ user: userId, questId: quest.id, title: quest.title, difficulty: quest.difficulty, xp: quest.xp, gold: quest.gold, deadline: quest.deadline || '', status: quest.status || 'active', completedAt: quest.completedAt ?? null, failedAt: quest.failedAt ?? null, createdAt: quest.createdAt, updatedAt: quest.updatedAt })))
    }
  }

  if (Array.isArray(payload.rewards)) {
    await Reward.deleteMany({ user: userId })
    if (payload.rewards.length) {
      await Reward.insertMany(payload.rewards.map((reward) => ({ user: userId, rewardId: reward.id, title: reward.title, description: reward.description || '', cost: reward.cost || 0, cooldownDays: reward.cooldownDays || 1, redeemCount: reward.redeemCount || 0, lastRedeemedAt: reward.lastRedeemedAt || '' })))
    }
  }

  if (Array.isArray(payload.rewardLog)) {
    await RewardLog.deleteMany({ user: userId })
    if (payload.rewardLog.length) {
      await RewardLog.insertMany(payload.rewardLog.map((entry) => ({ user: userId, rewardId: entry.rewardId || '', title: entry.title, cost: entry.cost, at: entry.at })))
    }
  }

  if (payload.awakening) {
    await Awakening.findOneAndUpdate({ user: userId }, { vision: payload.awakening.vision || '', antiVision: payload.awakening.antiVision || '' }, { upsert: true, new: true })
  }
}

export const resetSeason = async (userId) => {
  const profile = await getProfileOrThrow(userId)
  const base = createDefaultState()
  profile.xp = base.xp
  profile.level = base.level
  profile.gold = base.gold
  profile.streak = base.streak
  profile.rank = base.rank
  profile.totalXPEarned = 0
  profile.totalXPLost = 0
  profile.totalGoldEarned = 0
  profile.totalGoldSpent = 0
  profile.longestStreak = 0
  profile.daysMissedTotal = 0
  profile.perfectDaysCount = 0
  profile.dailyHistory = {}
  profile.gradingHistory = {}
  profile.analyticsLog = []
  profile.unlockedAchievements = {}
  profile.behaviorInsights = base.behaviorInsights
  profile.todaySummary = null
  profile.weeklyPerformance = base.weeklyPerformance
  profile.focusQuestId = ''
  await profile.save()
  await RewardLog.deleteMany({ user: userId })
}

export const hardReset = async (userId) => {
  await Promise.all([
    GameProfile.deleteOne({ user: userId }),
    Habit.deleteMany({ user: userId }),
    Quest.deleteMany({ user: userId }),
    Reward.deleteMany({ user: userId }),
    RewardLog.deleteMany({ user: userId }),
    Awakening.deleteOne({ user: userId }),
  ])
  await ensureGameDataForUser(userId)
}
