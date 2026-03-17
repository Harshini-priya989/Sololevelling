import mongoose from 'mongoose'
import { createDefaultState } from '../constants/gameDefaults.js'

const defaults = createDefaultState()

const gameProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    schemaVersion: { type: Number, default: defaults.schemaVersion },
    historyVersion: { type: Number, default: defaults.historyVersion },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    gold: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    rank: { type: String, default: 'E' },
    firstUseAt: { type: String, default: () => new Date().toISOString() },
    totalXPEarned: { type: Number, default: 0 },
    totalXPLost: { type: Number, default: 0 },
    totalGoldEarned: { type: Number, default: 0 },
    totalGoldSpent: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    daysMissedTotal: { type: Number, default: 0 },
    perfectDaysCount: { type: Number, default: 0 },
    dailyHistory: { type: mongoose.Schema.Types.Mixed, default: {} },
    gradingHistory: { type: mongoose.Schema.Types.Mixed, default: {} },
    analyticsLog: { type: [mongoose.Schema.Types.Mixed], default: [] },
    unlockedAchievements: { type: mongoose.Schema.Types.Mixed, default: {} },
    behaviorInsights: { type: mongoose.Schema.Types.Mixed, default: defaults.behaviorInsights },
    todaySummary: { type: mongoose.Schema.Types.Mixed, default: null },
    weeklyPerformance: { type: mongoose.Schema.Types.Mixed, default: defaults.weeklyPerformance },
    profile: { type: mongoose.Schema.Types.Mixed, default: defaults.profile },
    settings: { type: mongoose.Schema.Types.Mixed, default: defaults.settings },
    focusQuestId: { type: String, default: '' },
  },
  { timestamps: true }
)

export const GameProfile = mongoose.model('GameProfile', gameProfileSchema)
