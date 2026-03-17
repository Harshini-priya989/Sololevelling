import { GameProfile } from '../models/GameProfile.js'
import { exportSnapshot, hardReset, importSnapshot, resetSeason, setProfileStreak, syncCombinedStreak } from '../services/gameStateService.js'

export const getOverview = async (req, res, next) => {
  try {
    const snapshot = await exportSnapshot(req.user._id)
    res.json(snapshot)
  } catch (error) {
    next(error)
  }
}

export const getState = async (req, res, next) => {
  try {
    const state = await GameProfile.findOne({ user: req.user._id }).lean()
    res.json({ state })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const state = await GameProfile.findOne({ user: req.user._id })
    state.profile = { ...state.profile, ...req.body }
    await state.save()
    res.json({ profile: state.profile })
  } catch (error) {
    next(error)
  }
}

export const updateSettings = async (req, res, next) => {
  try {
    const state = await GameProfile.findOne({ user: req.user._id })
    state.settings = { ...state.settings, ...req.body }
    await state.save()
    res.json({ settings: state.settings })
  } catch (error) {
    next(error)
  }
}

export const updateStreak = async (req, res, next) => {
  try {
    const state = await setProfileStreak(req.user._id, req.body.streak)
    res.json({ streak: state.streak, longestStreak: state.longestStreak })
  } catch (error) {
    next(error)
  }
}

export const syncStreak = async (req, res, next) => {
  try {
    const state = await syncCombinedStreak(req.user._id)
    res.json({ streak: state.streak, longestStreak: state.longestStreak })
  } catch (error) {
    next(error)
  }
}

export const resetGameSeason = async (req, res, next) => {
  try {
    await resetSeason(req.user._id)
    res.json({ message: 'Season reset successfully' })
  } catch (error) {
    next(error)
  }
}

export const hardResetGame = async (req, res, next) => {
  try {
    await hardReset(req.user._id)
    res.json({ message: 'Hard reset completed' })
  } catch (error) {
    next(error)
  }
}

export const exportData = async (req, res, next) => {
  try {
    const snapshot = await exportSnapshot(req.user._id)
    res.json(snapshot)
  } catch (error) {
    next(error)
  }
}

export const importData = async (req, res, next) => {
  try {
    await importSnapshot(req.user._id, req.body)
    const snapshot = await exportSnapshot(req.user._id)
    res.json({ message: 'Snapshot imported successfully', snapshot })
  } catch (error) {
    next(error)
  }
}
