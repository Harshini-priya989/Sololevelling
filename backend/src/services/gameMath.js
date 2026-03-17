export const toDateKey = (value = new Date()) => new Date(value).toISOString().slice(0, 10)

export const clampNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isNaN(number) ? fallback : number
}

export const clampInt = (value, min, max) => Math.min(max, Math.max(min, Math.round(clampNumber(value, min))))

export const rankFromLevel = (level) => {
  if (level >= 100) return 'S'
  if (level >= 80) return 'A'
  if (level >= 60) return 'B'
  if (level >= 40) return 'C'
  if (level >= 20) return 'D'
  return 'E'
}

export const xpForNextLevel = (level) => Math.round(100 + (Math.max(1, level) - 1) * 25)

export const applyXpChange = ({ xp, level }, delta) => {
  let nextXp = Math.max(0, clampNumber(xp, 0) + clampNumber(delta, 0))
  let nextLevel = Math.max(1, clampInt(level, 1, 100000))

  while (nextXp >= xpForNextLevel(nextLevel)) {
    nextXp -= xpForNextLevel(nextLevel)
    nextLevel += 1
  }

  return { xp: Math.max(0, nextXp), level: nextLevel }
}

export const normalizeSeverity = (value) => {
  if (value === 'Low' || value === 'Medium' || value === 'High') return value
  return 'Medium'
}

export const penaltyBySeverity = { Low: 0.5, Medium: 1, High: 1.5 }

export const mergeDailyHistory = (dailyHistory = {}, dateKey, patch = {}) => {
  const base = {
    xpGained: 0,
    xpLost: 0,
    goldGained: 0,
    goldSpent: 0,
    habitsDone: 0,
    habitsMissed: 0,
    questsDone: 0,
    questsFailed: 0,
    totalHabits: 0,
    perfectDay: false,
    ...(dailyHistory[dateKey] || {}),
  }

  return {
    ...dailyHistory,
    [dateKey]: {
      ...base,
      ...patch,
      xpGained: base.xpGained + (patch.xpGainedDelta || 0),
      xpLost: base.xpLost + (patch.xpLostDelta || 0),
      goldGained: base.goldGained + (patch.goldGainedDelta || 0),
      goldSpent: base.goldSpent + (patch.goldSpentDelta || 0),
      habitsDone: base.habitsDone + (patch.habitsDoneDelta || 0),
      habitsMissed: base.habitsMissed + (patch.habitsMissedDelta || 0),
      questsDone: base.questsDone + (patch.questsDoneDelta || 0),
      questsFailed: base.questsFailed + (patch.questsFailedDelta || 0),
    },
  }
}
