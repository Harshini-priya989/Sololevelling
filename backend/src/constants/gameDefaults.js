export const STATE_SCHEMA_VERSION = 3

export const DEFAULT_PROFILE = {
  playerName: 'Hunter',
  title: 'Shadow Trainee',
}

export const DEFAULT_SETTINGS = {
  xpMultiplier: 1,
  penaltySeverity: 'Medium',
  dailyXpCapEnabled: false,
  dailyXpCap: 500,
  habitPenalties: true,
  streakResetOnMiss: true,
  habitReminder: false,
  questPenalties: true,
  autoFailOverdueQuests: true,
  darkMode: true,
  themeMode: 'dark',
  glowIntensity: 70,
  reduceAnimations: false,
  streakWarnings: true,
  dailyGoalReminders: true,
}

export const FIXED_HABIT_TEMPLATES = [
  { id: 'habit-early-wakeup-college', title: 'Early wake up, fresh & attend college', xpReward: 30, xpPenalty: 10 },
  { id: 'habit-workout', title: 'Workout', xpReward: 35, xpPenalty: 15 },
  { id: 'habit-no-outside-food', title: 'No outside food', xpReward: 25, xpPenalty: 10 },
  { id: 'habit-emotional-strength', title: 'Try to build emotional strength', xpReward: 25, xpPenalty: 10 },
  { id: 'habit-normal-human', title: 'Try to be a normal human', xpReward: 20, xpPenalty: 5 },
]

export const FIXED_QUEST_TEMPLATES = [
  { id: 'quest-practice-leetcode', title: 'Practice on LeetCode', difficulty: 'Hard', xp: 140, gold: 90 },
  { id: 'quest-practice-pyq-goal', title: 'Practice PYQ (Goal)', difficulty: 'Normal', xp: 80, gold: 50 },
  { id: 'quest-meditation', title: 'Meditation', difficulty: 'Easy', xp: 40, gold: 25 },
  { id: 'quest-walk-8000-steps-2km', title: 'Walk 8000 steps or 2 km', difficulty: 'Normal', xp: 80, gold: 50 },
  { id: 'quest-practice-communication', title: 'Practice communication', difficulty: 'Easy', xp: 40, gold: 25 },
]

export const DEFAULT_REWARDS = [
  { id: 'reward-1', title: '1 Hour Free Time', description: 'Unplug and reset your mind.', cost: 150, cooldownDays: 1 },
  { id: 'reward-2', title: 'Game Session (30 mins)', description: 'Short, guilt-free gaming break.', cost: 75, cooldownDays: 1 },
  { id: 'reward-3', title: 'Special Meal', description: 'Order something legendary.', cost: 200, cooldownDays: 3 },
  { id: 'reward-4', title: 'Movie Night', description: 'One full movie, no multitasking.', cost: 180, cooldownDays: 2 },
]

export const createDefaultState = () => {
  const now = new Date().toISOString()
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    historyVersion: 2,
    xp: 0,
    level: 1,
    gold: 0,
    streak: 0,
    rank: 'E',
    firstUseAt: now,
    totalXPEarned: 0,
    totalXPLost: 0,
    totalGoldEarned: 0,
    totalGoldSpent: 0,
    longestStreak: 0,
    daysMissedTotal: 0,
    perfectDaysCount: 0,
    dailyHistory: {},
    gradingHistory: {},
    analyticsLog: [],
    unlockedAchievements: {},
    behaviorInsights: { title: '', message: '', severity: 'low', taskId: '', taskTitle: '' },
    todaySummary: null,
    weeklyPerformance: {
      daily: [],
      totalTasksCompleted: 0,
      weeklyXP: 0,
      averageCompletion: 0,
      bestDay: null,
      worstDay: null,
    },
    profile: DEFAULT_PROFILE,
    settings: DEFAULT_SETTINGS,
    focusQuestId: '',
  }
}
