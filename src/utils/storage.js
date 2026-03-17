const STORAGE_KEY = 'solo_leveling_state_v1'
const QUESTS_KEY = 'solo_leveling_quests_v1'
const HABITS_KEY = 'solo_leveling_habits_v1'
const REWARDS_KEY = 'solo_leveling_rewards_v1'
const REWARD_LOG_KEY = 'solo_leveling_reward_log_v1'
const AWAKENING_KEY = 'solo_leveling_awakening_v1'
const FOCUS_KEY = 'solo_leveling_focus_v1'

export const safeParse = (value, fallback) => {
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return safeParse(raw, fallback)
  } catch {
    return fallback
  }
}

export const writeStorage = (key, value) => {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export const readString = (key, fallback = '') => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ?? fallback
  } catch {
    return fallback
  }
}

export const writeString = (key, value) => {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, value) } catch {}
}

export const getCurrentSnapshot = () => ({
  version: 1,
  state: readStorage(STORAGE_KEY, {}),
  quests: readStorage(QUESTS_KEY, []),
  habits: readStorage(HABITS_KEY, []),
  rewards: readStorage(REWARDS_KEY, []),
  rewardLog: readStorage(REWARD_LOG_KEY, []),
  awakening: readStorage(AWAKENING_KEY, {}),
  focusId: readString(FOCUS_KEY, ''),
})

export const hydrateSnapshotLocally = (snapshot = {}) => {
  if (typeof window === 'undefined') return
  if (snapshot.state) writeStorage(STORAGE_KEY, snapshot.state)
  if (snapshot.quests) writeStorage(QUESTS_KEY, snapshot.quests)
  if (snapshot.habits) writeStorage(HABITS_KEY, snapshot.habits)
  if (snapshot.rewards) writeStorage(REWARDS_KEY, snapshot.rewards)
  if (snapshot.rewardLog) writeStorage(REWARD_LOG_KEY, snapshot.rewardLog)
  if (snapshot.awakening) writeStorage(AWAKENING_KEY, snapshot.awakening)
  if (typeof snapshot.focusId === 'string') writeString(FOCUS_KEY, snapshot.focusId)
}

export const clearLocalGameCache = () => {
  if (typeof window === 'undefined') return
  ;[STORAGE_KEY, QUESTS_KEY, HABITS_KEY, REWARDS_KEY, REWARD_LOG_KEY, AWAKENING_KEY, FOCUS_KEY, 'solo_leveling_last_action_v1'].forEach((key) => window.localStorage.removeItem(key))
}

export const storageKeys = { STORAGE_KEY, QUESTS_KEY, HABITS_KEY, REWARDS_KEY, REWARD_LOG_KEY, AWAKENING_KEY, FOCUS_KEY }
