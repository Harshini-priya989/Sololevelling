import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  buildBehaviorInsight,
  buildDailyHistory,
  buildHabitPatternStats,
  buildTodayTaskSnapshot,
  buildWeeklyPerformance,
  getAccountAgeDays,
  getDisciplineMetrics,
  resolveFirstUseDate,
  toDateKey,
  upsertAnalyticsLog,
  upsertDailyGrade,
} from '../utils/analytics'
import { evaluateAchievementUnlocks } from '../utils/achievements'
import { rankFromLevel } from '../utils/rankSystem'
import { applyXpChange, xpForNextLevel } from '../utils/xpSystem'
import { api } from '../utils/api'
import { getCurrentSnapshot, hydrateSnapshotLocally, readStorage, storageKeys, writeStorage } from '../utils/storage'

const { STORAGE_KEY, QUESTS_KEY, HABITS_KEY, REWARD_LOG_KEY } = storageKeys
const MAX_HISTORY_WINDOW_DAYS = 3650
const STATE_SCHEMA_VERSION = 3
const DEFAULT_PROFILE = { playerName: 'Hunter', title: 'Shadow Trainee' }
const DEFAULT_SETTINGS = { xpMultiplier: 1, penaltySeverity: 'Medium', dailyXpCapEnabled: false, dailyXpCap: 500, habitPenalties: true, streakResetOnMiss: true, habitReminder: false, questPenalties: true, autoFailOverdueQuests: true, darkMode: true, themeMode: 'dark', glowIntensity: 70, reduceAnimations: false, streakWarnings: true, dailyGoalReminders: true }
const penaltyBySeverity = { Low: 0.5, Medium: 1, High: 1.5 }
const GameContext = createContext(null)

const clampNumber = (value, fallback = 0) => { const number = Number(value); return Number.isNaN(number) ? fallback : number }
const clampInt = (value, min, max) => Math.min(max, Math.max(min, Math.round(clampNumber(value, min))))
const normalizeSeverity = (value) => (value === 'Low' || value === 'High' || value === 'Medium' ? value : 'Medium')
const normalizeProfile = (profile = {}) => ({ playerName: String(profile.playerName || DEFAULT_PROFILE.playerName).trim() || DEFAULT_PROFILE.playerName, title: String(profile.title || DEFAULT_PROFILE.title).trim() || DEFAULT_PROFILE.title })
const normalizeThemeMode = (value, darkModeFallback = true) => (value === 'light' || value === 'dark' ? value : darkModeFallback ? 'dark' : 'light')
const normalizeSettings = (settings = {}) => {
  const inferredTheme = normalizeThemeMode(settings.themeMode, settings.darkMode !== false)
  return {
    xpMultiplier: Math.max(0.5, Math.min(2, clampNumber(settings.xpMultiplier, DEFAULT_SETTINGS.xpMultiplier))),
    penaltySeverity: normalizeSeverity(settings.penaltySeverity || DEFAULT_SETTINGS.penaltySeverity),
    dailyXpCapEnabled: Boolean(settings.dailyXpCapEnabled),
    dailyXpCap: Math.max(0, clampInt(settings.dailyXpCap, 0, 5000)),
    habitPenalties: settings.habitPenalties === undefined ? DEFAULT_SETTINGS.habitPenalties : Boolean(settings.habitPenalties),
    streakResetOnMiss: settings.streakResetOnMiss === undefined ? DEFAULT_SETTINGS.streakResetOnMiss : Boolean(settings.streakResetOnMiss),
    habitReminder: settings.habitReminder === undefined ? DEFAULT_SETTINGS.habitReminder : Boolean(settings.habitReminder),
    questPenalties: settings.questPenalties === undefined ? DEFAULT_SETTINGS.questPenalties : Boolean(settings.questPenalties),
    autoFailOverdueQuests: settings.autoFailOverdueQuests === undefined ? DEFAULT_SETTINGS.autoFailOverdueQuests : Boolean(settings.autoFailOverdueQuests),
    darkMode: settings.darkMode === undefined ? inferredTheme === 'dark' : Boolean(settings.darkMode),
    themeMode: inferredTheme,
    glowIntensity: clampInt(settings.glowIntensity, 0, 100),
    reduceAnimations: settings.reduceAnimations === undefined ? DEFAULT_SETTINGS.reduceAnimations : Boolean(settings.reduceAnimations),
    streakWarnings: settings.streakWarnings === undefined ? DEFAULT_SETTINGS.streakWarnings : Boolean(settings.streakWarnings),
    dailyGoalReminders: settings.dailyGoalReminders === undefined ? DEFAULT_SETTINGS.dailyGoalReminders : Boolean(settings.dailyGoalReminders),
  }
}
const normalizeHistoryRow = (row = {}) => ({ xpGained: Math.max(0, clampNumber(row.xpGained, 0)), xpLost: Math.max(0, clampNumber(row.xpLost, 0)), goldGained: Math.max(0, clampNumber(row.goldGained, 0)), goldSpent: Math.max(0, clampNumber(row.goldSpent, 0)), habitsDone: Math.max(0, clampNumber(row.habitsDone, 0)), habitsMissed: Math.max(0, clampNumber(row.habitsMissed, 0)), questsDone: Math.max(0, clampNumber(row.questsDone, 0)), questsFailed: Math.max(0, clampNumber(row.questsFailed, 0)), totalHabits: Math.max(0, clampNumber(row.totalHabits, 0)), perfectDay: Boolean(row.perfectDay) })
const mergeDailyHistory = (dailyHistory = {}, dateKey, patch = {}) => {
  const base = normalizeHistoryRow(dailyHistory[dateKey])
  const next = normalizeHistoryRow({ ...base, ...patch, xpGained: base.xpGained + Math.max(0, clampNumber(patch.xpGainedDelta, 0)), xpLost: base.xpLost + Math.max(0, clampNumber(patch.xpLostDelta, 0)), goldGained: base.goldGained + Math.max(0, clampNumber(patch.goldGainedDelta, 0)), goldSpent: base.goldSpent + Math.max(0, clampNumber(patch.goldSpentDelta, 0)), habitsDone: base.habitsDone + Math.max(0, clampNumber(patch.habitsDoneDelta, 0)), habitsMissed: base.habitsMissed + Math.max(0, clampNumber(patch.habitsMissedDelta, 0)), questsDone: base.questsDone + Math.max(0, clampNumber(patch.questsDoneDelta, 0)), questsFailed: base.questsFailed + Math.max(0, clampNumber(patch.questsFailedDelta, 0)) })
  return { ...dailyHistory, [dateKey]: next }
}
const totalAbsoluteXp = (level, xp) => { let total = Math.max(0, clampNumber(xp, 0)); for (let next = 1; next < Math.max(1, clampInt(level, 1, 100000)); next += 1) total += xpForNextLevel(next); return total }
const applyXpDelta = (state, delta) => { const next = applyXpChange({ xp: state.xp, level: state.level }, delta); return { ...state, ...next, rank: rankFromLevel(next.level) } }
const createDefaultState = () => ({ schemaVersion: STATE_SCHEMA_VERSION, historyVersion: 2, xp: 0, level: 1, gold: 0, streak: 0, rank: 'E', firstUseAt: new Date().toISOString(), totalXPEarned: 0, totalXPLost: 0, totalGoldEarned: 0, totalGoldSpent: 0, longestStreak: 0, daysMissedTotal: 0, perfectDaysCount: 0, dailyHistory: {}, gradingHistory: {}, analyticsLog: [], unlockedAchievements: {}, behaviorInsights: { title: '', message: '', severity: 'low', taskId: '', taskTitle: '' }, todaySummary: null, weeklyPerformance: { daily: [], totalTasksCompleted: 0, weeklyXP: 0, averageCompletion: 0, bestDay: null, worstDay: null }, profile: DEFAULT_PROFILE, settings: DEFAULT_SETTINGS })

const loadState = () => {
  if (typeof window === 'undefined') return createDefaultState()
  const parsed = readStorage(STORAGE_KEY, null)
  if (!parsed) return createDefaultState()
  const level = Math.max(1, clampInt(parsed.level, 1, 100000))
  const xp = Math.max(0, clampNumber(parsed.xp, 0))
  const gold = Math.max(0, clampNumber(parsed.gold, 0))
  const streak = Math.max(0, clampInt(parsed.streak, 0, 100000))
  const rank = rankFromLevel(level)
  const quests = readStorage(QUESTS_KEY, [])
  const habits = readStorage(HABITS_KEY, [])
  const rewardLog = readStorage(REWARD_LOG_KEY, [])
  const firstUseAt = parsed.firstUseAt || resolveFirstUseDate({ state: parsed, quests, habits, rewardLog, dailyHistory: parsed.dailyHistory || {} })
  const safeDailyHistory = Object.fromEntries(Object.entries(parsed.dailyHistory || {}).map(([dateKey, row]) => [dateKey, normalizeHistoryRow(row)]))
  const absoluteXp = totalAbsoluteXp(level, xp)
  return { ...createDefaultState(), schemaVersion: STATE_SCHEMA_VERSION, xp, level, gold, streak, rank, firstUseAt, totalXPEarned: Math.max(absoluteXp, clampNumber(parsed.totalXPEarned, absoluteXp)), totalXPLost: Math.max(0, clampNumber(parsed.totalXPLost, 0)), totalGoldEarned: Math.max(gold, clampNumber(parsed.totalGoldEarned, gold)), totalGoldSpent: Math.max(0, clampNumber(parsed.totalGoldSpent, 0)), longestStreak: Math.max(streak, clampInt(parsed.longestStreak, streak, 100000)), daysMissedTotal: Math.max(0, clampInt(parsed.daysMissedTotal, 0, 100000)), perfectDaysCount: Math.max(0, clampInt(parsed.perfectDaysCount, 0, 100000)), dailyHistory: safeDailyHistory, gradingHistory: parsed.gradingHistory || {}, analyticsLog: Array.isArray(parsed.analyticsLog) ? parsed.analyticsLog : [], unlockedAchievements: parsed.unlockedAchievements || {}, behaviorInsights: parsed.behaviorInsights || createDefaultState().behaviorInsights, todaySummary: parsed.todaySummary || null, weeklyPerformance: parsed.weeklyPerformance || createDefaultState().weeklyPerformance, profile: normalizeProfile(parsed.profile), settings: normalizeSettings(parsed.settings) }
}

const syncDerivedSystems = (prevState) => {
  if (typeof window === 'undefined') return prevState
  const quests = readStorage(QUESTS_KEY, [])
  const habits = readStorage(HABITS_KEY, [])
  const rewardLog = readStorage(REWARD_LOG_KEY, [])
  const now = new Date()
  const firstUseAt = prevState.firstUseAt || resolveFirstUseDate({ state: prevState, quests, habits, rewardLog, dailyHistory: prevState.dailyHistory })
  const historyWindowDays = Math.max(1, Math.min(MAX_HISTORY_WINDOW_DAYS, getAccountAgeDays(firstUseAt, now)))
  const historyRows = buildDailyHistory({ habits, quests, rewardLog, dailyHistory: prevState.dailyHistory || {}, days: historyWindowDays, endDate: now })
  const discipline = getDisciplineMetrics(historyRows, now, firstUseAt)
  const todaySummary = buildTodayTaskSnapshot({ habits, quests, dailyHistory: prevState.dailyHistory || {}, date: now, settings: prevState.settings })
  const gradingHistory = upsertDailyGrade(prevState.gradingHistory || {}, todaySummary)
  const analyticsLog = upsertAnalyticsLog(prevState.analyticsLog || [], todaySummary, 200)
  const weeklyPerformance = buildWeeklyPerformance({ historyRows, gradingHistory, endDate: now })
  const habitPatternStats = buildHabitPatternStats({ habits, days: 30, endDate: now })
  const behaviorInsights = buildBehaviorInsight({ habitPatternStats })
  const unlockedAchievements = evaluateAchievementUnlocks({ unlocked: prevState.unlockedAchievements || {}, discipline, weeklyPerformance, gradingHistory, historyRows, now })
  return { ...prevState, firstUseAt, longestStreak: Math.max(prevState.longestStreak || 0, prevState.streak || 0, discipline.longestStreak), daysMissedTotal: discipline.daysMissedTotal, perfectDaysCount: discipline.perfectDaysCount, gradingHistory, analyticsLog, unlockedAchievements, behaviorInsights, todaySummary, weeklyPerformance }
}

const applyXpTransaction = (prevState, requestedDelta, options = {}) => {
  const dateKey = options.dateKey || toDateKey(new Date())
  const settings = normalizeSettings(prevState.settings)
  let delta = clampNumber(requestedDelta, 0)
  if (delta > 0) {
    if (!options.ignoreMultiplier) delta *= settings.xpMultiplier
    delta = Math.max(0, Math.round(delta))
    if (!options.ignoreDailyCap && settings.dailyXpCapEnabled) {
      const cap = Math.max(0, clampNumber(settings.dailyXpCap, 0))
      const todayHistory = normalizeHistoryRow((prevState.dailyHistory || {})[dateKey])
      delta = Math.min(delta, Math.max(0, cap - todayHistory.xpGained))
    }
  } else if (delta < 0) {
    let loss = Math.abs(delta)
    if (!options.ignorePenaltyScale) loss *= penaltyBySeverity[settings.penaltySeverity] || 1
    delta = -Math.max(0, Math.round(loss))
  }
  if (!delta) return prevState
  const beforeAbsolute = totalAbsoluteXp(prevState.level, prevState.xp)
  const withXp = applyXpDelta(prevState, delta)
  const appliedDelta = totalAbsoluteXp(withXp.level, withXp.xp) - beforeAbsolute
  if (!appliedDelta) return prevState
  let nextState = { ...withXp, totalXPEarned: prevState.totalXPEarned + (options.countTotals === false ? 0 : Math.max(0, appliedDelta)), totalXPLost: prevState.totalXPLost + (options.countTotals === false ? 0 : Math.max(0, -appliedDelta)), longestStreak: Math.max(prevState.longestStreak || 0, prevState.streak || 0) }
  if (options.trackHistory) nextState = { ...nextState, dailyHistory: mergeDailyHistory(prevState.dailyHistory, dateKey, { xpGainedDelta: Math.max(0, appliedDelta), xpLostDelta: Math.max(0, -appliedDelta), ...(options.historyPatch || {}) }) }
  return nextState
}
const applyGoldTransaction = (prevState, requestedDelta, options = {}) => {
  const dateKey = options.dateKey || toDateKey(new Date())
  const delta = clampNumber(requestedDelta, 0)
  if (!delta) return prevState
  let appliedDelta = delta
  if (delta < 0) appliedDelta = -Math.min(Math.max(0, clampNumber(prevState.gold, 0)), Math.abs(delta))
  if (!appliedDelta) return prevState
  let nextState = { ...prevState, gold: Math.max(0, clampNumber(prevState.gold, 0) + appliedDelta), totalGoldEarned: prevState.totalGoldEarned + (options.countTotals === false ? 0 : Math.max(0, appliedDelta)), totalGoldSpent: prevState.totalGoldSpent + (options.countTotals === false ? 0 : Math.max(0, -appliedDelta)) }
  if (options.trackHistory) nextState = { ...nextState, dailyHistory: mergeDailyHistory(prevState.dailyHistory, dateKey, { goldGainedDelta: Math.max(0, appliedDelta), goldSpentDelta: Math.max(0, -appliedDelta), ...(options.historyPatch || {}) }) }
  return nextState
}

export function GameProvider({ children }) {
  const [state, setState] = useState(createDefaultState())
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState('')

  const syncFromBackend = async () => {
    const snapshot = await api.get('/game/overview')
    hydrateSnapshotLocally(snapshot)
    const next = syncDerivedSystems(loadState())
    setState(next)
    return snapshot
  }

  useEffect(() => {
    let mounted = true
    const bootstrap = async () => {
      try {
        const snapshot = await api.get('/game/overview')
        if (!mounted) return
        hydrateSnapshotLocally(snapshot)
        setState(syncDerivedSystems(loadState()))
        setSyncError('')
      } catch (error) {
        if (mounted) setSyncError(error.message || 'Failed to connect to backend')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    bootstrap()
    return () => { mounted = false }
  }, [])

  useEffect(() => { if (typeof window !== 'undefined') writeStorage(STORAGE_KEY, state) }, [state])
  useEffect(() => { if (typeof window !== 'undefined') { const themeMode = state.settings?.themeMode === 'light' ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', themeMode); document.documentElement.style.colorScheme = themeMode } }, [state.settings?.themeMode])

  const refreshDailySystems = () => setState((prev) => syncDerivedSystems(prev))
  const addXP = (amount, meta = {}) => setState((prev) => syncDerivedSystems(applyXpTransaction(prev, amount, meta)))
  const removeXP = (amount, meta = {}) => setState((prev) => syncDerivedSystems(applyXpTransaction(prev, -amount, meta)))
  const addGold = (amount, meta = {}) => setState((prev) => syncDerivedSystems(applyGoldTransaction(prev, amount, meta)))
  const spendGold = (amount, meta = {}) => setState((prev) => syncDerivedSystems(applyGoldTransaction(prev, -amount, meta)))
  const setStreak = async (value) => { await api.patch('/game/streak', { streak: value }); await syncFromBackend() }
  const incrementStreak = async () => { await api.patch('/game/streak', { streak: (state.streak || 0) + 1 }); await syncFromBackend() }
  const resetStreak = async () => { await api.patch('/game/streak', { streak: 0 }); await syncFromBackend() }
  const syncHabitStreak = async () => { await api.post('/game/sync-streak'); await syncFromBackend() }
  const updateProfile = async (patch = {}) => { await api.put('/game/profile', patch); await syncFromBackend() }
  const updateSettings = async (patch = {}) => {
    const normalizedPatch = { ...patch }
    if (Object.prototype.hasOwnProperty.call(patch, 'darkMode') && !Object.prototype.hasOwnProperty.call(patch, 'themeMode')) normalizedPatch.themeMode = patch.darkMode ? 'dark' : 'light'
    if (Object.prototype.hasOwnProperty.call(patch, 'themeMode') && !Object.prototype.hasOwnProperty.call(patch, 'darkMode')) normalizedPatch.darkMode = patch.themeMode !== 'light'
    await api.put('/game/settings', normalizedPatch)
    await syncFromBackend()
  }
  const resetAllData = async () => { await api.post('/game/hard-reset'); await syncFromBackend() }

  const nextLevelXP = useMemo(() => xpForNextLevel(state.level), [state.level])
  const xpPercent = useMemo(() => (nextLevelXP === 0 ? 0 : Math.min(100, Math.round((state.xp / nextLevelXP) * 100))), [state.xp, nextLevelXP])
  const value = { ...state, nextLevelXP, xpPercent, addXP, removeXP, addGold, spendGold, setStreak, incrementStreak, resetStreak, syncHabitStreak, refreshDailySystems, updateProfile, updateSettings, resetAllData, syncFromBackend, loading, syncError, getCurrentSnapshot }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#0a0b14] text-slate-200">Syncing hunter profile...</div>
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export const useGame = () => { const context = useContext(GameContext); if (!context) throw new Error('useGame must be used within a GameProvider'); return context }
