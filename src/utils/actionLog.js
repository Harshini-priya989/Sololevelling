import { getCurrentSnapshot, writeStorage } from './storage'

const ACTION_KEY = 'solo_leveling_last_action_v1'

export const setLastAction = (action) => {
  if (!action) return
  writeStorage(ACTION_KEY, {
    ...action,
    snapshot: action.snapshot || getCurrentSnapshot(),
    timestamp: new Date().toISOString(),
  })
}

export const getLastAction = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ACTION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    return null
  }
}

export const clearLastAction = () => writeStorage(ACTION_KEY, null)
