import { Habit } from '../models/Habit.js'
import { applyXpTransaction, getProfileOrThrow } from '../services/gameStateService.js'
import { toDateKey } from '../services/gameMath.js'

export const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ user: req.user._id }).sort({ createdAt: 1 }).lean()
    res.json({ habits })
  } catch (error) {
    next(error)
  }
}

export const completeHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ user: req.user._id, habitId: req.params.habitId })
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' })
    }

    const today = toDateKey()
    if (habit.lastCompleted === today) {
      return res.status(400).json({ message: 'Habit already completed today' })
    }

    const now = new Date()
    const history = { ...(habit.history || {}), [today]: 1 }
    const last = habit.lastCompleted ? new Date(habit.lastCompleted) : null
    const diffDays = last ? Math.floor((now - last) / (1000 * 60 * 60 * 24)) : null
    habit.streak = diffDays === 1 ? habit.streak + 1 : 1
    habit.history = history
    habit.lastCompleted = today
    await habit.save()

    const profile = await getProfileOrThrow(req.user._id)
    applyXpTransaction(profile, habit.xpReward, { trackHistory: true, dateKey: today, historyPatch: { habitsDoneDelta: 1 } })
    await profile.save()

    res.json({ message: 'Habit completed', habit, state: profile })
  } catch (error) {
    next(error)
  }
}
